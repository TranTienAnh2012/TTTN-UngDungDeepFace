import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')
os.environ["PYTHONIOENCODING"] = "utf-8"

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import numpy as np
import time
import asyncio
from dotenv import load_dotenv
import db_mysql
import face_processor

load_dotenv()

app = FastAPI(title="Face Attendance AI Service")

class VerifyRequest(BaseModel):
    student_id: int
    image_base64: str

class DetectPoseRequest(BaseModel):
    image_base64: str

class IdentifyRequest(BaseModel):
    image_base64: str

class Register3StepRequest(BaseModel):
    student_id: int
    image_straight: str
    image_left: str
    image_right: str

class AdminRegister3StepRequest(BaseModel):
    admin_id: int
    image_straight: str
    image_left: str
    image_right: str

MATCH_THRESHOLD = float(os.getenv("MATCH_THRESHOLD", "0.50"))
MARGIN_MIN = float(os.getenv("MATCH_MARGIN", "0.02"))

def _try_use_cache(current_embedding):
    return None

def _update_cache(embedding, result):
    pass

@app.post("/api/v1/identify")
async def identify_face(req: IdentifyRequest):
    """
    Face identification pipeline (1:N search vs MySQL registered embeddings)
    """
    t0 = time.time()
    try:
        detect_result = await asyncio.wait_for(
            asyncio.to_thread(face_processor.detect_and_extract, req.image_base64, False),
            timeout=5
        )
    except asyncio.TimeoutError:
        return {
            "match": False,
            "box": None,
            "image_size": None,
            "student_id": None,
            "confidence": 0,
            "message": "Processing timeout"
        }

    if not detect_result["quality_ok"] or detect_result["box"] is None:
        reason = detect_result.get("quality_reason", "unknown")
        status_text = detect_result.get("status_text") or f"Frame skipped: {reason}"
        return {
            "match": False,
            "box": detect_result.get("box"),
            "image_size": detect_result.get("image_size"),
            "student_id": None,
            "confidence": 0,
            "quality_reason": reason,
            "message": status_text
        }

    if detect_result["embedding"] is None:
        return {
            "match": False,
            "box": detect_result["box"],
            "image_size": detect_result.get("image_size"),
            "student_id": None,
            "confidence": 0,
            "message": "Could not extract face embedding"
        }

    current_embedding = detect_result["embedding"]

    all_students = db_mysql.get_all_student_embeddings()
    if not all_students:
        return {
            "match": False,
            "box": detect_result["box"],
            "image_size": detect_result.get("image_size"),
            "student_id": None,
            "confidence": 0,
            "message": "No registered face embeddings in database"
        }

    target_shape = current_embedding.shape
    valid_students = [
        s for s in all_students 
        if hasattr(s.get("embedding"), "shape") and s["embedding"].shape == target_shape
    ]

    if not valid_students:
        return {
            "match": False,
            "box": detect_result["box"],
            "image_size": detect_result.get("image_size"),
            "student_id": None,
            "confidence": 0,
            "message": f"No embeddings matching dimension {target_shape}"
        }

    embeddings_matrix = np.array([s["embedding"] for s in valid_students], dtype=np.float64)
    norms = np.linalg.norm(embeddings_matrix, axis=1, keepdims=True)
    current_norm = np.linalg.norm(current_embedding)

    if current_norm == 0:
        return {"match": False, "box": detect_result["box"],
                "image_size": detect_result.get("image_size"),
                "student_id": None, "confidence": 0}

    norm_matrix = embeddings_matrix / np.maximum(norms, 1e-8)
    norm_current = current_embedding / current_norm
    similarities = norm_matrix @ norm_current

    best_idx = int(np.argmax(similarities))
    best_similarity = float(similarities[best_idx])
    best_student = valid_students[best_idx]

    # Margin check: best must be clearly better than 2nd best (prevent ambiguous matches)
    if len(similarities) > 1:
        sorted_sims = np.sort(similarities)[::-1]
        second_best = float(sorted_sims[1])
        margin = best_similarity - second_best
    else:
        second_best = 0.0
        margin = best_similarity

    is_match = best_similarity >= MATCH_THRESHOLD and margin >= MARGIN_MIN

    t1 = time.time()
    score_report = " | ".join([f"ID{s['id']}({s['student_code']})={float(similarities[i]):.3f}" for i, s in enumerate(valid_students)])
    print(f"[Identify] {(t1-t0)*1000:.0f}ms | threshold={MATCH_THRESHOLD} | margin={margin:.3f}(min={MARGIN_MIN}) | match={is_match} | scores: {score_report}")

    result = {
        "match": is_match,
        "box": detect_result["box"],
        "image_size": detect_result.get("image_size"),
        "student_id": best_student["id"] if is_match else None,
        "confidence": best_similarity if best_similarity > 0 else 0.0,
        "is_live": detect_result.get("is_live", True),
        "from_cache": False
    }

    return result

@app.post("/api/v1/detect_pose")
async def detect_pose(req: DetectPoseRequest):
    result = face_processor.detect_face_pose(req.image_base64)
    if result["box"] is None:
        return {"success": False, "message": "No face detected"}
    return {
        "success": True,
        "box": result["box"],
        "pose": result["pose"],
        "image_size": result.get("image_size")
    }

@app.post("/api/v1/verify")
async def verify_face(req: VerifyRequest):
    stored_embedding = db_mysql.get_student_embedding(req.student_id)

    if stored_embedding is None:
        raise HTTPException(status_code=404, detail="Student embedding not found")

    detect_result = face_processor.detect_and_extract(req.image_base64)
    current_embedding = detect_result.get("embedding")

    if current_embedding is None:
        raise HTTPException(status_code=400, detail="Could not detect face in image")

    similarity = face_processor.compute_cosine_similarity(stored_embedding, current_embedding)
    is_match = bool(similarity >= MATCH_THRESHOLD)
    print(f"[*] Verify Student ID={req.student_id}: Sim={similarity:.4f}, Match={is_match}")
    return {
        "match": is_match,
        "confidence": float(similarity)
    }

@app.post("/api/v1/register_3step")
async def register_face_3step(req: Register3StepRequest):
    emb_straight = face_processor.extract_embedding(req.image_straight, require_oval=False)
    emb_left = face_processor.extract_embedding(req.image_left, require_oval=False)
    emb_right = face_processor.extract_embedding(req.image_right, require_oval=False)

    valid_embs = [emb for emb in [emb_straight, emb_left, emb_right] if emb is not None]

    if not valid_embs:
        raise HTTPException(status_code=400, detail="Could not detect face in any of the images")

    mean_embedding = np.mean(valid_embs, axis=0)
    success = db_mysql.update_student_embedding(req.student_id, mean_embedding)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to save embedding to database")

    print(f"[*] Successfully registered 3-step face for student ID={req.student_id} using {len(valid_embs)} valid embeddings")
    return {"success": True}

@app.post("/api/v1/register")
async def register_face(req: VerifyRequest):
    embedding = face_processor.extract_embedding(req.image_base64, require_oval=False)
    if embedding is None:
        raise HTTPException(status_code=400, detail="Không tìm thấy khuôn mặt trong hình ảnh. Vui lòng chọn ảnh chụp rõ nét hơn.")
    success = db_mysql.update_student_embedding(req.student_id, embedding)
    if not success:
        raise HTTPException(status_code=500, detail="Lỗi lưu dữ liệu vector vào CSDL")

    return {"success": True}

@app.post("/api/v1/admin/register_face")
async def admin_register_face(req: AdminRegister3StepRequest):
    """Register face for an administrator (3-step: straight, left, right)"""
    emb_straight = face_processor.extract_embedding(req.image_straight, require_oval=False)
    emb_left = face_processor.extract_embedding(req.image_left, require_oval=False)
    emb_right = face_processor.extract_embedding(req.image_right, require_oval=False)

    valid_embs = [emb for emb in [emb_straight, emb_left, emb_right] if emb is not None]

    if not valid_embs:
        raise HTTPException(status_code=400, detail="Could not detect face in any of the images")

    mean_embedding = np.mean(valid_embs, axis=0)
    success = db_mysql.update_admin_embedding(req.admin_id, mean_embedding)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to save admin embedding to database")

    print(f"[*] Successfully registered 3-step face for admin ID={req.admin_id} using {len(valid_embs)} valid embeddings")
    return {"success": True}

@app.post("/api/v1/admin/identify")
async def admin_identify_face(req: IdentifyRequest):
    """Identify an administrator by face - used for face login"""
    detect_result = face_processor.detect_and_extract(req.image_base64)
    if not detect_result["quality_ok"] or detect_result["box"] is None:
        return {"match": False, "box": None, "admin_id": None, "confidence": 0, "message": "No face detected"}

    current_embedding = detect_result.get("embedding")
    if current_embedding is None:
        return {"match": False, "box": detect_result["box"], "admin_id": None, "confidence": 0, "message": "No embedding extracted"}

    all_admins = db_mysql.get_all_admin_embeddings()
    if not all_admins:
        return {"match": False, "box": detect_result["box"], "admin_id": None, "confidence": 0, "message": "No registered admin faces in database"}

    best_admin_id = None
    best_similarity = -1.0
    best_admin = None

    for a in all_admins:
        sim = face_processor.compute_cosine_similarity(a["embedding"], current_embedding)
        if sim > best_similarity:
            best_similarity = sim
            best_admin_id = a["id"]
            best_admin = a

    is_match = bool(best_similarity >= MATCH_THRESHOLD)

    return {
        "match": is_match,
        "box": detect_result["box"],
        "image_size": detect_result.get("image_size"),
        "admin_id": best_admin_id if is_match else None,
        "full_name": best_admin["full_name"] if is_match and best_admin else None,
        "role": best_admin["role"] if is_match and best_admin else None,
        "confidence": float(best_similarity) if best_similarity > 0 else 0.0
    }

if __name__ == "__main__":
    port = int(os.getenv("AI_SERVICE_PORT", "8000"))
    print(f"[*] Starting AI Service on port {port} (MATCH_THRESHOLD={MATCH_THRESHOLD})...")
    uvicorn.run(app, host="0.0.0.0", port=port)
