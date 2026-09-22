CREATE DATABASE IF NOT EXISTS face_attendance_db;
USE face_attendance_db;

-- ════════════════════════════════════════════
--  FACULTIES (Khoa / Viện)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS faculties (
    id           BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    faculty_code VARCHAR(50)  NOT NULL UNIQUE COMMENT 'Mã khoa (VD: CNTT, DTVT)',
    faculty_name VARCHAR(150) NOT NULL COMMENT 'Tên khoa (VD: Khoa Công Nghệ Thông Tin)',
    description  TEXT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════
--  CLASSES (Lớp Học Sinh Viên Chính Quy)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS classes (
    id            BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    class_code    VARCHAR(50)  NOT NULL UNIQUE COMMENT 'Mã lớp (VD: CNTT1-K15, D20CQCN01)',
    class_name    VARCHAR(150) NOT NULL COMMENT 'Tên lớp (VD: Lớp CNTT 1 Khóa 15)',
    faculty_id    BIGINT(20)   NULL COMMENT 'Khoa quản lý',
    academic_year VARCHAR(50)  NULL COMMENT 'Niên khóa (VD: 2022-2026)',
    status        VARCHAR(20)  DEFAULT 'Active' COMMENT 'Active / Inactive',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE SET NULL
);

-- ════════════════════════════════════════════
--  ROOMS (Quản lý Phòng & Sơ đồ ghế)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS rooms (
    id             BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    room_code      VARCHAR(50)  NOT NULL UNIQUE COMMENT 'Mã phòng (VD: P301, B401)',
    room_name      VARCHAR(100) NOT NULL COMMENT 'Tên phòng (VD: Phòng thi 401 - Tòa B)',
    building       VARCHAR(50)  NULL COMMENT 'Tòa nhà / Khu vực',
    room_type      ENUM('theory', 'lab', 'exam_hall') DEFAULT 'theory' COMMENT 'Loại phòng',
    capacity       INT(11) DEFAULT 40 COMMENT 'Sức chứa tối đa',
    seating_rows   INT(11) NOT NULL DEFAULT 6 COMMENT 'Số hàng ghế',
    seating_cols   INT(11) NOT NULL DEFAULT 8 COMMENT 'Số cột ghế',
    disabled_seats TEXT NULL COMMENT 'JSON lưu danh sách vị trí ghế hỏng/trống (VD: ["0-1", "0-2"])',
    status         VARCHAR(20) DEFAULT 'Active' COMMENT 'Active / Maintenance',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════
--  STUDY SHIFTS (Quản lý Ca học chuẩn)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS study_shifts (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    shift_code   VARCHAR(20) NOT NULL UNIQUE COMMENT 'Mã ca (VD: CA1, CA2)',
    shift_name   VARCHAR(50) NOT NULL COMMENT 'Tên ca (VD: Ca 1 (Sáng))',
    start_time   TIME NOT NULL COMMENT 'Giờ bắt đầu ca (VD: 07:00:00)',
    end_time     TIME NOT NULL COMMENT 'Giờ kết thúc ca (VD: 09:15:00)',
    period_start TINYINT(2) NULL COMMENT 'Tiết bắt đầu (1-12)',
    period_end   TINYINT(2) NULL COMMENT 'Tiết kết thúc (1-12)',
    shift_type   ENUM('morning', 'afternoon', 'evening') DEFAULT 'morning',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════
--  COURSES (Môn Học)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS courses (
    id          BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20)  NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    credits     INT(11) DEFAULT 3,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════
--  STUDENTS (Sinh Viên)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS students (
    id             BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    student_code   VARCHAR(50)  NOT NULL UNIQUE,
    full_name      VARCHAR(100) NOT NULL,
    date_of_birth  DATE,
    faculty_id     BIGINT(20)   NULL,
    class_id       BIGINT(20)   NULL,
    class_name     VARCHAR(50),
    email          VARCHAR(150),
    face_embedding BLOB,
    status         VARCHAR(20) DEFAULT 'Active',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE SET NULL,
    FOREIGN KEY (class_id)   REFERENCES classes(id)   ON DELETE SET NULL
);

-- ════════════════════════════════════════════
--  CLASS SCHEDULES  (Lịch Học Phần)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS class_schedules (
    id           BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    course_id    BIGINT(20) NOT NULL,
    class_id     BIGINT(20) NULL COMMENT 'Lớp sinh viên chính',
    room_id      BIGINT(20) NULL,
    shift_id     INT NULL,
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
    FOREIGN KEY (class_id)  REFERENCES classes(id) ON DELETE SET NULL,
    FOREIGN KEY (room_id)   REFERENCES rooms(id) ON DELETE SET NULL,
    FOREIGN KEY (shift_id)  REFERENCES study_shifts(id) ON DELETE SET NULL,
    INDEX idx_start_time (start_time),
    INDEX idx_course (course_id)
);

-- ════════════════════════════════════════════
--  ENROLLMENT  (Sinh viên đăng ký lớp học phần / học lại)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS enrollments (
    id              BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    student_id      BIGINT(20) NOT NULL,
    schedule_id     BIGINT(20) NOT NULL,
    enrollment_type ENUM('regular', 'retake', 'supplementary') DEFAULT 'regular' COMMENT 'regular = chính khóa, retake = học lại',
    enrolled_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_enroll (student_id, schedule_id),
    FOREIGN KEY (student_id)  REFERENCES students(id)        ON DELETE CASCADE,
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
--  EXAM SCHEDULES (Lịch Thi)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS exam_schedules (
    id               BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    course_id        BIGINT(20) NOT NULL,
    class_id         BIGINT(20) NULL COMMENT 'Lớp dự thi chính',
    room_id          BIGINT(20) NULL,
    exam_room        VARCHAR(50),
    exam_time        DATETIME NOT NULL,
    exam_end_time    DATETIME NULL,
    duration_minutes INT(11) DEFAULT 90,
    seating_rows     INT(11) DEFAULT 6,
    seating_cols     INT(11) DEFAULT 8,
    disabled_seats   TEXT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id)  REFERENCES classes(id) ON DELETE SET NULL,
    FOREIGN KEY (room_id)   REFERENCES rooms(id) ON DELETE SET NULL
);

-- ════════════════════════════════════════════
--  EXAM ELIGIBILITY (Danh Sách Thí Sinh Dự Thi)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS exam_eligibility (
    id               BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    exam_schedule_id BIGINT(20) NOT NULL,
    student_id       BIGINT(20) NOT NULL,
    student_type     ENUM('regular', 'retake') DEFAULT 'regular' COMMENT 'regular: chính khóa, retake: thi lại / học lại',
    is_eligible      TINYINT(1) DEFAULT 1,
    seat_row         INT(11),
    seat_col         INT(11),
    notes            VARCHAR(100) NULL,
    FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id)       REFERENCES students(id) ON DELETE CASCADE
);

-- ════════════════════════════════════════════
--  EXAM ATTENDANCE (Điểm Danh Thi)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS exam_attendance (
    id               BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    student_id       BIGINT(20) NOT NULL,
    exam_schedule_id BIGINT(20) NOT NULL,
    check_in_time    DATETIME,
    is_verified      TINYINT(1) DEFAULT 0,
    seat_row         INT(11),
    seat_col         INT(11),
    FOREIGN KEY (student_id)       REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id) ON DELETE CASCADE
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
    role                     ENUM('user','admin','sales','teacher','manager','accountant') DEFAULT 'teacher',
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
