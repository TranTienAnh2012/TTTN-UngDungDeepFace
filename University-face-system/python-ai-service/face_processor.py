import cv2
import numpy as np
import base64
import time
from deepface import DeepFace
from mtcnn import MTCNN

MODEL_NAME = "ArcFace"

# Initialize MTCNN detector ONCE at startup (expensive)
detector = MTCNN()
print(f"[FaceProcessor] MTCNN detector initialized.")
def ensure_valid_crop(face_crop):
    """Resize and convert crop to expected shape for ArcFace.
    Returns a crop with shape (48, 48, 3) and dtype uint8.
    """
    # Record original shape for logging
    original_shape = face_crop.shape if hasattr(face_crop, 'shape') else None
    # Ensure 3 channels
    if len(face_crop.shape) == 2:
        face_crop = cv2.cvtColor(face_crop, cv2.COLOR_GRAY2RGB)
    elif face_crop.shape[2] == 1:
        face_crop = cv2.cvtColor(face_crop, cv2.COLOR_GRAY2RGB)
    # Resize if smaller than 48x48
    h, w = face_crop.shape[:2]
    if h < 48 or w < 48:
        face_crop = cv2.resize(face_crop, (48, 48))
    # Ensure dtype uint8
    if face_crop.dtype != np.uint8:
        face_crop = face_crop.astype(np.uint8)
    print(f"[FaceProcessor] Crop shape before/after: {original_shape} -> {face_crop.shape}")
    return face_crop


def base64_to_image(base64_string):
    """Decodes a base64 string to a cv2 image (numpy array)"""
    if "base64," in base64_string:
        base64_string = base64_string.split("base64,")[1]
    img_data = base64.b64decode(base64_string)
    nparr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

def check_frame_quality(img):
    """
    Quick frame quality pre-filter using OpenCV only (< 2ms).
    Checks brightness and sharpness BEFORE running expensive MTCNN/ArcFace.
    
    Returns: (is_ok: bool, reason: str)
    """
    if img is None:
        return False, "null_image"

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 1. Brightness check — reject frames that are too dark or overexposed
    mean_brightness = float(np.mean(gray))
    if mean_brightness < 30:
        return False, f"too_dark ({mean_brightness:.0f})"
    if mean_brightness > 240:
        return False, f"overexposed ({mean_brightness:.0f})"

    # 2. Sharpness check via Laplacian variance — reject blurry frames
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    if laplacian_var < 50:
        return False, f"too_blurry ({laplacian_var:.1f})"

    return True, "ok"

def detect_and_extract(image_base64):
    """
    OPTIMIZED: Run quality check first (cheap), then MTCNN once,
    then ArcFace on crop with detector_backend='skip'.
    
    Returns:
        dict with keys: box, pose, image_size, embedding (numpy array or None),
                        quality_ok (bool), quality_reason (str), timings (dict)
    """
    t_start = time.perf_counter()
    try:
        t_decode_start = time.perf_counter()
        img = base64_to_image(image_base64)
        t_decode = time.perf_counter() - t_decode_start

        if img is None:
            return {"box": None, "pose": "none", "image_size": [640, 480],
                    "embedding": None, "quality_ok": False, "quality_reason": "null_image",
                    "timings": {"total": time.perf_counter() - t_start}}

        img_h, img_w = img.shape[:2]

        # --- Stage 1: Quality Check (OpenCV) ---
        t_q_start = time.perf_counter()
        quality_ok, quality_reason = check_frame_quality(img)
        t_quality = time.perf_counter() - t_q_start

        if not quality_ok:
            return {"box": None, "pose": "none", "image_size": [img_w, img_h],
                    "embedding": None, "quality_ok": False, "quality_reason": quality_reason,
                    "timings": {"total": time.perf_counter() - t_start, "quality": t_quality}}

        # --- Stage 2: MTCNN Face Detection ---
        t_det_start = time.perf_counter()
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = detector.detect_faces(img_rgb)
        t_detect = time.perf_counter() - t_det_start

        if not results:
            return {"box": None, "pose": "none", "image_size": [img_w, img_h],
                    "embedding": None, "quality_ok": True, "quality_reason": "no_face",
                    "timings": {
                        "total": time.perf_counter() - t_start,
                        "quality": t_quality,
                        "detect": t_detect
                    }}

        # Target Oval geometry relative to image (centered at cx=0.50, cy=0.49, rx=0.22, ry=0.39)
        oval_cx = img_w * 0.50
        oval_cy = img_h * 0.49
        oval_rx = img_w * 0.22  # ~140px on 640w
        oval_ry = img_h * 0.39  # ~190px on 480h

        inside_oval_faces = []
        too_small_inside_faces = []

        for f in results:
            if f['confidence'] < 0.85:
                continue
            fx, fy, fw, fh = f['box']
            fcx = fx + fw / 2.0
            fcy = fy + fh / 2.0

            # Normalized ellipse distance from center (<= 1.0 means INSIDE the oval target)
            ellipse_dist = ((fcx - oval_cx) / oval_rx) ** 2 + ((fcy - oval_cy) / oval_ry) ** 2

            if ellipse_dist <= 1.0:
                # Check face size relative to frame width (at least 14% of image width)
                if (fw / float(img_w)) >= 0.14:
                    inside_oval_faces.append(f)
                else:
                    too_small_inside_faces.append(f)

        if not inside_oval_faces:
            if too_small_inside_faces:
                return {
                    "box": None, "pose": "none", "image_size": [img_w, img_h],
                    "embedding": None, "quality_ok": True, "quality_reason": "face_too_small",
                    "status_text": "📏 Vui lòng xích lại gần hơn (Khuôn mặt quá nhỏ)",
                    "timings": {"total": time.perf_counter() - t_start, "quality": t_quality, "detect": t_detect}
                }
            else:
                return {
                    "box": None, "pose": "none", "image_size": [img_w, img_h],
                    "embedding": None, "quality_ok": True, "quality_reason": "outside_oval_frame",
                    "status_text": "⚠️ Vui lòng di chuyển khuôn mặt vào TRONG khung hình tròn",
                    "timings": {"total": time.perf_counter() - t_start, "quality": t_quality, "detect": t_detect}
                }

        # Select the largest face inside the oval target frame
        face = max(inside_oval_faces, key=lambda d: d['box'][2] * d['box'][3])

        x, y, w, h = face['box']
        keypoints = face['keypoints']
        left_eye = keypoints['left_eye']
        right_eye = keypoints['right_eye']
        nose = keypoints['nose']

        # --- Stage 2.5: Pose estimation (no extra cost) ---
        eye_center_x = (left_eye[0] + right_eye[0]) / 2.0
        eye_span = abs(left_eye[0] - right_eye[0])

        if eye_span < 5:
            pose = "straight"
        else:
            nose_offset = (nose[0] - eye_center_x) / eye_span
            if abs(nose_offset) < 0.15:
                pose = "straight"
            elif nose_offset > 0:
                pose = "left"
            else:
                pose = "right"

        box = [max(0, x), max(0, y), w, h]

        # --- Stage 3: ArcFace on crop ONLY (skip re-detection) ---
        t_emb_start = time.perf_counter()
        padding = int(max(w, h) * 0.15)
        x1 = max(0, x - padding)
        y1 = max(0, y - padding)
        x2 = min(img_w, x + w + padding)
        y2 = min(img_h, y + h + padding)
        face_crop = img_rgb[y1:y2, x1:x2]

        # Additional quality check on face crop itself
        crop_gray = cv2.cvtColor(face_crop, cv2.COLOR_RGB2GRAY) if face_crop.size > 0 else np.array([])
        crop_brightness = float(np.mean(crop_gray)) if crop_gray.size > 0 else 0.0
        crop_sharpness = float(cv2.Laplacian(crop_gray, cv2.CV_64F).var()) if crop_gray.size > 0 else 0.0

        embedding = None
        if face_crop.size > 0 and crop_brightness > 25 and crop_sharpness > 20:
            try:
                # Ensure crop meets model input requirements
                face_crop = ensure_valid_crop(face_crop)
                result = DeepFace.represent(
                    img_path=face_crop,
                    model_name=MODEL_NAME,
                    detector_backend='skip',   # Skip re-detection — use crop directly
                    enforce_detection=False
                )
                if len(result) > 0:
                    embedding = np.array(result[0]["embedding"])
            except Exception as emb_err:
                print(f"[FaceProcessor] Embedding error: {emb_err}")
        t_embed = time.perf_counter() - t_emb_start

        t_total = time.perf_counter() - t_start

        return {
            "box": box,
            "pose": pose,
            "image_size": [img_w, img_h],
            "embedding": embedding,
            "quality_ok": True,
            "quality_reason": "ok",
            "face_confidence": face['confidence'],
            "crop_brightness": crop_brightness,
            "crop_sharpness": crop_sharpness,
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
        return {"box": None, "pose": "none", "image_size": [640, 480],
                "embedding": None, "quality_ok": False, "quality_reason": str(e),
                "timings": {"total": time.perf_counter() - t_start}}


def detect_face_pose(image_base64):
    """
    Lightweight pose-only detection (for face registration step guidance).
    """
    try:
        img = base64_to_image(image_base64)
        if img is None:
            return {"box": None, "pose": "none", "image_size": [640, 480]}

        img_h, img_w = img.shape[:2]
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        results = detector.detect_faces(img_rgb)

        if not results:
            return {"box": None, "pose": "none", "image_size": [img_w, img_h]}

        face = max(results, key=lambda d: d['confidence'])
        x, y, w, h = face['box']
        keypoints = face['keypoints']
        left_eye = keypoints['left_eye']
        right_eye = keypoints['right_eye']
        nose = keypoints['nose']

        eye_center_x = (left_eye[0] + right_eye[0]) / 2.0
        eye_span = abs(left_eye[0] - right_eye[0])

        if eye_span < 5:
            pose = "straight"
        else:
            nose_offset = (nose[0] - eye_center_x) / eye_span
            if abs(nose_offset) < 0.15:
                pose = "straight"
            elif nose_offset > 0:
                pose = "left"
            else:
                pose = "right"

        return {"box": [max(0, x), max(0, y), w, h], "pose": pose, "image_size": [img_w, img_h]}

    except Exception as e:
        print(f"Error detecting pose: {e}")
        return {"box": None, "pose": "none", "image_size": [640, 480]}


def extract_embedding(image_base64):
    """Extract embedding for face registration."""
    result = detect_and_extract(image_base64)
    return result.get("embedding")


def compute_cosine_similarity(vec1, vec2):
    """Cosine similarity between two numpy arrays."""
    dot_product = np.dot(vec1, vec2)
    norm_a = np.linalg.norm(vec1)
    norm_b = np.linalg.norm(vec2)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)
