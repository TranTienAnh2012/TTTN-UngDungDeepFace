const pool = require('../config/db');

// GET /api/shifts
exports.getAllShifts = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM study_shifts ORDER BY start_time ASC');
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error in getAllShifts:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách ca học' });
    }
};

// POST /api/shifts
exports.createShift = async (req, res) => {
    try {
        const { shift_code, shift_name, start_time, end_time, period_start, period_end, shift_type } = req.body;

        if (!shift_code || !shift_name || !start_time || !end_time) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập Mã ca, Tên ca, Giờ bắt đầu và Giờ kết thúc' });
        }

        const [existing] = await pool.query('SELECT id FROM study_shifts WHERE shift_code = ?', [shift_code.trim()]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Mã ca học đã tồn tại' });
        }

        const [result] = await pool.query(
            `INSERT INTO study_shifts (shift_code, shift_name, start_time, end_time, period_start, period_end, shift_type)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                shift_code.trim(),
                shift_name.trim(),
                start_time,
                end_time,
                period_start ? parseInt(period_start) : null,
                period_end ? parseInt(period_end) : null,
                shift_type || 'morning'
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Tạo ca học thành công',
            data: { id: result.insertId, shift_code, shift_name }
        });
    } catch (error) {
        console.error('Error in createShift:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi tạo ca học' });
    }
};

// PUT /api/shifts/:id
exports.updateShift = async (req, res) => {
    try {
        const { id } = req.params;
        const { shift_code, shift_name, start_time, end_time, period_start, period_end, shift_type } = req.body;

        if (!shift_code || !shift_name || !start_time || !end_time) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin ca học' });
        }

        const [result] = await pool.query(
            `UPDATE study_shifts 
             SET shift_code = ?, shift_name = ?, start_time = ?, end_time = ?, period_start = ?, period_end = ?, shift_type = ?
             WHERE id = ?`,
            [
                shift_code.trim(),
                shift_name.trim(),
                start_time,
                end_time,
                period_start ? parseInt(period_start) : null,
                period_end ? parseInt(period_end) : null,
                shift_type || 'morning',
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy ca học' });
        }

        res.json({ success: true, message: 'Cập nhật ca học thành công' });
    } catch (error) {
        console.error('Error in updateShift:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// DELETE /api/shifts/:id
exports.deleteShift = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM study_shifts WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy ca học' });
        }
        res.json({ success: true, message: 'Xóa ca học thành công' });
    } catch (error) {
        console.error('Error in deleteShift:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
