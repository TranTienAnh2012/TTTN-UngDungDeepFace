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

MATCH_THRESHOLD = float(os.getenv("MATCH_THRESHOLD", "0.72"))

# Server-side cache disabled to prevent stale false-positive matches
def _try_use_cache(current_embedding):
    return None

def _update_cache(embedding, result):
    pass

# ============================================================

@app.post("/api/v1/identify")
async def identify_face(req: IdentifyRequest):
    """
    3-stage face identification pipeline:
    
    Stage 0 (< 2ms):   Frame quality pre-filter (brightness + sharpness).
                        Reject dark/blurry frames immediately.
    
    Stage 1 (100-400ms): MTCNN detection + ArcFace embedding extraction.
                          MTCNN runs ONCE, crop passed directly to ArcFace.
    
    Stage 2 (< 1ms):   Server-side embedding cache.
                          If current embedding is nearly identical to last
                          known good embedding (2s TTL), return cached
                          student info without running similarity search.
    
    Stage 3 (< 5ms):   Vectorized NumPy cosine similarity vs all embeddings.
    """
    t0 = time.time()

    # STAGE 1: Detect face + extract embedding (combined single MTCNN pass)
    try:
        # Run detection in a thread with a 3‑second timeout to avoid hanging
        detect_result = await asyncio.wait_for(
            asyncio.to_thread(face_processor.detect_and_extract, req.image_base64),
            timeout=3
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


    # Quality or detection failed — return early (cheap)
    if not detect_result["quality_ok"] or detect_result["box"] is None:
        reason = detect_result.get("quality_reason", "unknown")
        status_text = detect_result.get("status_text") or f"Frame skipped: {reason}"
        return {
            "match": False,
            "box": None,
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

    # STAGE 2: Try server-side cache first
    cached = _try_use_cache(current_embedding)
    if cached is not None:
        # Return cached result but update box for current frame position
        cached_clone = dict(cached)
        cached_clone["box"] = detect_result["box"]
        cached_clone["image_size"] = detect_result.get("image_size")
        cached_clone["from_cache"] = True
        return cached_clone

    # STAGE 3: Full similarity search (vectorized NumPy)
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

    # Filter students with matching embedding dimensions
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

    # Build normalized matrix for batch cosine similarity
    embeddings_matrix = np.array([s["embedding"] for s in valid_students], dtype=np.float64)
    norms = np.linalg.norm(embeddings_matrix, axis=1, keepdims=True)
    current_norm = np.linalg.norm(current_embedding)

    if current_norm == 0:
        return {"match": False, "box": detect_result["box"],
                "image_size": detect_result.get("image_size"),
                "student_id": None, "confidence": 0}

    norm_matrix = embeddings_matrix / np.maximum(norms, 1e-8)
    norm_current = current_embedding / current_norm
    similarities = norm_matrix @ norm_current  # Vectorized dot product

    best_idx = int(np.argmax(similarities))
    best_similarity = float(similarities[best_idx])
    best_student = valid_students[best_idx]

    # Margin check: best must be clearly better than 2nd best (prevent ambiguous matches)
    MARGIN_MIN = float(os.getenv("MATCH_MARGIN", "0.10"))
    if len(similarities) > 1:
        sorted_sims = np.sort(similarities)[::-1]
        second_best = float(sorted_sims[1])
        margin = best_similarity - second_best
    else:
        second_best = 0.0
        margin = best_similarity

    is_match = best_similarity >= MATCH_THRESHOLD and margin >= MARGIN_MIN

    t1 = time.time()
    # Detailed debug: show similarity score for every registered student
    score_report = " | ".join([f"ID{s['id']}({s['student_code']})={float(similarities[i]):.3f}" for i, s in enumerate(valid_students)])
    print(f"[Identify] {(t1-t0)*1000:.0f}ms | threshold={MATCH_THRESHOLD} | margin={margin:.3f}(min={MARGIN_MIN}) | match={is_match} | scores: {score_report}")
    print(f"[Identify] => best: ID{best_student['id']} ({best_student['student_code']}) similarity={best_similarity:.4f} | 2nd={second_best:.4f} | MATCH={'YES' if is_match else 'NO'}")

    result = {
        "match": is_match,
        "box": detect_result["box"],
        "image_size": detect_result.get("image_size"),
        "student_id": best_student["id"] if is_match else None,
        "confidence": best_similarity if best_similarity > 0 else 0.0,
        "from_cache": False
    }

    # Update cache only on successful match
    if is_match:
        _update_cache(current_embedding, result)

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
    embedding = face_processor.extract_embedding(req.image_base64)
    if embedding is None:
        raise HTTPException(status_code=400, detail="Could not detect face")
    success = db_mysql.update_student_embedding(req.student_id, embedding)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save")

    return {"success": True}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"[*] Starting AI Service on port {port} (MATCH_THRESHOLD={MATCH_THRESHOLD})...")
    uvicorn.run(app, host="0.0.0.0", port=port)
