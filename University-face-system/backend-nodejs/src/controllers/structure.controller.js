const pool = require('../config/db');

// ── Khoa (Faculties) ──────────────────────────────────────────
exports.getFaculties = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM faculties ORDER BY faculty_code ASC');
        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Lỗi getFaculties:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách Khoa' });
    }
};

exports.createFaculty = async (req, res) => {
    try {
        const { faculty_code, faculty_name } = req.body;
        if (!faculty_code || !faculty_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập mã Khoa và tên Khoa' });
        }
        const [result] = await pool.query(
            'INSERT INTO faculties (faculty_code, faculty_name) VALUES (?, ?)',
            [faculty_code.trim().toUpperCase(), faculty_name.trim()]
        );
        return res.status(201).json({ success: true, message: 'Thêm Khoa thành công', data: { id: result.insertId, faculty_code, faculty_name } });
    } catch (error) {
        console.error('Lỗi createFaculty:', error);
        return res.status(500).json({ success: false, message: 'Mã Khoa đã tồn tại hoặc có lỗi server' });
    }
};

// ── Khóa học (Batches) ───────────────────────────────────────
exports.getBatches = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM batches ORDER BY start_year DESC');
        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Lỗi getBatches:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách Khóa học' });
    }
};

exports.createBatch = async (req, res) => {
    try {
        const { batch_code, batch_name, start_year, end_year } = req.body;
        if (!batch_code || !batch_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập mã Khóa và tên Khóa' });
        }
        const [result] = await pool.query(
            'INSERT INTO batches (batch_code, batch_name, start_year, end_year) VALUES (?, ?, ?, ?)',
            [batch_code.trim().toUpperCase(), batch_name.trim(), start_year || null, end_year || null]
        );
        return res.status(201).json({ success: true, message: 'Thêm Khóa thành công', data: { id: result.insertId, batch_code, batch_name } });
    } catch (error) {
        console.error('Lỗi createBatch:', error);
        return res.status(500).json({ success: false, message: 'Mã Khóa đã tồn tại hoặc có lỗi server' });
    }
};

// ── Lớp sinh hoạt (Student Classes) ──────────────────────────
exports.getStudentClasses = async (req, res) => {
    try {
        const { faculty_id, batch_id } = req.query;
        let query = `
            SELECT sc.*, f.faculty_name, f.faculty_code, b.batch_name, b.batch_code
            FROM student_classes sc
            JOIN faculties f ON sc.faculty_id = f.id
            JOIN batches b ON sc.batch_id = b.id
        `;
        const params = [];
        const conditions = [];

        if (faculty_id) {
            conditions.push('sc.faculty_id = ?');
            params.push(faculty_id);
        }
        if (batch_id) {
            conditions.push('sc.batch_id = ?');
            params.push(batch_id);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY sc.class_code ASC';

        const [rows] = await pool.query(query, params);
        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Lỗi getStudentClasses:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách Lớp sinh hoạt' });
    }
};

exports.createStudentClass = async (req, res) => {
    try {
        const { class_code, class_name, faculty_id, batch_id } = req.body;
        if (!class_code || !class_name || !faculty_id || !batch_id) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ mã Lớp, tên Lớp, Khoa và Khóa' });
        }
        const [result] = await pool.query(
            'INSERT INTO student_classes (class_code, class_name, faculty_id, batch_id) VALUES (?, ?, ?, ?)',
            [class_code.trim().toUpperCase(), class_name.trim(), faculty_id, batch_id]
        );
        return res.status(201).json({ success: true, message: 'Thêm Lớp sinh hoạt thành công', data: { id: result.insertId, class_code, class_name } });
    } catch (error) {
        console.error('Lỗi createStudentClass:', error);
        return res.status(500).json({ success: false, message: 'Mã Lớp đã tồn tại hoặc có lỗi server' });
    }
};

// ── Phòng học / Phòng thi (Rooms) ────────────────────────────
exports.getRooms = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM rooms ORDER BY room_code ASC');
        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Lỗi getRooms:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách Phòng học' });
    }
};

exports.createRoom = async (req, res) => {
    try {
        const { room_code, room_name, building, capacity, seating_rows, seating_cols } = req.body;
        if (!room_code || !room_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập mã phòng và tên phòng' });
        }
        const [result] = await pool.query(
            'INSERT INTO rooms (room_code, room_name, building, capacity, seating_rows, seating_cols) VALUES (?, ?, ?, ?, ?, ?)',
            [room_code.trim().toUpperCase(), room_name.trim(), building || null, capacity || 40, seating_rows || 5, seating_cols || 8]
        );
        return res.status(201).json({ success: true, message: 'Thêm Phòng học thành công', data: { id: result.insertId, room_code, room_name } });
    } catch (error) {
        console.error('Lỗi createRoom:', error);
        return res.status(500).json({ success: false, message: 'Mã phòng đã tồn tại hoặc có lỗi server' });
    }
};
