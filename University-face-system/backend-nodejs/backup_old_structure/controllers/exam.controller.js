const pool = require('../config/db');

// --- EXAM SCHEDULES ---

exports.getAllExamSchedules = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        let query = `
            SELECT es.*, c.course_code, c.course_name,
                   r.room_code, r.room_name as room_full_name, r.building,
                   ac.class_code as academic_class_code, ac.class_name as academic_class_name,
                   f.faculty_code, f.faculty_name,
                   COALESCE(
                       NULLIF((SELECT COUNT(*) FROM exam_eligibility ee WHERE ee.exam_schedule_id = es.id), 0),
                       (SELECT COUNT(*) FROM students s WHERE s.class_id = es.class_id),
                       0
                   ) AS total_candidates,
                   (
                       SELECT COUNT(DISTINCT ea.student_id) 
                       FROM exam_attendance ea 
                       WHERE ea.exam_schedule_id = es.id AND ea.check_in_time IS NOT NULL
                   ) AS checked_in_count
            FROM exam_schedules es 
            LEFT JOIN courses c ON es.course_id = c.id
            LEFT JOIN rooms r ON es.room_id = r.id
            LEFT JOIN classes ac ON es.class_id = ac.id
            LEFT JOIN faculties f ON ac.faculty_id = f.id
        `;
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM exam_schedules es 
            LEFT JOIN courses c ON es.course_id = c.id
            LEFT JOIN rooms r ON es.room_id = r.id
            LEFT JOIN classes ac ON es.class_id = ac.id
        `;
        const queryParams = [];

        if (search) {
            const searchCondition = ' WHERE es.exam_room LIKE ? OR r.room_code LIKE ? OR r.room_name LIKE ? OR c.course_code LIKE ? OR c.course_name LIKE ? OR ac.class_code LIKE ? OR ac.class_name LIKE ?';
            query += searchCondition;
            countQuery += searchCondition;
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY es.exam_time DESC LIMIT ? OFFSET ?';
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
        console.error('Error in getAllExamSchedules:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy lịch thi' });
    }
};

exports.getExamScheduleById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT es.*, c.course_code, c.course_name,
                   r.room_code, r.room_name as room_full_name, r.building,
                   ac.class_code as academic_class_code, ac.class_name as academic_class_name,
                   f.faculty_code, f.faculty_name,
                   COALESCE(
                       NULLIF((SELECT COUNT(*) FROM exam_eligibility ee WHERE ee.exam_schedule_id = es.id), 0),
                       (SELECT COUNT(*) FROM students s WHERE s.class_id = es.class_id),
                       0
                   ) AS total_candidates,
                   (
                       SELECT COUNT(DISTINCT ea.student_id) 
                       FROM exam_attendance ea 
                       WHERE ea.exam_schedule_id = es.id AND ea.check_in_time IS NOT NULL
                   ) AS checked_in_count
            FROM exam_schedules es 
            LEFT JOIN courses c ON es.course_id = c.id 
            LEFT JOIN rooms r ON es.room_id = r.id
            LEFT JOIN classes ac ON es.class_id = ac.id
            LEFT JOIN faculties f ON ac.faculty_id = f.id
            WHERE es.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch thi' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error in getExamScheduleById:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.createExamSchedule = async (req, res) => {
    try {
        let { course_id, room_id, class_id, exam_room, exam_time, duration_minutes, seating_rows, seating_cols, disabled_seats, auto_enroll_class } = req.body;
        
        if (!course_id || !exam_time) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền thông tin bắt buộc: Môn thi, Giờ thi' });
        }

        const duration = parseInt(duration_minutes) || 90;
        const startDate = new Date(exam_time);
        const endDate = new Date(startDate.getTime() + duration * 60000);
        const exam_end_time = !isNaN(endDate.getTime()) ? endDate.toISOString().slice(0, 19).replace('T', ' ') : null;

        // If room_id is provided, automatically fetch room info if rows/cols not specified
        if (room_id) {
            const [roomRows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [room_id]);
            if (roomRows.length > 0) {
                const room = roomRows[0];
                if (!exam_room) exam_room = `${room.room_code} - ${room.room_name}`;
                if (!seating_rows) seating_rows = room.seating_rows;
                if (!seating_cols) seating_cols = room.seating_cols;
                if (!disabled_seats) disabled_seats = room.disabled_seats;
            }
        }

        if (!exam_room) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn phòng thi hoặc nhập tên phòng' });
        }

        const disabledStr = Array.isArray(disabled_seats) ? JSON.stringify(disabled_seats) : (disabled_seats || '[]');

        const [result] = await pool.query(
            `INSERT INTO exam_schedules 
             (course_id, room_id, class_id, exam_room, exam_time, exam_end_time, duration_minutes, seating_rows, seating_cols, disabled_seats) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                course_id,
                room_id || null,
                class_id || null,
                exam_room,
                exam_time,
                exam_end_time,
                duration,
                parseInt(seating_rows) || 6,
                parseInt(seating_cols) || 8,
                disabledStr
            ]
        );

        const examScheduleId = result.insertId;

        // Auto enroll class students into exam_eligibility if class_id is provided
        if (class_id && (auto_enroll_class === true || auto_enroll_class === 'true' || auto_enroll_class === undefined)) {
            const [students] = await pool.query('SELECT id FROM students WHERE class_id = ?', [class_id]);
            if (students.length > 0) {
                // Generate available seat coordinates
                const sRows = parseInt(seating_rows) || 6;
                const sCols = parseInt(seating_cols) || 8;
                let disabledList = [];
                try {
                    disabledList = typeof disabledStr === 'string' ? JSON.parse(disabledStr) : disabledStr;
                } catch (e) {
                    disabledList = [];
                }
                const disabledSet = new Set(disabledList.map(s => `${s.row}-${s.col}`));

                const availableSeats = [];
                for (let r = 0; r < sRows; r++) {
                    for (let c = 0; c < sCols; c++) {
                        if (!disabledSet.has(`${r}-${c}`)) {
                            availableSeats.push({ row: r, col: c });
                        }
                    }
                }

                const eligibilityValues = students.map((s, idx) => {
                    const seat = availableSeats[idx] || null;
                    return [
                        examScheduleId,
                        s.id,
                        1,
                        seat ? seat.row : null,
                        seat ? seat.col : null,
                        'regular',
                        'Tự động thêm từ lớp chính quy'
                    ];
                });

                if (eligibilityValues.length > 0) {
                    await pool.query(
                        'INSERT INTO exam_eligibility (exam_schedule_id, student_id, is_eligible, seat_row, seat_col, student_type, notes) VALUES ?',
                        [eligibilityValues]
                    );
                }
            }
        }
        
        res.status(201).json({ 
            success: true, 
            message: 'Tạo lịch thi thành công',
            data: { id: examScheduleId, course_id, room_id, class_id, exam_room, exam_time, exam_end_time, duration_minutes: duration }
        });
    } catch (error) {
        console.error('Error in createExamSchedule:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi tạo lịch thi' });
    }
};

exports.updateExamSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        let { course_id, room_id, class_id, exam_room, exam_time, duration_minutes, seating_rows, seating_cols, disabled_seats } = req.body;

        if (!course_id || !exam_time) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền thông tin bắt buộc' });
        }

        const duration = parseInt(duration_minutes) || 90;
        const startDate = new Date(exam_time);
        const endDate = new Date(startDate.getTime() + duration * 60000);
        const exam_end_time = !isNaN(endDate.getTime()) ? endDate.toISOString().slice(0, 19).replace('T', ' ') : null;

        if (room_id) {
            const [roomRows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [room_id]);
            if (roomRows.length > 0) {
                const room = roomRows[0];
                if (!exam_room) exam_room = `${room.room_code} - ${room.room_name}`;
                if (!seating_rows) seating_rows = room.seating_rows;
                if (!seating_cols) seating_cols = room.seating_cols;
                if (!disabled_seats) disabled_seats = room.disabled_seats;
            }
        }

        if (!exam_room) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn phòng thi hoặc nhập tên phòng' });
        }

        const disabledStr = Array.isArray(disabled_seats) ? JSON.stringify(disabled_seats) : (disabled_seats || '[]');

        const [result] = await pool.query(
            `UPDATE exam_schedules 
             SET course_id = ?, room_id = ?, class_id = ?, exam_room = ?, exam_time = ?, exam_end_time = ?, duration_minutes = ?, seating_rows = ?, seating_cols = ?, disabled_seats = ? 
             WHERE id = ?`,
            [
                course_id,
                room_id || null,
                class_id || null,
                exam_room,
                exam_time,
                exam_end_time,
                duration,
                parseInt(seating_rows) || 6,
                parseInt(seating_cols) || 8,
                disabledStr,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch thi' });
        }

        res.json({ success: true, message: 'Cập nhật lịch thi thành công' });
    } catch (error) {
        console.error('Error in updateExamSchedule:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật lịch thi' });
    }
};

exports.deleteExamSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check dependencies
        const [eligibility] = await pool.query('SELECT id FROM exam_eligibility WHERE exam_schedule_id = ? LIMIT 1', [id]);
        if (eligibility.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa lịch thi vì đã có danh sách sinh viên dự thi' });
        }
        
        const [attendance] = await pool.query('SELECT id FROM exam_attendance WHERE exam_schedule_id = ? LIMIT 1', [id]);
        if (attendance.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa lịch thi vì đã có dữ liệu điểm danh thi' });
        }

        const [result] = await pool.query('DELETE FROM exam_schedules WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch thi để xóa' });
        }

        res.json({ success: true, message: 'Xóa lịch thi thành công' });
    } catch (error) {
        console.error('Error in deleteExamSchedule:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa lịch thi' });
    }
};

// --- EXAM ELIGIBILITY ---

exports.getExamEligibility = async (req, res) => {
    try {
        const schedule_id = req.query.schedule_id;
        
        if (!schedule_id) {
            return res.status(400).json({ success: false, message: 'Thiếu schedule_id' });
        }

        const query = `
            SELECT ee.*, s.student_code, s.full_name, s.class_name, s.email,
                   ac.class_code as academic_class_code, ac.class_name as academic_class_name,
                   f.faculty_code, f.faculty_name,
                   (s.face_embedding IS NOT NULL) AS face_registered,
                   ea.id as attendance_id, ea.check_in_time, ea.confidence_score, ea.status as attendance_status,
                   ea.seat_row as actual_row, ea.seat_col as actual_col
            FROM exam_eligibility ee
            JOIN students s ON ee.student_id = s.id
            LEFT JOIN classes ac ON s.class_id = ac.id
            LEFT JOIN faculties f ON (s.faculty_id = f.id OR ac.faculty_id = f.id)
            LEFT JOIN exam_attendance ea ON (ea.exam_schedule_id = ee.exam_schedule_id AND ea.student_id = ee.student_id)
            WHERE ee.exam_schedule_id = ?
            ORDER BY ee.seat_row ASC, ee.seat_col ASC, s.student_code ASC
        `;
        
        let [rows] = await pool.query(query, [schedule_id]);

        // If no explicit eligibility records yet, fallback to class_id if assigned
        if (rows.length === 0) {
            const [sched] = await pool.query('SELECT class_id FROM exam_schedules WHERE id = ?', [schedule_id]);
            if (sched.length > 0 && sched[0].class_id) {
                const classQuery = `
                    SELECT NULL as id, ? as exam_schedule_id, s.id as student_id, 1 as is_eligible,
                           NULL as seat_row, NULL as seat_col, 'regular' as student_type, NULL as notes,
                           s.student_code, s.full_name, s.class_name, s.email,
                           ac.class_code as academic_class_code, ac.class_name as academic_class_name,
                           f.faculty_code, f.faculty_name,
                           (s.face_embedding IS NOT NULL) AS face_registered,
                           ea.id as attendance_id, ea.check_in_time, ea.confidence_score, ea.status as attendance_status,
                           ea.seat_row as actual_row, ea.seat_col as actual_col
                    FROM students s
                    LEFT JOIN classes ac ON s.class_id = ac.id
                    LEFT JOIN faculties f ON (s.faculty_id = f.id OR ac.faculty_id = f.id)
                    LEFT JOIN exam_attendance ea ON (ea.exam_schedule_id = ? AND ea.student_id = s.id)
                    WHERE s.class_id = ? OR s.class_name = (SELECT class_code FROM classes WHERE id = ?)
                    ORDER BY s.student_code ASC
                `;
                const [classRows] = await pool.query(classQuery, [schedule_id, schedule_id, sched[0].class_id, sched[0].class_id]);
                rows = classRows;
            }
        }

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error in getExamEligibility:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.addExamEligibility = async (req, res) => {
    try {
        const { exam_schedule_id, student_id, is_eligible, seat_row, seat_col, student_type, notes } = req.body;
        
        if (!exam_schedule_id || !student_id) {
            return res.status(400).json({ success: false, message: 'Thiếu exam_schedule_id hoặc student_id' });
        }

        // Check if already exists
        const [existing] = await pool.query(
            'SELECT id FROM exam_eligibility WHERE exam_schedule_id = ? AND student_id = ?', 
            [exam_schedule_id, student_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Sinh viên đã có trong danh sách dự thi này' });
        }

        const [result] = await pool.query(
            'INSERT INTO exam_eligibility (exam_schedule_id, student_id, is_eligible, seat_row, seat_col, student_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                exam_schedule_id, 
                student_id, 
                is_eligible !== undefined ? is_eligible : 1, 
                seat_row !== undefined ? seat_row : null, 
                seat_col !== undefined ? seat_col : null,
                student_type || 'regular',
                notes || null
            ]
        );
        
        res.status(201).json({ success: true, message: 'Đã thêm sinh viên vào danh sách dự thi' });
    } catch (error) {
        console.error('Error in addExamEligibility:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.bulkEnrollClassForExam = async (req, res) => {
    try {
        const { id } = req.params; // exam_schedule_id
        const { class_id, student_type, notes } = req.body;

        if (!class_id) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn lớp sinh viên' });
        }

        // Get schedule info for seating layout
        const [schedules] = await pool.query('SELECT * FROM exam_schedules WHERE id = ?', [id]);
        if (schedules.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch thi' });
        }
        const schedule = schedules[0];

        // Get all students in the given class
        const [classStudents] = await pool.query(
            `SELECT id, student_code, full_name FROM students 
             WHERE class_id = ? OR class_name = (SELECT class_code FROM classes WHERE id = ?)`,
            [class_id, class_id]
        );
        if (classStudents.length === 0) {
            return res.status(400).json({ success: false, message: 'Lớp này chưa có sinh viên nào' });
        }

        // Get already enrolled student IDs
        const [existing] = await pool.query('SELECT student_id, seat_row, seat_col FROM exam_eligibility WHERE exam_schedule_id = ?', [id]);
        const existingIds = new Set(existing.map(e => e.student_id));
        const occupiedSeats = new Set(existing.filter(e => e.seat_row !== null && e.seat_col !== null).map(e => `${e.seat_row}-${e.seat_col}`));

        // Parse disabled seats
        let disabledList = [];
        try {
            disabledList = typeof schedule.disabled_seats === 'string' ? JSON.parse(schedule.disabled_seats) : (schedule.disabled_seats || []);
        } catch (e) {
            disabledList = [];
        }
        disabledList.forEach(s => occupiedSeats.add(`${s.row}-${s.col}`));

        // Find available seats
        const availableSeats = [];
        const sRows = schedule.seating_rows || 6;
        const sCols = schedule.seating_cols || 8;
        for (let r = 0; r < sRows; r++) {
            for (let c = 0; c < sCols; c++) {
                if (!occupiedSeats.has(`${r}-${c}`)) {
                    availableSeats.push({ row: r, col: c });
                }
            }
        }

        let addedCount = 0;
        let seatIdx = 0;
        const toInsert = [];

        for (const student of classStudents) {
            if (!existingIds.has(student.id)) {
                const seat = seatIdx < availableSeats.length ? availableSeats[seatIdx++] : null;
                toInsert.push([
                    id,
                    student.id,
                    1,
                    seat ? seat.row : null,
                    seat ? seat.col : null,
                    student_type || 'regular',
                    notes || 'Nạp theo lớp'
                ]);
                addedCount++;
            }
        }

        if (toInsert.length > 0) {
            await pool.query(
                'INSERT INTO exam_eligibility (exam_schedule_id, student_id, is_eligible, seat_row, seat_col, student_type, notes) VALUES ?',
                [toInsert]
            );
        }

        res.json({
            success: true,
            message: `Đã nạp ${addedCount} sinh viên vào danh sách dự thi (bỏ qua ${classStudents.length - addedCount} SV đã có sẵn).`,
            data: { addedCount }
        });
    } catch (error) {
        console.error('Error in bulkEnrollClassForExam:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi nạp lớp vào lịch thi' });
    }
};

exports.removeExamEligibility = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM exam_eligibility WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy dữ liệu' });
        }

        res.json({ success: true, message: 'Đã xóa sinh viên khỏi danh sách dự thi' });
    } catch (error) {
        console.error('Error in removeExamEligibility:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// --- EXAM ATTENDANCE ---

exports.getExamAttendance = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const schedule_id = req.query.schedule_id; // Optional filter
        const offset = (page - 1) * limit;

        let whereClause = '';
        const queryParams = [];

        if (schedule_id) {
            whereClause = 'WHERE ea.exam_schedule_id = ?';
            queryParams.push(schedule_id);
        }

        const query = `
            SELECT ea.*, s.student_code, s.full_name, s.class_name,
                   es.exam_room, es.exam_time, es.exam_end_time, es.duration_minutes,
                   c.course_code, c.course_name,
                   r.room_code, r.room_name as room_full_name,
                   ea.seat_row as actual_row, ea.seat_col as actual_col,
                   CASE 
                       WHEN ee.seat_row = ea.seat_row AND ee.seat_col = ea.seat_col THEN 1
                       WHEN ee.id IS NULL THEN 1
                       ELSE 0
                   END as is_valid_seat
            FROM exam_attendance ea
            JOIN students s ON ea.student_id = s.id
            JOIN exam_schedules es ON ea.exam_schedule_id = es.id
            JOIN courses c ON es.course_id = c.id
            LEFT JOIN rooms r ON es.room_id = r.id
            LEFT JOIN exam_eligibility ee ON ee.student_id = ea.student_id AND ee.exam_schedule_id = ea.exam_schedule_id
            ${whereClause}
            ORDER BY ea.check_in_time DESC
            LIMIT ? OFFSET ?
        `;
        queryParams.push(limit, offset);

        const countQuery = `SELECT COUNT(*) as total FROM exam_attendance ea ${whereClause}`;
        const countParams = schedule_id ? [schedule_id] : [];

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
                totalPages: Math.ceil(total / limit) || 1
            }
        });
    } catch (error) {
        console.error('Error in getExamAttendance:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.deleteExamAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM exam_attendance WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy dữ liệu điểm danh thi' });
        }

        res.json({ success: true, message: 'Đã xóa dữ liệu điểm danh thi' });
    } catch (error) {
        console.error('Error in deleteExamAttendance:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
