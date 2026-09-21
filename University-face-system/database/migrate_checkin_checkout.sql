-- ══════════════════════════════════════════════════════════════
--  MIGRATION: Check-in / Check-out Attendance Feature
--  An toàn: dùng IF NOT EXISTS / IGNORE để không mất dữ liệu cũ
--  Chạy: docker exec face_attendance_db mysql -uroot -p face_attendance_db < migrate_checkin_checkout.sql
-- ══════════════════════════════════════════════════════════════

USE face_attendance_db;

-- ────────────────────────────────────────────
-- 1. STUDENTS: thêm cột faculty, major, email
-- ────────────────────────────────────────────
SET @col_faculty = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'face_attendance_db'
      AND TABLE_NAME   = 'students'
      AND COLUMN_NAME  = 'faculty'
);
SET @sql_faculty = IF(@col_faculty = 0,
    'ALTER TABLE students ADD COLUMN faculty VARCHAR(100) AFTER class_name',
    'SELECT ''faculty already exists''');
PREPARE stmt FROM @sql_faculty; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_major = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'face_attendance_db'
      AND TABLE_NAME   = 'students'
      AND COLUMN_NAME  = 'major'
);
SET @sql_major = IF(@col_major = 0,
    'ALTER TABLE students ADD COLUMN major VARCHAR(100) AFTER faculty',
    'SELECT ''major already exists''');
PREPARE stmt FROM @sql_major; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_email_s = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'face_attendance_db'
      AND TABLE_NAME   = 'students'
      AND COLUMN_NAME  = 'email'
);
SET @sql_email_s = IF(@col_email_s = 0,
    'ALTER TABLE students ADD COLUMN email VARCHAR(150) AFTER major',
    'SELECT ''students.email already exists''');
PREPARE stmt FROM @sql_email_s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ────────────────────────────────────────────
-- 2. COURSES: thêm cột credits
-- ────────────────────────────────────────────
SET @col_credits = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'face_attendance_db'
      AND TABLE_NAME   = 'courses'
      AND COLUMN_NAME  = 'credits'
);
SET @sql_credits = IF(@col_credits = 0,
    'ALTER TABLE courses ADD COLUMN credits INT(11) DEFAULT 3 AFTER course_name',
    'SELECT ''credits already exists''');
PREPARE stmt FROM @sql_credits; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ────────────────────────────────────────────
-- 3. CLASS_SCHEDULES: thêm lịch lặp tuần
-- ────────────────────────────────────────────
SET @col_teacher = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'face_attendance_db'
      AND TABLE_NAME   = 'class_schedules'
      AND COLUMN_NAME  = 'teacher_name'
);
SET @sql_teacher = IF(@col_teacher = 0,
    'ALTER TABLE class_schedules ADD COLUMN teacher_name VARCHAR(100) AFTER room_name',
    'SELECT ''teacher_name already exists''');
PREPARE stmt FROM @sql_teacher; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_recurring = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'face_attendance_db'
      AND TABLE_NAME   = 'class_schedules'
      AND COLUMN_NAME  = 'is_recurring'
);
SET @sql_recurring = IF(@col_recurring = 0,
    'ALTER TABLE class_schedules
        ADD COLUMN is_recurring  TINYINT(1) DEFAULT 0 COMMENT ''1 = lặp lại hàng tuần'' AFTER end_time,
        ADD COLUMN day_of_week   TINYINT(1) NULL COMMENT ''0=CN,1=T2,...,6=T7'' AFTER is_recurring,
        ADD COLUMN period_start  TINYINT(1) NULL COMMENT ''Tiết bắt đầu (1-12)'' AFTER day_of_week,
        ADD COLUMN period_end    TINYINT(1) NULL COMMENT ''Tiết kết thúc (1-12)'' AFTER period_start,
        ADD COLUMN week_from     DATE       NULL COMMENT ''Tuần bắt đầu học'' AFTER period_end,
        ADD COLUMN week_to       DATE       NULL COMMENT ''Tuần kết thúc học'' AFTER week_from',
    'SELECT ''recurring columns already exist''');
PREPARE stmt FROM @sql_recurring; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Thêm index nếu chưa có
DROP PROCEDURE IF EXISTS add_index_if_not_exists;
DELIMITER //
CREATE PROCEDURE add_index_if_not_exists(
    IN p_table  VARCHAR(64),
    IN p_index  VARCHAR(64),
    IN p_col    VARCHAR(128)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = p_table
          AND INDEX_NAME   = p_index
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD INDEX `', p_index, '` (', p_col, ')');
        PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
    END IF;
END //
DELIMITER ;

CALL add_index_if_not_exists('class_schedules', 'idx_start_time', 'start_time');
CALL add_index_if_not_exists('class_schedules', 'idx_course',     'course_id');
CALL add_index_if_not_exists('class_attendance', 'idx_schedule',  'schedule_id');
CALL add_index_if_not_exists('class_attendance', 'idx_student',   'student_id');

-- ────────────────────────────────────────────
-- 4. CLASS_ATTENDANCE: thêm UNIQUE constraint
-- ────────────────────────────────────────────
-- Xóa bản ghi trùng (giữ cái mới nhất) trước khi thêm UNIQUE
DELETE ca1 FROM class_attendance ca1
    INNER JOIN class_attendance ca2
    WHERE ca1.student_id = ca2.student_id
      AND ca1.schedule_id = ca2.schedule_id
      AND ca1.id < ca2.id;

SET @uq_att = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = 'face_attendance_db'
      AND TABLE_NAME        = 'class_attendance'
      AND CONSTRAINT_NAME   = 'uq_att'
);
SET @sql_uq = IF(@uq_att = 0,
    'ALTER TABLE class_attendance ADD UNIQUE KEY uq_att (student_id, schedule_id)',
    'SELECT ''uq_att already exists''');
PREPARE stmt FROM @sql_uq; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ────────────────────────────────────────────
-- 5. ENROLLMENTS: bảng đăng ký môn học mới
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
    id          BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    student_id  BIGINT(20) NOT NULL,
    schedule_id BIGINT(20) NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_enroll (student_id, schedule_id),
    FOREIGN KEY (student_id)  REFERENCES students(id)         ON DELETE CASCADE,
    FOREIGN KEY (schedule_id) REFERENCES class_schedules(id)  ON DELETE CASCADE
);

SELECT 'Migration hoàn tất thành công!' AS result;
