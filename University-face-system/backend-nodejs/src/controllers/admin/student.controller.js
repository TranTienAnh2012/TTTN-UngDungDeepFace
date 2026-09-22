const pool = require('../../config/db');

exports.getAllStudents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const class_id = req.query.class_id || '';
        const faculty_id = req.query.faculty_id || '';
        const offset = (page - 1) * limit;

        let query = `
            SELECT s.id, s.student_code, s.full_name, s.date_of_birth, 
                   s.faculty_id, s.class_id, s.class_name, s.email, s.status, s.face_embedding, s.created_at,
                   c.class_code, c.class_name as class_full_name,
                   f.faculty_code, f.faculty_name
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN faculties f ON (s.faculty_id = f.id OR c.faculty_id = f.id)
        `;
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN faculties f ON (s.faculty_id = f.id OR c.faculty_id = f.id)
        `;
        const queryParams = [];
        const countParams = [];
        const whereClauses = [];

        if (search) {
            whereClauses.push('(s.student_code LIKE ? OR s.full_name LIKE ? OR s.class_name LIKE ? OR c.class_code LIKE ? OR c.class_name LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (class_id) {
            whereClauses.push('s.class_id = ?');
            queryParams.push(class_id);
            countParams.push(class_id);
        }

        if (faculty_id) {
            whereClauses.push('(s.faculty_id = ? OR c.faculty_id = ?)');
            queryParams.push(faculty_id, faculty_id);
            countParams.push(faculty_id, faculty_id);
        }

        if (whereClauses.length > 0) {
            const whereStr = ' WHERE ' + whereClauses.join(' AND ');
            query += whereStr;
            countQuery += whereStr;
        }

        query += ' ORDER BY s.id DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const [rows] = await pool.query(query, queryParams);
        const [countResult] = await pool.query(countQuery, countParams);
        const total = countResult[0]?.total || 0;

        const formattedRows = rows.map(student => {
            let embeddingBase64 = null;
            if (student.face_embedding) {
                embeddingBase64 = Buffer.from(student.face_embedding).toString('base64');
            }
            return {
                ...student,
                face_embedding: embeddingBase64
            };
        });

        res.json({
            success: true,
            data: formattedRows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error in getAllStudents:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách sinh viên' });
    }
};

exports.getStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT s.id, s.student_code, s.full_name, s.date_of_birth, 
                   s.faculty_id, s.class_id, s.class_name, s.email, s.status, s.face_embedding, s.created_at,
                   c.class_code, c.class_name as class_full_name, 
                   f.faculty_code, f.faculty_name
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN faculties f ON (s.faculty_id = f.id OR c.faculty_id = f.id)
            WHERE s.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên' });
        }

        const student = rows[0];
        if (student.face_embedding) {
            student.face_embedding = Buffer.from(student.face_embedding).toString('base64');
        }

        res.json({ success: true, data: student });
    } catch (error) {
        console.error('Error in getStudentById:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.createStudent = async (req, res) => {
    try {
        let { student_code, full_name, date_of_birth, faculty_id, class_id, class_name, email, status } = req.body;
        
        if (!student_code || !full_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền mã sinh viên và họ tên' });
        }

        const [existing] = await pool.query('SELECT id FROM students WHERE student_code = ?', [student_code.trim()]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Mã sinh viên đã tồn tại' });
        }

        // Auto-fill class_name and faculty_id from classes if class_id provided
        if (class_id) {
            const [cRows] = await pool.query('SELECT class_code, faculty_id FROM classes WHERE id = ?', [class_id]);
            if (cRows.length > 0) {
                if (!class_name) class_name = cRows[0].class_code;
                if (!faculty_id) faculty_id = cRows[0].faculty_id;
            }
        }

        const [result] = await pool.query(
            `INSERT INTO students (student_code, full_name, date_of_birth, faculty_id, class_id, class_name, email, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                student_code.trim(),
                full_name.trim(),
                date_of_birth || null,
                faculty_id || null,
                class_id || null,
                class_name || null,
                email || null,
                status || 'Active'
            ]
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Tạo sinh viên thành công',
            data: { id: result.insertId, student_code, full_name }
        });
    } catch (error) {
        console.error('Error in createStudent:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi tạo sinh viên' });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        let { student_code, full_name, date_of_birth, faculty_id, class_id, class_name, email, status } = req.body;

        if (!student_code || !full_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền mã sinh viên và họ tên' });
        }

        const [existing] = await pool.query('SELECT id FROM students WHERE student_code = ? AND id != ?', [student_code.trim(), id]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Mã sinh viên đã được sử dụng bởi người khác' });
        }

        if (class_id) {
            const [cRows] = await pool.query('SELECT class_code, faculty_id FROM classes WHERE id = ?', [class_id]);
            if (cRows.length > 0) {
                if (!class_name) class_name = cRows[0].class_code;
                if (!faculty_id) faculty_id = cRows[0].faculty_id;
            }
        }

        const [result] = await pool.query(
            `UPDATE students 
             SET student_code = ?, full_name = ?, date_of_birth = ?, faculty_id = ?, class_id = ?, class_name = ?, email = ?, status = ? 
             WHERE id = ?`,
            [
                student_code.trim(),
                full_name.trim(),
                date_of_birth || null,
                faculty_id || null,
                class_id || null,
                class_name || null,
                email || null,
                status || 'Active',
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên để cập nhật' });
        }

        res.json({ success: true, message: 'Cập nhật sinh viên thành công' });
    } catch (error) {
        console.error('Error in updateStudent:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật sinh viên' });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [classAtt] = await pool.query('SELECT id FROM class_attendance WHERE student_id = ? LIMIT 1', [id]);
        if (classAtt.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa sinh viên này vì đã có dữ liệu điểm danh lớp' });
        }

        const [examAtt] = await pool.query('SELECT id FROM exam_attendance WHERE student_id = ? LIMIT 1', [id]);
        if (examAtt.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa sinh viên này vì đã có dữ liệu điểm danh thi' });
        }

        const [result] = await pool.query('DELETE FROM students WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên để xóa' });
        }

        res.json({ success: true, message: 'Xóa sinh viên thành công' });
    } catch (error) {
        console.error('Error in deleteStudent:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa sinh viên' });
    }
};
