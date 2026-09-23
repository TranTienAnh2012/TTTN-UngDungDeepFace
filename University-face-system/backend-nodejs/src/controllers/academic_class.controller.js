const pool = require('../config/db');

// GET /api/academic-classes
exports.getAllClasses = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const faculty_id = req.query.faculty_id || '';
        const offset = (page - 1) * limit;

        let query = `
            SELECT c.*, f.faculty_code, f.faculty_name,
                   (SELECT COUNT(DISTINCT s.id) FROM students s WHERE s.class_id = c.id OR s.class_name = c.class_code) AS student_count,
                   (SELECT COUNT(DISTINCT s.id) FROM students s WHERE s.class_id = c.id OR s.class_name = c.class_code) AS total_students
            FROM classes c
            LEFT JOIN faculties f ON c.faculty_id = f.id
        `;
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM classes c
            LEFT JOIN faculties f ON c.faculty_id = f.id
        `;
        const queryParams = [];
        const countParams = [];
        const whereClauses = [];

        if (search) {
            whereClauses.push('(c.class_code LIKE ? OR c.class_name LIKE ? OR f.faculty_name LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (faculty_id) {
            whereClauses.push('c.faculty_id = ?');
            queryParams.push(faculty_id);
            countParams.push(faculty_id);
        }

        if (whereClauses.length > 0) {
            const whereStr = ' WHERE ' + whereClauses.join(' AND ');
            query += whereStr;
            countQuery += whereStr;
        }

        query += ' ORDER BY c.class_code ASC LIMIT ? OFFSET ?';
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
        console.error('Error in getAllClasses:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách lớp học' });
    }
};

// GET /api/academic-classes/:id
exports.getClassById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT c.*, f.faculty_code, f.faculty_name,
                   (SELECT COUNT(DISTINCT s.id) FROM students s WHERE s.class_id = c.id OR s.class_name = c.class_code) AS student_count,
                   (SELECT COUNT(DISTINCT s.id) FROM students s WHERE s.class_id = c.id OR s.class_name = c.class_code) AS total_students
            FROM classes c
            LEFT JOIN faculties f ON c.faculty_id = f.id
            WHERE c.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error in getClassById:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/academic-classes/:id/students
exports.getClassStudents = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            `SELECT s.id, s.student_code, s.full_name, s.class_name, s.email, s.status, s.date_of_birth,
                    c.class_code, c.class_name as class_full_name,
                    f.faculty_code, f.faculty_name,
                    (s.face_embedding IS NOT NULL) AS face_registered
             FROM students s 
             LEFT JOIN classes c ON s.class_id = c.id
             LEFT JOIN faculties f ON (s.faculty_id = f.id OR c.faculty_id = f.id)
             WHERE s.class_id = ? OR s.class_name = (SELECT class_code FROM classes WHERE id = ?) 
             ORDER BY s.student_code ASC`,
            [id, id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error in getClassStudents:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// POST /api/academic-classes
exports.createClass = async (req, res) => {
    try {
        const { class_code, class_name, faculty_id, academic_year, status } = req.body;

        if (!class_code || !class_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập Mã lớp và Tên lớp' });
        }

        const [existing] = await pool.query('SELECT id FROM classes WHERE class_code = ?', [class_code.trim()]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Mã lớp đã tồn tại trên hệ thống' });
        }

        const [result] = await pool.query(
            'INSERT INTO classes (class_code, class_name, faculty_id, academic_year, status) VALUES (?, ?, ?, ?, ?)',
            [class_code.trim(), class_name.trim(), faculty_id || null, academic_year || null, status || 'Active']
        );

        res.status(201).json({
            success: true,
            message: 'Tạo lớp thành công',
            data: { id: result.insertId, class_code, class_name }
        });
    } catch (error) {
        console.error('Error in createClass:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi tạo lớp' });
    }
};

// PUT /api/academic-classes/:id
exports.updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { class_code, class_name, faculty_id, academic_year, status } = req.body;

        if (!class_code || !class_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập Mã lớp và Tên lớp' });
        }

        const [existing] = await pool.query('SELECT id FROM classes WHERE class_code = ? AND id != ?', [class_code.trim(), id]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Mã lớp đã được sử dụng bởi lớp khác' });
        }

        const [result] = await pool.query(
            'UPDATE classes SET class_code = ?, class_name = ?, faculty_id = ?, academic_year = ?, status = ? WHERE id = ?',
            [class_code.trim(), class_name.trim(), faculty_id || null, academic_year || null, status || 'Active', id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lớp để cập nhật' });
        }

        // Also update class_name in students table for consistency
        await pool.query('UPDATE students SET class_name = ? WHERE class_id = ?', [class_code.trim(), id]);

        res.json({ success: true, message: 'Cập nhật lớp thành công' });
    } catch (error) {
        console.error('Error in updateClass:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật lớp' });
    }
};

// DELETE /api/academic-classes/:id
exports.deleteClass = async (req, res) => {
    try {
        const { id } = req.params;

        const [students] = await pool.query('SELECT id FROM students WHERE class_id = ? LIMIT 1', [id]);
        if (students.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa lớp đang có sinh viên thuộc về lớp này!' });
        }

        const [schedules] = await pool.query('SELECT id FROM class_schedules WHERE class_id = ? LIMIT 1', [id]);
        if (schedules.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa lớp đang được gán lịch học!' });
        }

        const [result] = await pool.query('DELETE FROM classes WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lớp để xóa' });
        }

        res.json({ success: true, message: 'Xóa lớp thành công' });
    } catch (error) {
        console.error('Error in deleteClass:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa lớp' });
    }
};
