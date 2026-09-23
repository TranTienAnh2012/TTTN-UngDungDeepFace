const pool = require('../../config/db');

// GET /schedules/today
exports.getTodaySchedules = async (req, res) => {
    try {
        let [rows] = await pool.query(`
            SELECT cs.*, c.course_code, c.course_name,
                (SELECT COUNT(*) FROM class_attendance ca WHERE ca.schedule_id = cs.id AND ca.check_in_time IS NOT NULL) as checked_in_count,
                (SELECT COUNT(*) FROM class_attendance ca WHERE ca.schedule_id = cs.id AND ca.check_out_time IS NOT NULL) as checked_out_count
            FROM class_schedules cs 
            JOIN courses c ON cs.course_id = c.id
            WHERE DATE(cs.start_time) = CURDATE()
            ORDER BY cs.start_time ASC
        `);

        if (rows.length === 0) {
            [rows] = await pool.query(`
                SELECT cs.*, c.course_code, c.course_name,
                    (SELECT COUNT(*) FROM class_attendance ca WHERE ca.schedule_id = cs.id AND ca.check_in_time IS NOT NULL) as checked_in_count,
                    (SELECT COUNT(*) FROM class_attendance ca WHERE ca.schedule_id = cs.id AND ca.check_out_time IS NOT NULL) as checked_out_count
                FROM class_schedules cs 
                JOIN courses c ON cs.course_id = c.id
                ORDER BY cs.start_time DESC
            `);
        }

        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Lỗi getTodaySchedules:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /schedules/active
exports.getActiveSchedules = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT cs.*, c.course_code, c.course_name 
            FROM class_schedules cs 
            JOIN courses c ON cs.course_id = c.id
            WHERE NOW() BETWEEN cs.start_time AND cs.end_time
            ORDER BY cs.start_time ASC
        `);
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Lỗi getActiveSchedules:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /schedules/all
exports.getAllSchedules = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                cs.id, cs.room_name,
                cs.start_time, cs.end_time,
                c.course_code, c.course_name,
                (SELECT COUNT(*) FROM class_attendance ca WHERE ca.schedule_id = cs.id AND ca.check_in_time IS NOT NULL) as checked_in_count,
                (SELECT COUNT(*) FROM class_attendance ca WHERE ca.schedule_id = cs.id AND ca.check_out_time IS NOT NULL) as checked_out_count,
                (SELECT COUNT(*) FROM students) as student_count
            FROM class_schedules cs
            JOIN courses c ON cs.course_id = c.id
            ORDER BY cs.start_time DESC
        `);

        const now = new Date();
        const formatted = rows.map(s => {
            const start = new Date(s.start_time);
            const end = new Date(s.end_time);
            let status = 'Upcoming';
            if (now >= start && now <= end) status = 'Active';
            else if (now > end) status = 'Ended';

            const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
            const dayStr = days[start.getDay()];
            const startTimeStr = start.toTimeString().slice(0, 5);
            const endTimeStr = end.toTimeString().slice(0, 5);

            return {
                ...s,
                day: dayStr,
                time: `${startTimeStr} – ${endTimeStr}`,
                course: `${s.course_code} - ${s.course_name}`,
                room: s.room_name,
                group: 'Nhóm 01',
                count: s.student_count || 40,
                status
            };
        });

        return res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        console.error('Lỗi getAllSchedules:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// POST /schedules/create
exports.createSchedule = async (req, res) => {
    try {
        const { course_name, room_name, start_time, end_time } = req.body;
        if (!course_name || !room_name || !start_time || !end_time) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin ca học' });
        }

        let [courses] = await pool.query('SELECT id FROM courses WHERE course_name = ? LIMIT 1', [course_name]);
        let courseId;
        if (courses.length > 0) {
            courseId = courses[0].id;
        } else {
            const courseCode = 'CS' + Math.floor(100 + Math.random() * 900);
            const [newCourse] = await pool.query(
                'INSERT INTO courses (course_code, course_name, credits) VALUES (?, ?, 3)',
                [courseCode, course_name]
            );
            courseId = newCourse.insertId;
        }

        const [result] = await pool.query(
            `INSERT INTO class_schedules (course_id, room_name, start_time, end_time) 
             VALUES (?, ?, ?, ?)`,
            [courseId, room_name, start_time, end_time]
        );

        return res.status(201).json({
            success: true,
            message: 'Tạo buổi học mới thành công',
            data: { id: result.insertId, course_id: courseId, course_name, room_name, start_time, end_time }
        });
    } catch (error) {
        console.error('Lỗi createSchedule:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi tạo ca học' });
    }
};

// GET /schedules/:id/students
exports.getScheduleStudents = async (req, res) => {
    try {
        const scheduleId = req.params.id;

        // 1. Lấy thông tin ca học hiện tại
        const [scheduleRows] = await pool.query(`
            SELECT cs.*, 
                   c.course_code, c.course_name, c.credits,
                   r.room_code, r.room_name as full_room_name, r.building,
                   ss.shift_code, ss.shift_name, ss.start_time as shift_start, ss.end_time as shift_end,
                   cl.class_code as official_class_code, cl.class_name as official_class_name,
                   f.faculty_code, f.faculty_name
            FROM class_schedules cs
            LEFT JOIN courses c ON cs.course_id = c.id
            LEFT JOIN rooms r ON cs.room_id = r.id
            LEFT JOIN study_shifts ss ON cs.shift_id = ss.id
            LEFT JOIN classes cl ON cs.class_id = cl.id
            LEFT JOIN faculties f ON cl.faculty_id = f.id
            WHERE cs.id = ?
        `, [scheduleId]);

        if (scheduleRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy ca học' });
        }

        const currentSchedule = scheduleRows[0];

        // 2. Lấy danh sách sinh viên đăng ký
        let [students] = await pool.query(`
            SELECT s.id as student_id, s.student_code, s.full_name, s.email, s.date_of_birth,
                   s.class_id, cl.class_code as student_official_class, cl.class_name,
                   f.faculty_code, f.faculty_name,
                   (s.face_embedding IS NOT NULL) as face_registered,
                   e.enrollment_type,
                   ca.id as attendance_id,
                   ca.check_in_time, ca.check_in_confidence, ca.check_in_status,
                   ca.check_out_time, ca.check_out_confidence, ca.check_out_status,
                   ca.status as attendance_status, ca.confidence_score, ca.notes
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            LEFT JOIN classes cl ON s.class_id = cl.id
            LEFT JOIN faculties f ON s.faculty_id = f.id
            LEFT JOIN class_attendance ca ON ca.student_id = s.id AND ca.schedule_id = ?
            WHERE e.schedule_id = ?
            ORDER BY s.student_code ASC
        `, [scheduleId, scheduleId]);

        // Fallback nếu enrollments chưa có
        if (students.length === 0) {
            const classFilter = currentSchedule.class_id ? 'WHERE s.class_id = ?' : '';
            const queryParams = currentSchedule.class_id ? [scheduleId, currentSchedule.class_id] : [scheduleId];
            [students] = await pool.query(`
                SELECT s.id as student_id, s.student_code, s.full_name, s.email, s.date_of_birth,
                       s.class_id, cl.class_code as student_official_class, cl.class_name,
                       f.faculty_code, f.faculty_name,
                       (s.face_embedding IS NOT NULL) as face_registered,
                       'regular' as enrollment_type,
                       ca.id as attendance_id,
                       ca.check_in_time, ca.check_in_confidence, ca.check_in_status,
                       ca.check_out_time, ca.check_out_confidence, ca.check_out_status,
                       ca.status as attendance_status, ca.confidence_score, ca.notes
                FROM students s
                LEFT JOIN classes cl ON s.class_id = cl.id
                LEFT JOIN faculties f ON s.faculty_id = f.id
                LEFT JOIN class_attendance ca ON ca.student_id = s.id AND ca.schedule_id = ?
                ${classFilter}
                ORDER BY s.student_code ASC
            `, queryParams);
        }

        // 3. Lấy toàn bộ các buổi học trong kỳ của môn học này (cho Lịch học / Tiến trình học)
        const [courseSessions] = await pool.query(`
            SELECT cs.id, cs.start_time, cs.end_time, cs.room_name, cs.teacher_name,
                   c.course_code, c.course_name,
                   (SELECT COUNT(*) FROM enrollments e WHERE e.schedule_id = cs.id) as enrolled_count,
                   (SELECT COUNT(*) FROM class_attendance ca WHERE ca.schedule_id = cs.id AND (ca.check_in_time IS NOT NULL OR ca.status = 'Completed' OR ca.status = 'Checked-in')) as attended_count
            FROM class_schedules cs
            JOIN courses c ON cs.course_id = c.id
            WHERE cs.course_id = ? OR (cs.class_id IS NOT NULL AND cs.class_id = ?)
            ORDER BY cs.start_time ASC
        `, [currentSchedule.course_id, currentSchedule.class_id || 0]);

        return res.status(200).json({
            success: true,
            data: students,
            schedule: currentSchedule,
            course_sessions: courseSessions
        });
    } catch (error) {
        console.error('Lỗi getScheduleStudents:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách sinh viên' });
    }
};

