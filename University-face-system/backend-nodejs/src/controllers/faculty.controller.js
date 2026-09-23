const pool = require('../config/db');

// GET /api/faculties
exports.getAllFaculties = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        let query = `
            SELECT f.*, 
                   (SELECT COUNT(*) FROM classes c WHERE c.faculty_id = f.id) AS class_count,
                   (SELECT COUNT(*) FROM classes c WHERE c.faculty_id = f.id) AS total_classes,
                   (SELECT COUNT(DISTINCT s.id) FROM students s 
                    LEFT JOIN classes c ON s.class_id = c.id 
                    WHERE s.faculty_id = f.id OR c.faculty_id = f.id) AS student_count,
                   (SELECT COUNT(DISTINCT s.id) FROM students s 
                    LEFT JOIN classes c ON s.class_id = c.id 
                    WHERE s.faculty_id = f.id OR c.faculty_id = f.id) AS total_students
            FROM faculties f
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM faculties f';
        const queryParams = [];
        const countParams = [];

        if (search) {
            const whereClause = ' WHERE f.faculty_code LIKE ? OR f.faculty_name LIKE ?';
            query += whereClause;
            countQuery += whereClause;
            queryParams.push(`%${search}%`, `%${search}%`);
            countParams.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY f.faculty_code ASC LIMIT ? OFFSET ?';
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
        console.error('Error in getAllFaculties:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách khoa' });
    }
};

// GET /api/faculties/:id
exports.getFacultyById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM faculties WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khoa' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error in getFacultyById:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// POST /api/faculties
exports.createFaculty = async (req, res) => {
    try {
        const { faculty_code, faculty_name, description } = req.body;

        if (!faculty_code || !faculty_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập Mã khoa và Tên khoa' });
        }

        const [existing] = await pool.query('SELECT id FROM faculties WHERE faculty_code = ?', [faculty_code.trim()]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Mã khoa đã tồn tại trên hệ thống' });
        }

        const [result] = await pool.query(
            'INSERT INTO faculties (faculty_code, faculty_name, description) VALUES (?, ?, ?)',
            [faculty_code.trim(), faculty_name.trim(), description || null]
        );

        res.status(201).json({
            success: true,
            message: 'Tạo khoa thành công',
            data: { id: result.insertId, faculty_code, faculty_name }
        });
    } catch (error) {
        console.error('Error in createFaculty:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi tạo khoa' });
    }
};

// PUT /api/faculties/:id
exports.updateFaculty = async (req, res) => {
    try {
        const { id } = req.params;
        const { faculty_code, faculty_name, description } = req.body;

        if (!faculty_code || !faculty_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập Mã khoa và Tên khoa' });
        }

        const [existing] = await pool.query('SELECT id FROM faculties WHERE faculty_code = ? AND id != ?', [faculty_code.trim(), id]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Mã khoa đã được sử dụng bởi khoa khác' });
        }

        const [result] = await pool.query(
            'UPDATE faculties SET faculty_code = ?, faculty_name = ?, description = ? WHERE id = ?',
            [faculty_code.trim(), faculty_name.trim(), description || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khoa để cập nhật' });
        }

        res.json({ success: true, message: 'Cập nhật khoa thành công' });
    } catch (error) {
        console.error('Error in updateFaculty:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật khoa' });
    }
};

// DELETE /api/faculties/:id
exports.deleteFaculty = async (req, res) => {
    try {
        const { id } = req.params;

        const [classes] = await pool.query('SELECT id FROM classes WHERE faculty_id = ? LIMIT 1', [id]);
        if (classes.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa khoa đang có lớp học trực thuộc!' });
        }

        const [students] = await pool.query('SELECT id FROM students WHERE faculty_id = ? LIMIT 1', [id]);
        if (students.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa khoa đang có sinh viên trực thuộc!' });
        }

        const [result] = await pool.query('DELETE FROM faculties WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khoa để xóa' });
        }

        res.json({ success: true, message: 'Xóa khoa thành công' });
    } catch (error) {
        console.error('Error in deleteFaculty:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa khoa' });
    }
};
