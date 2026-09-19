CREATE DATABASE IF NOT EXISTS face_attendance_db;
USE face_attendance_db;

-- ════════════════════════════════════════════
--  COURSES
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS courses (
    id          BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20)  NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    credits     INT(11) DEFAULT 3,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════
--  STUDENTS
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS students (
    id            BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    student_code  VARCHAR(50)  NOT NULL UNIQUE,
    full_name     VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    class_name    VARCHAR(50),
    faculty       VARCHAR(100),
    major         VARCHAR(100),
    email         VARCHAR(150),
    face_embedding BLOB,
    status        VARCHAR(20) DEFAULT 'Active',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════
--  CLASS SCHEDULES  (hỗ trợ lặp lại hàng tuần)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS class_schedules (
    id           BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    course_id    BIGINT(20) NOT NULL,
    room_name    VARCHAR(50),
    teacher_name VARCHAR(100),
    -- Buổi học cụ thể (one-shot) hoặc buổi được sinh ra từ lịch tuần
    start_time   DATETIME   NOT NULL,
    end_time     DATETIME   NOT NULL,
    -- Lịch lặp lại hàng tuần
    is_recurring TINYINT(1) DEFAULT 0 COMMENT '1 = lặp lại hàng tuần',
    day_of_week  TINYINT(1) NULL COMMENT '0=CN,1=T2,...,6=T7',
    period_start TINYINT(1) NULL COMMENT 'Tiết bắt đầu (1-12)',
    period_end   TINYINT(1) NULL COMMENT 'Tiết kết thúc (1-12)',
    week_from    DATE       NULL COMMENT 'Tuần bắt đầu học',
    week_to      DATE       NULL COMMENT 'Tuần kết thúc học',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_start_time (start_time),
    INDEX idx_course (course_id)
);

-- ════════════════════════════════════════════
--  ENROLLMENT  (Sinh viên đăng ký môn học)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS enrollments (
    id          BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    student_id  BIGINT(20) NOT NULL,
    schedule_id BIGINT(20) NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_enroll (student_id, schedule_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (schedule_id) REFERENCES class_schedules(id) ON DELETE CASCADE
);

-- ════════════════════════════════════════════
--  CLASS ATTENDANCE  (Điểm danh đầu giờ & cuối giờ)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS class_attendance (
    id                   BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    student_id           BIGINT(20) NOT NULL,
    schedule_id          BIGINT(20) NOT NULL,
    -- Check-in
    check_in_time        DATETIME NULL,
    check_in_confidence  FLOAT    NULL,
    check_in_status      VARCHAR(50) DEFAULT 'Present' COMMENT 'Present / Late / Absent',
    -- Check-out
    check_out_time       DATETIME NULL,
    check_out_confidence FLOAT    NULL,
    check_out_status     VARCHAR(50) NULL,
    -- Tổng trạng thái
    status               VARCHAR(50) DEFAULT 'Checked-in'
                         COMMENT 'Checked-in / Completed / Only Checked-out / Absent',
    confidence_score     FLOAT    NULL,
    notes                TEXT     NULL,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_att (student_id, schedule_id),
    FOREIGN KEY (student_id)  REFERENCES students(id)         ON DELETE CASCADE,
    FOREIGN KEY (schedule_id) REFERENCES class_schedules(id)  ON DELETE CASCADE,
    INDEX idx_schedule   (schedule_id),
    INDEX idx_student    (student_id)
);

-- ════════════════════════════════════════════
--  EXAM SCHEDULES
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS exam_schedules (
    id            BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    course_id     BIGINT(20),
    exam_room     VARCHAR(50),
    exam_time     DATETIME,
    seating_rows  INT(11),
    seating_cols  INT(11),
    disabled_seats TEXT,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- ════════════════════════════════════════════
--  EXAM ELIGIBILITY
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS exam_eligibility (
    id               BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    exam_schedule_id BIGINT(20),
    student_id       BIGINT(20),
    is_eligible      TINYINT(1) DEFAULT 1,
    seat_row         INT(11),
    seat_col         INT(11),
    FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id),
    FOREIGN KEY (student_id)       REFERENCES students(id)
);

-- ════════════════════════════════════════════
--  EXAM ATTENDANCE
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS exam_attendance (
    id               BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    student_id       BIGINT(20),
    exam_schedule_id BIGINT(20),
    check_in_time    DATETIME,
    is_verified      TINYINT(1) DEFAULT 0,
    seat_row         INT(11),
    seat_col         INT(11),
    FOREIGN KEY (student_id)       REFERENCES students(id),
    FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id)
);

-- ════════════════════════════════════════════
--  ADMINISTRATORS
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS administrators (
    id                       BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    email                    VARCHAR(255) NOT NULL UNIQUE,
    username                 VARCHAR(50)  UNIQUE,
    password                 VARCHAR(255) NOT NULL,
    full_name                VARCHAR(100),
    role                     ENUM('user','admin','sales','teacher','manager','accountant') DEFAULT 'admin',
    is_email_verified        TINYINT(1) DEFAULT 0,
    email_verify_token       VARCHAR(255),
    email_verify_expires     DATETIME,
    refresh_token_hash       VARCHAR(255),
    password_reset_token_hash VARCHAR(255),
    password_reset_expires   DATETIME,
    last_login_at            DATETIME,
    created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


