import mysql.connector
from mysql.connector import Error
import os
import json
import base64
import numpy as np
import time
from dotenv import load_dotenv

load_dotenv()

cached_students = None
last_cache_time = 0

def invalidate_cache():
    global cached_students
    cached_students = None

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=int(os.getenv("DB_PORT", "3309")),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "face_attendance_db")
        )
        return connection
    except Error as e:
        print(f"[!] Error connecting to MySQL: {e}")
        return None

def _parse_embedding(raw_data):
    """
    Safely parses face embedding from MySQL (supports str, bytes, Base64, JSON, or list)
    Returns a 1D numpy array of float64, or None.
    """
    if raw_data is None:
        return None

    try:
        # Convert bytes to string if needed
        if isinstance(raw_data, (bytes, bytearray)):
            try:
                raw_str = raw_data.decode('utf-8')
            except Exception:
                # If direct raw binary buffer of float64
                return np.frombuffer(raw_data, dtype=np.float64)
        elif isinstance(raw_data, str):
            raw_str = raw_data
        elif isinstance(raw_data, (list, np.ndarray)):
            return np.array(raw_data, dtype=np.float64)
        else:
            return None

        raw_str = raw_str.strip()
        if not raw_str:
            return None

        # 1. Try JSON array format (e.g. "[0.123, -0.456, ...]")
        if raw_str.startswith('[') and raw_str.endswith(']'):
            try:
                emb_list = json.loads(raw_str)
                return np.array(emb_list, dtype=np.float64)
            except Exception:
                pass

        # 2. Try Base64 format
        try:
            decoded_bytes = base64.b64decode(raw_str)
            emb = np.frombuffer(decoded_bytes, dtype=np.float64)
            if len(emb) > 0:
                return emb
        except Exception:
            pass

        # 3. Fallback: try JSON loads on any string
        try:
            emb_list = json.loads(raw_str)
            if isinstance(emb_list, list):
                return np.array(emb_list, dtype=np.float64)
        except Exception:
            pass

    except Exception as e:
        print(f"[!] Error parsing embedding: {e}")

    return None

def update_student_embedding(student_id, embedding):
    """
    Save the embedding (numpy array) to the students table as Base64 encoded binary
    """
    connection = get_db_connection()
    if connection:
        try:
            cursor = connection.cursor()
            
            if not isinstance(embedding, np.ndarray):
                embedding = np.array(embedding, dtype=np.float64)
            else:
                embedding = embedding.astype(np.float64)
                
            embedding_bytes = embedding.tobytes()
            embedding_base64 = base64.b64encode(embedding_bytes).decode('utf-8')
            
            cursor.execute(
                "UPDATE students SET face_embedding = %s WHERE id = %s",
                (embedding_base64, student_id)
            )
            connection.commit()
            invalidate_cache()
            print(f"[+] Da luu embedding thanh cong cho student_id={student_id} (Shape: {embedding.shape})")
            return True
        except Error as e:
            print(f"[!] Error updating embedding: {e}")
            return False
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    return False

def get_student_embedding(student_id):
    """
    Fetch the embedding for a single student from MySQL
    """
    connection = get_db_connection()
    if connection:
        try:
            cursor = connection.cursor(dictionary=True)
            cursor.execute(
                "SELECT face_embedding FROM students WHERE id = %s",
                (student_id,)
            )
            row = cursor.fetchone()
            if row and row['face_embedding']:
                return _parse_embedding(row['face_embedding'])
        except Error as e:
            print(f"[!] Error fetching embedding for student_id={student_id}: {e}")
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    return None

def get_all_student_embeddings(force_refresh=False):
    """
    Fetch all registered student embeddings from MySQL, with 10-second caching
    """
    global cached_students, last_cache_time
    if not force_refresh and cached_students is not None and time.time() - last_cache_time < 10:
        return cached_students

    connection = get_db_connection()
    students_list = []
    if connection:
        try:
            cursor = connection.cursor(dictionary=True)
            cursor.execute(
                "SELECT id, student_code, full_name, face_embedding FROM students WHERE face_embedding IS NOT NULL"
            )
            rows = cursor.fetchall()
            for row in rows:
                if row['face_embedding']:
                    emb = _parse_embedding(row['face_embedding'])
                    if emb is not None and len(emb) > 0:
                        students_list.append({
                            "id": row['id'],
                            "student_code": row['student_code'],
                            "full_name": row['full_name'],
                            "embedding": emb
                        })
            
            cached_students = students_list
            last_cache_time = time.time()
        except Error as e:
            print(f"[!] Error fetching all embeddings: {e}")
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    return students_list
