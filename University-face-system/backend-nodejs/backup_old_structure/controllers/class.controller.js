const pool = require('../config/db');

// --- CLASS SCHEDULES ---

exports.getAllClassSchedules = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        let query = `
            SELECT cs.*, c.course_code, c.course_name,
                   cl.class_code, cl.class_name as class_full_name,
                   r.room_code, r.room_name as room_full_name, r.building,
                   ss.shift_code, ss.shift_name,
                   f.faculty_code, f.faculty_name,
                   COALESCE(
                       NULLIF((SELECT COUNT(*) FROM enrollments e WHERE e.schedule_id = cs.id), 0),
                       (SELECT COUNT(*) FROM students s WHERE s.class_id = cs.class_id),
                       0
                   ) AS total_enrolled,
                   (
                       SELECT COUNT(DISTINCT ca.student_id) 
                       FROM class_attendance ca 
                       WHERE ca.schedule_id = cs.id AND (ca.check_in_time IS NOT NULL OR ca.check_out_time IS NOT NULL)
                   ) AS attended_count,
                   (
                       SELECT COUNT(DISTINCT ca.student_id) 
                       FROM class_attendance ca 
                       WHERE ca.schedule_id = cs.id AND ca.status = 'Completed'
                   ) AS completed_count
            FROM class_schedules cs 
            LEFT JOIN courses c ON cs.course_id = c.id
            LEFT JOIN classes cl ON cs.class_id = cl.id
            LEFT JOIN faculties f ON cl.faculty_id = f.id
            LEFT JOIN rooms r ON cs.room_id = r.id
            LEFT JOIN study_shifts ss ON cs.shift_id = ss.id
        `;
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM class_schedules cs 
            LEFT JOIN courses c ON cs.course_id = c.id
            LEFT JOIN classes cl ON cs.class_id = cl.id
            LEFT JOIN rooms r ON cs.room_id = r.id
            LEFT JOIN study_shifts ss ON cs.shift_id = ss.id
        `;
        const queryParams = [];

        if (search) {
            const searchCondition = ' WHERE cs.room_name LIKE ? OR cl.class_code LIKE ? OR cl.class_name LIKE ? OR r.room_code LIKE ? OR r.room_name LIKE ? OR c.course_code LIKE ? OR c.course_name LIKE ?';
            query += searchCondition;
            countQuery += searchCondition;
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY cs.start_time DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const [rows] = await pool.query(query, queryParams);
        const [countResult] = await pool.query(countQuery, search ? [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`] : []);
        const total = countResult[0].total;

        res.json({
            success: true,
            data: rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error in getAllClassSchedules:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy lịch học' });
    }
};

exports.getClassScheduleById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT cs.*, c.course_code, c.course_name,
                   cl.class_code, cl.class_name as class_full_name,
                   r.room_code, r.room_name as room_full_name, r.building,
                   ss.shift_code, ss.shift_name,
                   f.faculty_code, f.faculty_name,
                   COALESCE(
                       NULLIF((SELECT COUNT(*) FROM enrollments e WHERE e.schedule_id = cs.id), 0),
                       (SELECT COUNT(*) FROM students s WHERE s.class_id = cs.class_id),
                       0
                   ) AS total_enrolled,
                   (
                       SELECT COUNT(DISTINCT ca.student_id) 
                       FROM class_attendance ca 
                       WHERE ca.schedule_id = cs.id AND (ca.check_in_time IS NOT NULL OR ca.check_out_time IS NOT NULL)
                   ) AS attended_count,
                   (
                       SELECT COUNT(DISTINCT ca.student_id) 
                       FROM class_attendance ca 
                       WHERE ca.schedule_id = cs.id AND ca.status = 'Completed'
                   ) AS completed_count
            FROM class_schedules cs 
            LEFT JOIN courses c ON cs.course_id = c.id 
            LEFT JOIN classes cl ON cs.class_id = cl.id
            LEFT JOIN faculties f ON cl.faculty_id = f.id
            LEFT JOIN rooms r ON cs.room_id = r.id
            LEFT JOIN study_shifts ss ON cs.shift_id = ss.id
            WHERE cs.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch học' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error in getClassScheduleById:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.createClassSchedule = async (req, res) => {
    try {
        let { course_id, class_id, room_id, shift_id, room_name, teacher_name, start_time, end_time, is_recurring, day_of_week, period_start, period_end, week_from, week_to, auto_enroll } = req.body;
        
        if (!course_id || !start_time || !end_time) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin: Môn học, Thời gian bắt đầu và kết thúc' });
        }

        if (room_id && !room_name) {
            const [roomRows] = await pool.query('SELECT room_code, room_name FROM rooms WHERE id = ?', [room_id]);
            if (roomRows.length > 0) {
                room_name = `${roomRows[0].room_code} - ${roomRows[0].room_name}`;
            }
        }

        if (!room_name) {
            room_name = 'Chưa xếp phòng';
        }

        const [result] = await pool.query(
            `INSERT INTO class_schedules 
             (course_id, class_id, room_id, shift_id, room_name, teacher_name, start_time, end_time, is_recurring, day_of_week, period_start, period_end, week_from, week_to) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                course_id,
                class_id || null,
                room_id || null,
                shift_id || null,
                room_name,
                teacher_name || null,
                start_time,
                end_time,
                is_recurring ? 1 : 0,
                day_of_week !== undefined ? day_of_week : null,
                period_start || null,
                period_end || null,
                week_from || null,
                week_to || null
            ]
        );

        const newScheduleId = result.insertId;

        // Auto enroll students of the selected class if requested or default true when class_id is present
        if (class_id && auto_enroll !== false) {
            const [students] = await pool.query('SELECT id FROM students WHERE class_id = ?', [class_id]);
            for (const s of students) {
                await pool.query(
                    'INSERT IGNORE INTO enrollments (student_id, schedule_id, enrollment_type) VALUES (?, ?, ?)',
                    [s.id, newScheduleId, 'regular']
                );
            }
        }
        
        res.status(201).json({ 
            success: true, 
            message: 'Tạo lịch học thành công',
            data: { id: newScheduleId, course_id, class_id, room_id, shift_id, room_name, start_time, end_time }
        });
    } catch (error) {
        console.error('Error in createClassSchedule:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi tạo lịch học' });
    }
};

exports.updateClassSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        let { course_id, class_id, room_id, shift_id, room_name, teacher_name, start_time, end_time, is_recurring, day_of_week, period_start, period_end, week_from, week_to } = req.body;

        if (!course_id || !start_time || !end_time) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
        }

        if (room_id && !room_name) {
            const [roomRows] = await pool.query('SELECT room_code, room_name FROM rooms WHERE id = ?', [room_id]);
            if (roomRows.length > 0) {
                room_name = `${roomRows[0].room_code} - ${roomRows[0].room_name}`;
            }
        }

        if (!room_name) {
            room_name = 'Chưa xếp phòng';
        }

        const [result] = await pool.query(
            `UPDATE class_schedules 
             SET course_id = ?, class_id = ?, room_id = ?, shift_id = ?, room_name = ?, teacher_name = ?, start_time = ?, end_time = ?, is_recurring = ?, day_of_week = ?, period_start = ?, period_end = ?, week_from = ?, week_to = ?
             WHERE id = ?`,
            [
                course_id,
                class_id || null,
                room_id || null,
                shift_id || null,
                room_name,
                teacher_name || null,
                start_time,
                end_time,
                is_recurring ? 1 : 0,
                day_of_week !== undefined ? day_of_week : null,
                period_start || null,
                period_end || null,
                week_from || null,
                week_to || null,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch học' });
        }

        res.json({ success: true, message: 'Cập nhật lịch học thành công' });
    } catch (error) {
        console.error('Error in updateClassSchedule:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật lịch học' });
    }
};

exports.deleteClassSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [attendance] = await pool.query('SELECT id FROM class_attendance WHERE schedule_id = ? AND check_in_time IS NOT NULL LIMIT 1', [id]);
        if (attendance.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa lịch học vì đã có sinh viên điểm danh!' });
        }

        // Clean enrollments & empty attendance records
        await pool.query('DELETE FROM enrollments WHERE schedule_id = ?', [id]);
        await pool.query('DELETE FROM class_attendance WHERE schedule_id = ?', [id]);

        const [result] = await pool.query('DELETE FROM class_schedules WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch học để xóa' });
        }

        res.json({ success: true, message: 'Xóa lịch học thành công' });
    } catch (error) {
        console.error('Error in deleteClassSchedule:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa lịch học' });
    }
};

// --- SCHEDULE ENROLLMENTS (Quản lý Sinh viên trong Buổi Học & Học lại) ---

// GET /api/classes/schedules/:id/students
exports.getScheduleStudents = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT e.id as enrollment_id, e.enrollment_type, e.enrolled_at,
                   s.id as student_id, s.student_code, s.full_name, s.class_name, s.email, s.status as student_status,
                   cl.class_code as student_official_class, cl.class_name as student_official_class_name,
                   f.faculty_code, f.faculty_name,
                   (s.face_embedding IS NOT NULL) AS face_registered,
                   ca.check_in_time, ca.check_out_time, ca.status as attendance_status, ca.confidence_score
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            LEFT JOIN classes cl ON s.class_id = cl.id
            LEFT JOIN faculties f ON (s.faculty_id = f.id OR cl.faculty_id = f.id)
            LEFT JOIN class_attendance ca ON ca.schedule_id = e.schedule_id AND ca.student_id = s.id
            WHERE e.schedule_id = ?
            ORDER BY e.enrollment_type ASC, s.student_code ASC
        `;
        let [rows] = await pool.query(query, [id]);

        // If no enrollments exist yet, check if schedule has class_id and fallback
        if (rows.length === 0) {
            const [sched] = await pool.query('SELECT class_id FROM class_schedules WHERE id = ?', [id]);
            if (sched.length > 0 && sched[0].class_id) {
                const classQuery = `
                    SELECT NULL as enrollment_id, 'regular' as enrollment_type, NULL as enrolled_at,
                           s.id as student_id, s.student_code, s.full_name, s.class_name, s.email, s.status as student_status,
                           cl.class_code as student_official_class, cl.class_name as student_official_class_name,
                           f.faculty_code, f.faculty_name,
                           (s.face_embedding IS NOT NULL) AS face_registered,
                           ca.check_in_time, ca.check_out_time, ca.status as attendance_status, ca.confidence_score
                    FROM students s
                    LEFT JOIN classes cl ON s.class_id = cl.id
                    LEFT JOIN faculties f ON (s.faculty_id = f.id OR cl.faculty_id = f.id)
                    LEFT JOIN class_attendance ca ON ca.schedule_id = ? AND ca.student_id = s.id
                    WHERE s.class_id = ? OR s.class_name = (SELECT class_code FROM classes WHERE id = ?)
                    ORDER BY s.student_code ASC
                `;
                const [classRows] = await pool.query(classQuery, [id, sched[0].class_id, sched[0].class_id]);
                rows = classRows;
            }
        }

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error in getScheduleStudents:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// POST /api/classes/schedules/:id/enroll (Thêm 1 sinh viên - chính khóa hoặc học lại)
exports.enrollStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { student_id, enrollment_type } = req.body;

        if (!student_id) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn sinh viên' });
        }

        const type = enrollment_type === 'retake' ? 'retake' : (enrollment_type === 'supplementary' ? 'supplementary' : 'regular');

        const [existing] = await pool.query('SELECT id FROM enrollments WHERE schedule_id = ? AND student_id = ?', [id, student_id]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Sinh viên đã có trong danh sách buổi học này' });
        }

        await pool.query(
            'INSERT INTO enrollments (student_id, schedule_id, enrollment_type) VALUES (?, ?, ?)',
            [student_id, id, type]
        );

        res.status(201).json({ success: true, message: 'Thêm sinh viên vào buổi học thành công' });
    } catch (error) {
        console.error('Error in enrollStudent:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// DELETE /api/classes/schedules/:id/enroll/:student_id
exports.unenrollStudent = async (req, res) => {
    try {
        const { id, student_id } = req.params;
        await pool.query('DELETE FROM enrollments WHERE schedule_id = ? AND student_id = ?', [id, student_id]);
        res.json({ success: true, message: 'Đã xóa sinh viên khỏi buổi học' });
    } catch (error) {
        console.error('Error in unenrollStudent:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// POST /api/classes/schedules/:id/bulk-class (Nạp nhanh toàn bộ sinh viên của 1 lớp)
exports.bulkEnrollClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { class_id, enrollment_type } = req.body;

        if (!class_id) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn lớp cần nạp' });
        }

        const type = enrollment_type === 'retake' ? 'retake' : (enrollment_type === 'supplementary' ? 'supplementary' : 'regular');
        const [students] = await pool.query(
            `SELECT id FROM students 
             WHERE class_id = ? OR class_name = (SELECT class_code FROM classes WHERE id = ?)`,
            [class_id, class_id]
        );

        if (students.length === 0) {
            return res.status(400).json({ success: false, message: 'Lớp này chưa có sinh viên nào' });
        }

        let addedCount = 0;
        for (const s of students) {
            const [result] = await pool.query(
                'INSERT IGNORE INTO enrollments (student_id, schedule_id, enrollment_type) VALUES (?, ?, ?)',
                [s.id, id, type]
            );
            if (result.affectedRows > 0) addedCount++;
        }

        res.json({ 
            success: true, 
            message: `Đã nạp thành công ${addedCount} sinh viên từ lớp vào lịch học!` 
        });
    } catch (error) {
        console.error('Error in bulkEnrollClass:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// --- CLASS ATTENDANCE ---

exports.getAllClassAttendance = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const schedule_id = req.query.schedule_id;
        const offset = (page - 1) * limit;

        let query = `
            SELECT ca.*, s.student_code, s.full_name, s.class_name, 
                   cs.room_name, cs.start_time, cs.end_time, c.course_code, c.course_name,
                   r.room_code, r.room_name as room_full_name,
                   e.enrollment_type
            FROM class_attendance ca
            JOIN students s ON ca.student_id = s.id
            JOIN class_schedules cs ON ca.schedule_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            LEFT JOIN rooms r ON cs.room_id = r.id
            LEFT JOIN enrollments e ON e.student_id = ca.student_id AND e.schedule_id = ca.schedule_id
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM class_attendance ca';
        const queryParams = [];
        const countParams = [];

        if (schedule_id) {
            query += ' WHERE ca.schedule_id = ?';
            countQuery += ' WHERE ca.schedule_id = ?';
            queryParams.push(schedule_id);
            countParams.push(schedule_id);
        }

        query += ' ORDER BY COALESCE(ca.check_out_time, ca.check_in_time) DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const [rows] = await pool.query(query, queryParams);
        const [countResult] = await pool.query(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            success: true,
            data: rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error in getAllClassAttendance:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.deleteClassAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM class_attendance WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy dữ liệu điểm danh' });
        }

        res.json({ success: true, message: 'Xóa dữ liệu điểm danh thành công' });
    } catch (error) {
        console.error('Error in deleteClassAttendance:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
