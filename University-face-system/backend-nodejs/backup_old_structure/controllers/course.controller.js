const pool = require('../config/db');

// Get all courses
exports.getAllCourses = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM courses ORDER BY id DESC');
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Lỗi getAllCourses:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy danh sách môn học' });
    }
};

// Get course by ID
exports.getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM courses WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy môn học' });
        }
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Lỗi getCourseById:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// Create a new course
exports.createCourse = async (req, res) => {
    try {
        const { course_code, course_name } = req.body;
        if (!course_code || !course_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập mã môn và tên môn học' });
        }

        const [existing] = await pool.query('SELECT * FROM courses WHERE course_code = ?', [course_code]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Mã môn học đã tồn tại' });
        }

        const [result] = await pool.query(
            'INSERT INTO courses (course_code, course_name) VALUES (?, ?)',
            [course_code, course_name]
        );

        return res.status(201).json({
            success: true,
            message: 'Thêm môn học thành công',
            data: { id: result.insertId, course_code, course_name }
        });
    } catch (error) {
        console.error('Lỗi createCourse:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi thêm môn học' });
    }
};

// Update a course
exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { course_code, course_name } = req.body;

        if (!course_code || !course_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập mã môn và tên môn học' });
        }

        const [existing] = await pool.query('SELECT * FROM courses WHERE course_code = ? AND id != ?', [course_code, id]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Mã môn học đã tồn tại' });
        }

        await pool.query(
            'UPDATE courses SET course_code = ?, course_name = ? WHERE id = ?',
            [course_code, course_name, id]
        );

        return res.status(200).json({
            success: true,
            message: 'Cập nhật môn học thành công',
            data: { id: parseInt(id), course_code, course_name }
        });
    } catch (error) {
        console.error('Lỗi updateCourse:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi cập nhật môn học' });
    }
};

// Delete a course
exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check dependencies (e.g. schedules)
        const [schedules] = await pool.query('SELECT id FROM class_schedules WHERE course_id = ? LIMIT 1', [id]);
        if (schedules.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa vì môn học đã có lịch học' });
        }
        
        const [examSchedules] = await pool.query('SELECT id FROM exam_schedules WHERE course_id = ? LIMIT 1', [id]);
        if (examSchedules.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa vì môn học đã có lịch thi' });
        }

        await pool.query('DELETE FROM courses WHERE id = ?', [id]);

        return res.status(200).json({ success: true, message: 'Xóa môn học thành công' });
    } catch (error) {
        console.error('Lỗi deleteCourse:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xóa môn học' });
    }
};
