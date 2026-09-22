const pool = require('../../config/db');

// GET /teacher/exams
exports.getExamSchedules = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                es.id, es.exam_room, es.exam_time, es.end_time,
                es.seating_rows, es.seating_cols,
                c.course_code, c.course_name,
                (SELECT COUNT(*) FROM students) as total_candidates,
                (SELECT COUNT(DISTINCT student_id) FROM exam_attendance WHERE exam_schedule_id = es.id) as checked_in_count
            FROM exam_schedules es
            JOIN courses c ON es.course_id = c.id
            ORDER BY es.exam_time DESC
        `);

        const formatted = rows.map(e => {
            const examDate = new Date(e.exam_time);
            const endDate = e.end_time ? new Date(e.end_time) : new Date(examDate.getTime() + 90 * 60000);
            const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
            const dateStr = `${days[examDate.getDay()]}, ${examDate.toLocaleDateString('vi-VN')}`;
            const startTimeStr = examDate.toTimeString().slice(0, 5);
            const endTimeStr = endDate.toTimeString().slice(0, 5);
            const timeStr = `${startTimeStr} – ${endTimeStr}`;

            return {
                id: e.id,
                title: `Thi · ${e.course_code} - ${e.course_name}`,
                date: dateStr,
                time: timeStr,
                room: e.exam_room,
                candidates: e.total_candidates || 40,
                checkedIn: e.checked_in_count || 0,
                type: 'Giữa/Cuối kỳ',
                status: 'Upcoming'
            };
        });

        return res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        console.error('Lỗi getExamSchedules:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
