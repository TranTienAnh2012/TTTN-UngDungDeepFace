const pool = require('../config/db');

// GET /api/rooms
exports.getAllRooms = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || '';
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM rooms';
        let countQuery = 'SELECT COUNT(*) as total FROM rooms';
        const queryParams = [];
        const countParams = [];
        const whereClauses = [];

        if (search) {
            whereClauses.push('(room_code LIKE ? OR room_name LIKE ? OR building LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (status) {
            whereClauses.push('status = ?');
            queryParams.push(status);
            countParams.push(status);
        }

        if (whereClauses.length > 0) {
            const whereStr = ' WHERE ' + whereClauses.join(' AND ');
            query += whereStr;
            countQuery += whereStr;
        }

        query += ' ORDER BY room_code ASC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const [rows] = await pool.query(query, queryParams);
        const [countResult] = await pool.query(countQuery, countParams);
        const total = countResult[0].total;

        // Parse disabled_seats safely for each room
        const data = rows.map(r => {
            let disabledSeatsArr = [];
            try {
                if (r.disabled_seats) {
                    disabledSeatsArr = typeof r.disabled_seats === 'string' ? JSON.parse(r.disabled_seats) : r.disabled_seats;
                }
            } catch {
                disabledSeatsArr = [];
            }
            return {
                ...r,
                disabled_seats: disabledSeatsArr
            };
        });

        res.json({
            success: true,
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error in getAllRooms:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách phòng' });
    }
};

// GET /api/rooms/:id
exports.getRoomById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });
        }

        const room = rows[0];
        try {
            room.disabled_seats = room.disabled_seats ? JSON.parse(room.disabled_seats) : [];
        } catch {
            room.disabled_seats = [];
        }

        res.json({ success: true, data: room });
    } catch (error) {
        console.error('Error in getRoomById:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// POST /api/rooms
exports.createRoom = async (req, res) => {
    try {
        const { room_code, room_name, building, room_type, capacity, seating_rows, seating_cols, disabled_seats, status } = req.body;

        if (!room_code || !room_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập Mã phòng và Tên phòng' });
        }

        // Check duplicate code
        const [existing] = await pool.query('SELECT id FROM rooms WHERE room_code = ?', [room_code.trim()]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Mã phòng đã tồn tại trên hệ thống' });
        }

        const rows = parseInt(seating_rows) || 6;
        const cols = parseInt(seating_cols) || 8;
        const disabledStr = Array.isArray(disabled_seats) ? JSON.stringify(disabled_seats) : (disabled_seats || '[]');
        const actualCapacity = capacity ? parseInt(capacity) : (rows * cols - (Array.isArray(disabled_seats) ? disabled_seats.length : 0));

        const [result] = await pool.query(
            `INSERT INTO rooms (room_code, room_name, building, room_type, capacity, seating_rows, seating_cols, disabled_seats, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                room_code.trim(),
                room_name.trim(),
                building ? building.trim() : null,
                room_type || 'theory',
                actualCapacity,
                rows,
                cols,
                disabledStr,
                status || 'Active'
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Tạo phòng học / phòng thi thành công',
            data: { id: result.insertId, room_code, room_name }
        });
    } catch (error) {
        console.error('Error in createRoom:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi tạo phòng' });
    }
};

// PUT /api/rooms/:id
exports.updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { room_code, room_name, building, room_type, capacity, seating_rows, seating_cols, disabled_seats, status } = req.body;

        if (!room_code || !room_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập Mã phòng và Tên phòng' });
        }

        // Check duplicate code on other rooms
        const [existing] = await pool.query('SELECT id FROM rooms WHERE room_code = ? AND id != ?', [room_code.trim(), id]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Mã phòng đã được sử dụng bởi phòng khác' });
        }

        const rows = parseInt(seating_rows) || 6;
        const cols = parseInt(seating_cols) || 8;
        const disabledStr = Array.isArray(disabled_seats) ? JSON.stringify(disabled_seats) : (disabled_seats || '[]');
        const actualCapacity = capacity ? parseInt(capacity) : (rows * cols - (Array.isArray(disabled_seats) ? disabled_seats.length : 0));

        const [result] = await pool.query(
            `UPDATE rooms 
             SET room_code = ?, room_name = ?, building = ?, room_type = ?, capacity = ?, seating_rows = ?, seating_cols = ?, disabled_seats = ?, status = ?
             WHERE id = ?`,
            [
                room_code.trim(),
                room_name.trim(),
                building ? building.trim() : null,
                room_type || 'theory',
                actualCapacity,
                rows,
                cols,
                disabledStr,
                status || 'Active',
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phòng để cập nhật' });
        }

        res.json({ success: true, message: 'Cập nhật phòng thành công' });
    } catch (error) {
        console.error('Error in updateRoom:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật phòng' });
    }
};

// DELETE /api/rooms/:id
exports.deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if room is linked to any active schedules
        const [exams] = await pool.query('SELECT id FROM exam_schedules WHERE room_id = ? LIMIT 1', [id]);
        if (exams.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa phòng đang được xếp trong lịch thi!' });
        }

        const [classes] = await pool.query('SELECT id FROM class_schedules WHERE room_id = ? LIMIT 1', [id]);
        if (classes.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa phòng đang được xếp trong lịch học!' });
        }

        const [result] = await pool.query('DELETE FROM rooms WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phòng để xóa' });
        }

        res.json({ success: true, message: 'Xóa phòng thành công' });
    } catch (error) {
        console.error('Error in deleteRoom:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa phòng' });
    }
};
