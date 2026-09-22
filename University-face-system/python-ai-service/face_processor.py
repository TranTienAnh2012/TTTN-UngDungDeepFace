import cv2
import numpy as np
import base64
import time
from deepface import DeepFace
from mtcnn import MTCNN

MODEL_NAME = "ArcFace"

# Initialize MTCNN detector ONCE at startup
detector = MTCNN()
print("[FaceProcessor] MTCNN detector initialized.")

# Warm up DeepFace ArcFace model to eliminate first-request delay
try:
    _dummy = np.zeros((112, 112, 3), dtype=np.uint8)
    DeepFace.represent(img_path=_dummy, model_name=MODEL_NAME, detector_backend='skip', enforce_detection=False)
    print("[FaceProcessor] DeepFace ArcFace model warmed up successfully.")
except Exception as _e:
    print(f"[FaceProcessor] Warmup warning: {_e}")


def ensure_valid_crop(face_crop):
    """Resize and convert crop to expected shape for ArcFace (uint8, 3 channels, >= 48x48)."""
    if face_crop is None or face_crop.size == 0:
        return np.zeros((112, 112, 3), dtype=np.uint8)

    # Ensure 3 channels
    if len(face_crop.shape) == 2:
        face_crop = cv2.cvtColor(face_crop, cv2.COLOR_GRAY2RGB)
    elif face_crop.shape[2] == 1:
        face_crop = cv2.cvtColor(face_crop, cv2.COLOR_GRAY2RGB)
    elif face_crop.shape[2] == 4:
        face_crop = cv2.cvtColor(face_crop, cv2.COLOR_RGBA2RGB)

    h, w = face_crop.shape[:2]
    if h < 48 or w < 48:
        face_crop = cv2.resize(face_crop, (112, 112), interpolation=cv2.INTER_CUBIC)

    if face_crop.dtype != np.uint8:
        face_crop = face_crop.astype(np.uint8)

    return face_crop


def base64_to_image(base64_string):
    """Decodes a base64 string to a cv2 image (numpy array BGR)"""
    if not base64_string:
        return None
    try:
        if "base64," in base64_string:
            base64_string = base64_string.split("base64,")[1]
        img_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f"[FaceProcessor] Error decoding base64: {e}")
        return None


def check_frame_quality(img):
    """
    Lightweight frame quality check using OpenCV only.
    Tolerant thresholds to prevent false rejections of normal webcam frames.
    """
    if img is None or img.size == 0:
        return False, "null_image"

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    mean_brightness = float(np.mean(gray))
    if mean_brightness < 10:
        return False, f"too_dark ({mean_brightness:.0f})"
    if mean_brightness > 252:
        return False, f"overexposed ({mean_brightness:.0f})"

    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    if laplacian_var < 3.0:
        return False, f"too_blurry ({laplacian_var:.1f})"

    return True, "ok"


def detect_and_extract(image_base64, require_oval=False):
    """
    Detects face using MTCNN and extracts ArcFace embedding from crop.
    
    Returns:
        dict with keys: box, pose, image_size, embedding, quality_ok, quality_reason, timings
    """
    t_start = time.perf_counter()
    try:
        t_decode_start = time.perf_counter()
        img = base64_to_image(image_base64)
        t_decode = time.perf_counter() - t_decode_start

        if img is None:
            return {
                "box": None, "pose": "none", "image_size": [640, 480],
                "embedding": None, "quality_ok": False, "quality_reason": "null_image",
                "timings": {"total": time.perf_counter() - t_start}
            }

        img_h, img_w = img.shape[:2]

        # Stage 1: Quality Check
        t_q_start = time.perf_counter()
        quality_ok, quality_reason = check_frame_quality(img)
        t_quality = time.perf_counter() - t_q_start

        if not quality_ok:
            return {
                "box": None, "pose": "none", "image_size": [img_w, img_h],
                "embedding": None, "quality_ok": False, "quality_reason": quality_reason,
                "timings": {"total": time.perf_counter() - t_start, "quality": t_quality}
            }

        # Stage 2: MTCNN Face Detection
        t_det_start = time.perf_counter()
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = detector.detect_faces(img_rgb)
        t_detect = time.perf_counter() - t_det_start

        if not results:
            return {
                "box": None, "pose": "none", "image_size": [img_w, img_h],
                "embedding": None, "quality_ok": True, "quality_reason": "no_face",
                "timings": {"total": time.perf_counter() - t_start, "quality": t_quality, "detect": t_detect}
            }

        # Filter faces by confidence (>= 0.50, fallback to best if available)
        valid_faces = [f for f in results if f.get('confidence', 0) >= 0.50]
        if not valid_faces and results:
            valid_faces = [max(results, key=lambda d: d.get('confidence', 0))]

        if not valid_faces:
            return {
                "box": None, "pose": "none", "image_size": [img_w, img_h],
                "embedding": None, "quality_ok": True, "quality_reason": "low_confidence",
                "timings": {"total": time.perf_counter() - t_start, "quality": t_quality, "detect": t_detect}
            }

        # Select the largest face in frame
        face = max(valid_faces, key=lambda d: d['box'][2] * d['box'][3])
        x, y, w, h = face['box']

        # Ensure bounding box is within image bounds
        x = max(0, x)
        y = max(0, y)
        w = min(img_w - x, max(1, w))
        h = min(img_h - y, max(1, h))

        box = [int(x), int(y), int(w), int(h)]

        # Determine head pose from facial keypoints
        pose = "straight"
        keypoints = face.get('keypoints')
        if keypoints and 'left_eye' in keypoints and 'right_eye' in keypoints and 'nose' in keypoints:
            left_eye = keypoints['left_eye']
            right_eye = keypoints['right_eye']
            nose = keypoints['nose']

            eye_center_x = (left_eye[0] + right_eye[0]) / 2.0
            eye_span = max(1.0, abs(right_eye[0] - left_eye[0]))
            nose_offset = (nose[0] - eye_center_x) / eye_span

            if abs(nose_offset) < 0.12:
                pose = "straight"
            elif nose_offset > 0.12:
                pose = "left"
            else:
                pose = "right"

        # Stage 3: Extract ArcFace Embedding from Face Crop
        t_emb_start = time.perf_counter()
        padding = int(max(w, h) * 0.18)
        x1 = max(0, x - padding)
        y1 = max(0, y - padding)
        x2 = min(img_w, x + w + padding)
        y2 = min(img_h, y + h + padding)
        face_crop = img_rgb[y1:y2, x1:x2]

        embedding = None
        if face_crop.size > 0:
            try:
                face_crop = ensure_valid_crop(face_crop)
                result = DeepFace.represent(
                    img_path=face_crop,
                    model_name=MODEL_NAME,
                    detector_backend='skip',
                    enforce_detection=False
                )
                if len(result) > 0 and "embedding" in result[0]:
                    embedding = np.array(result[0]["embedding"], dtype=np.float64)
            except Exception as emb_err:
                print(f"[FaceProcessor] Embedding extraction error: {emb_err}")

        t_embed = time.perf_counter() - t_emb_start
        t_total = time.perf_counter() - t_start

        return {
            "box": box,
            "pose": pose,
            "image_size": [img_w, img_h],
            "embedding": embedding,
            "quality_ok": True,
            "quality_reason": "ok",
            "face_confidence": float(face.get('confidence', 1.0)),
            "timings": {
                "decode": t_decode,
                "quality": t_quality,
                "detect": t_detect,
                "embed": t_embed,
                "total": t_total
            }
        }

    except Exception as e:
        print(f"[FaceProcessor] Error in detect_and_extract: {e}")
        import traceback
        traceback.print_exc()
        return {
            "box": None, "pose": "none", "image_size": [640, 480],
            "embedding": None, "quality_ok": False, "quality_reason": str(e),
            "timings": {"total": time.perf_counter() - t_start}
        }


def detect_face_pose(image_base64):
    """Lightweight pose and bounding box detection."""
    try:
        img = base64_to_image(image_base64)
        if img is None:
            return {"box": None, "pose": "none", "image_size": [640, 480]}

        img_h, img_w = img.shape[:2]
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        results = detector.detect_faces(img_rgb)
        if not results:
            return {"box": None, "pose": "none", "image_size": [img_w, img_h]}

        valid_faces = [f for f in results if f.get('confidence', 0) >= 0.45]
        if not valid_faces:
            valid_faces = results

        face = max(valid_faces, key=lambda d: d['box'][2] * d['box'][3])
        x, y, w, h = face['box']
        x = max(0, x)
        y = max(0, y)
        w = min(img_w - x, max(1, w))
        h = min(img_h - y, max(1, h))

        pose = "straight"
        keypoints = face.get('keypoints')
        if keypoints and 'left_eye' in keypoints and 'right_eye' in keypoints and 'nose' in keypoints:
            left_eye = keypoints['left_eye']
            right_eye = keypoints['right_eye']
            nose = keypoints['nose']

            eye_center_x = (left_eye[0] + right_eye[0]) / 2.0
            eye_span = max(1.0, abs(right_eye[0] - left_eye[0]))
            nose_offset = (nose[0] - eye_center_x) / eye_span

            if abs(nose_offset) < 0.12:
                pose = "straight"
            elif nose_offset > 0.12:
                pose = "left"
            else:
                pose = "right"

        return {
            "box": [int(x), int(y), int(w), int(h)],
            "pose": pose,
            "image_size": [img_w, img_h]
        }
    except Exception as e:
        print(f"[FaceProcessor] Error detecting pose: {e}")
        return {"box": None, "pose": "none", "image_size": [640, 480]}


def extract_embedding(image_base64, require_oval=False):
    """Extract embedding for face registration."""
    result = detect_and_extract(image_base64, require_oval=require_oval)
    return result.get("embedding")


def compute_cosine_similarity(vec1, vec2):
    """Cosine similarity between two 1D numpy vectors."""
    if vec1 is None or vec2 is None:
        return 0.0
    dot_product = np.dot(vec1, vec2)
    norm_a = np.linalg.norm(vec1)
    norm_b = np.linalg.norm(vec2)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot_product / (norm_a * norm_b))
