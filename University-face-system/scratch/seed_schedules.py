import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import mysql.connector
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv('d:/TTTN-UngDungDeepFace/University-face-system/.env')

def seed_schedules():
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=int(os.getenv("DB_PORT", "3306")),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", "rootpassword"),
            database=os.getenv("DB_NAME", "face_attendance_db")
        )
        cursor = conn.cursor(dictionary=True)

        # 1. Fetch or insert courses
        cursor.execute("SELECT id, course_code, course_name FROM courses")
        courses = cursor.fetchall()
        
        if not courses:
            print("Inserting sample courses...")
            sample_courses = [
                ("CO3001", "Nhập môn Trí tuệ Nhân tạo", 3),
                ("CO3005", "Xử lý Ảnh & Thị giác Máy tính", 3),
                ("CO3009", "Lập trình Ứng dụng Web Advanced", 4)
            ]
            for c in sample_courses:
                cursor.execute("INSERT INTO courses (course_code, course_name, credits) VALUES (%s, %s, %s)", c)
            conn.commit()
            
            cursor.execute("SELECT id, course_code, course_name FROM courses")
            courses = cursor.fetchall()

        print("Courses:", courses)

        # 2. Insert new realistic schedules for today & this week
        now = datetime.now()
        today_date = now.date()

        new_schedules = [
            # Active today
            {
                "course_id": courses[0]["id"],
                "room_name": "Phòng A-302",
                "start_time": datetime.combine(today_date, datetime.strptime("07:30", "%H:%M").time()),
                "end_time": datetime.combine(today_date, datetime.strptime("23:30", "%H:%M").time()),
                "teacher_name": "Trần Tiến Anh 2"
            },
            # Upcoming tomorrow
            {
                "course_id": courses[1]["id"] if len(courses) > 1 else courses[0]["id"],
                "room_name": "Lab B-101",
                "start_time": datetime.combine(today_date, datetime.strptime("13:30", "%H:%M").time()) + timedelta(days=1),
                "end_time": datetime.combine(today_date, datetime.strptime("15:30", "%H:%M").time()) + timedelta(days=1),
                "teacher_name": "Trần Tiến Anh 2"
            },
            # Upcoming in 2 days
            {
                "course_id": courses[2]["id"] if len(courses) > 2 else courses[0]["id"],
                "room_name": "Phòng C-204",
                "start_time": datetime.combine(today_date, datetime.strptime("08:00", "%H:%M").time()) + timedelta(days=2),
                "end_time": datetime.combine(today_date, datetime.strptime("10:00", "%H:%M").time()) + timedelta(days=2),
                "teacher_name": "Trần Tiến Anh 2"
            }
        ]

        for s in new_schedules:
            cursor.execute(
                """INSERT INTO class_schedules (course_id, room_name, start_time, end_time, teacher_name) 
                   VALUES (%s, %s, %s, %s, %s)""",
                (s["course_id"], s["room_name"], s["start_time"], s["end_time"], s["teacher_name"])
            )

        # 3. Seed exam schedules
        cursor.execute("SELECT id FROM exam_schedules")
        exams = cursor.fetchall()
        if not exams:
            print("Inserting sample exam schedules...")
            exam_schedules = [
                (courses[0]["id"], "Hội trường H1-301", datetime.combine(today_date, datetime.strptime("08:00", "%H:%M").time()), datetime.combine(today_date, datetime.strptime("10:00", "%H:%M").time()), 5, 6),
                (courses[1]["id"] if len(courses) > 1 else courses[0]["id"], "Phòng thi B2-105", datetime.combine(today_date, datetime.strptime("14:00", "%H:%M").time()) + timedelta(days=1), datetime.combine(today_date, datetime.strptime("16:00", "%H:%M").time()) + timedelta(days=1), 6, 8)
            ]
            for ex in exam_schedules:
                cursor.execute(
                    """INSERT INTO exam_schedules (course_id, exam_room, exam_time, end_time, seating_rows, seating_cols)
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    ex
                )

        conn.commit()
        print("SEEDING COMPLETED SUCCESSFULLY!")
        conn.close()

    except Exception as e:
        print(f"[!] Seed error: {e}")

if __name__ == "__main__":
    seed_schedules()
