const pool = require('../../config/db');

// GET /reports/teacher-summary
exports.getTeacherReportSummary = async (req, res) => {
    try {
        const [[stats]] = await pool.query(`
            SELECT 
                COUNT(*) as total_attendance,
                SUM(check_in_time IS NOT NULL AND check_out_time IS NOT NULL) as complete_attendance,
                SUM(check_in_time IS NOT NULL AND check_out_time IS NULL) as partial_attendance,
                SUM(check_in_time IS NULL) as absent_attendance
            FROM class_attendance
        `);

        const [courseStats] = await pool.query(`
            SELECT 
                c.id, c.course_code, c.course_name,
                (SELECT COUNT(*) FROM students) as total_students,
                (SELECT COUNT(DISTINCT cs.id) FROM class_schedules cs WHERE cs.course_id = c.id) as total_sessions,
                (SELECT COUNT(*) FROM class_attendance ca JOIN class_schedules cs ON ca.schedule_id = cs.id WHERE cs.course_id = c.id AND ca.check_in_time IS NOT NULL) as total_checkins
            FROM courses c
        `);

        const courseSummary = courseStats.map(c => {
            const sessions = c.total_sessions || 1;
            const expected = (c.total_students || 35) * sessions;
            const actual = c.total_checkins || 0;
            const rate = expected > 0 ? ((actual / expected) * 100).toFixed(1) : '95.0';

            return {
                course: `${c.course_code} - ${c.course_name}`,
                students: `${c.total_students || 40} SV`,
                sessions: `${sessions} buổi`,
                rate: `${rate}%`,
                absent_avg: `${((expected - actual) / sessions).toFixed(1)} SV/buổi`,
                rating: Number(rate) >= 90 ? 'Rất tốt' : Number(rate) >= 80 ? 'Tốt' : 'Đạt'
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                total_attendance: stats.total_attendance || 0,
                complete_attendance: stats.complete_attendance || 0,
                partial_attendance: stats.partial_attendance || 0,
                absent_attendance: stats.absent_attendance || 0,
                courseSummary
            }
        });
    } catch (error) {
        console.error('Lỗi getTeacherReportSummary:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /reports/export
exports.exportReportExcel = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                ca.id, s.student_code, s.full_name, s.class_name,
                c.course_code, c.course_name, cs.room_name,
                ca.check_in_time, ca.check_out_time, ca.status
            FROM class_attendance ca
            JOIN students s ON s.id = ca.student_id
            JOIN class_schedules cs ON cs.id = ca.schedule_id
            JOIN courses c ON c.id = cs.course_id
            ORDER BY ca.id DESC
        `);

        let csv = '\uFEFFMã SV,Họ và tên,Lớp,Mã HP,Tên môn học,Phòng,Check-in,Check-out,Trạng thái\n';
        rows.forEach(r => {
            csv += `"${r.student_code}","${r.full_name}","${r.class_name || ''}","${r.course_code}","${r.course_name}","${r.room_name}","${r.check_in_time ? new Date(r.check_in_time).toLocaleString('vi-VN') : ''}","${r.check_out_time ? new Date(r.check_out_time).toLocaleString('vi-VN') : ''}","${r.status || ''}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="Bao_Cao_Diem_Danh.csv"');
        return res.send(csv);
    } catch (error) {
        console.error('Lỗi exportReportExcel:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
