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
        const { id } = req.params;

        // Check if class_id is linked with schedule
        const [schedRows] = await pool.query('SELECT class_id FROM class_schedules WHERE id = ?', [id]);
        const classId = schedRows.length > 0 ? schedRows[0].class_id : null;

        let query = `
            SELECT 
                s.id as student_id,
                s.student_code,
                s.full_name,
                s.class_name,
                s.class_name as student_official_class,
                'regular' as enrollment_type,
                (s.face_embedding IS NOT NULL) AS face_registered,
                ca.check_in_time,
                ca.check_out_time,
                ca.status as attendance_status,
                ca.confidence_score
            FROM students s
            LEFT JOIN class_attendance ca ON ca.schedule_id = ? AND ca.student_id = s.id
        `;
        let params = [id];

        if (classId) {
            query += ` WHERE s.class_id = ? OR s.class_name = (SELECT class_code FROM classes WHERE id = ?)`;
            params.push(classId, classId);
        }

        query += ` ORDER BY s.student_code ASC`;

        let [rows] = await pool.query(query, params);

        // Fallback: If filtered list is empty, return all students with attendance status
        if (rows.length === 0) {
            const [allRows] = await pool.query(`
                SELECT 
                    s.id as student_id,
                    s.student_code,
                    s.full_name,
                    s.class_name,
                    s.class_name as student_official_class,
                    'regular' as enrollment_type,
                    (s.face_embedding IS NOT NULL) AS face_registered,
                    ca.check_in_time,
                    ca.check_out_time,
                    ca.status as attendance_status,
                    ca.confidence_score
                FROM students s
                LEFT JOIN class_attendance ca ON ca.schedule_id = ? AND ca.student_id = s.id
                ORDER BY s.student_code ASC
            `, [id]);
            rows = allRows;
        }

        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Lỗi getScheduleStudents:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách sinh viên ca học' });
    }
};

