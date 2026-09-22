const AiService = require('../services/ai.service');
const pool = require('../config/db');

exports.verifyAttendance = async (req, res) => {
    try {
        const { student_id, schedule_id, image_base64, attendance_type = 'check_in' } = req.body;

        if (!student_id || !image_base64) {
            return res.status(400).json({ success: false, message: 'Thiếu student_id hoặc image_base64' });
        }

        // 1. Gửi ảnh sang Python AI Service để xác thực
        const aiResponse = await AiService.verifyFace(student_id, image_base64);

        if (aiResponse.match) {
            let attendanceResult = null;

            // 2. Nếu khớp, lưu/cập nhật lịch sử điểm danh vào database
            if (schedule_id) {
                const [existing] = await pool.query(
                    'SELECT * FROM class_attendance WHERE student_id = ? AND schedule_id = ? ORDER BY id DESC LIMIT 1',
                    [student_id, schedule_id]
                );

                if (attendance_type === 'check_out') {
                    if (existing.length > 0) {
                        const rec = existing[0];
                        await pool.query(
                            `UPDATE class_attendance 
                             SET check_out_time = NOW(), check_out_confidence = ?, check_out_status = 'Completed', 
                                 status = CASE WHEN check_in_time IS NOT NULL THEN 'Completed' ELSE 'Only Checked-out' END,
                                 confidence_score = GREATEST(COALESCE(confidence_score, 0), ?)
                             WHERE id = ?`,
                            [aiResponse.confidence, aiResponse.confidence, rec.id]
                        );
                        attendanceResult = {
                            action: 'check_out',
                            check_in_time: rec.check_in_time,
                            check_out_time: new Date(),
                            status: rec.check_in_time ? 'Completed' : 'Only Checked-out',
                            message: 'Điểm danh cuối giờ thành công'
                        };
                    } else {
                        await pool.query(
                            `INSERT INTO class_attendance (student_id, schedule_id, check_out_time, check_out_confidence, check_out_status, status, confidence_score) 
                             VALUES (?, ?, NOW(), ?, 'Completed', 'Only Checked-out', ?)`,
                            [student_id, schedule_id, aiResponse.confidence, aiResponse.confidence]
                        );
                        attendanceResult = {
                            action: 'check_out',
                            check_in_time: null,
                            check_out_time: new Date(),
                            status: 'Only Checked-out',
                            message: 'Điểm danh cuối giờ thành công (Chưa có điểm danh đầu giờ)'
                        };
                    }
                } else {
                    // attendance_type === 'check_in'
                    if (existing.length > 0) {
                        const rec = existing[0];
                        if (rec.check_in_time) {
                            attendanceResult = {
                                action: 'check_in',
                                check_in_time: rec.check_in_time,
                                check_out_time: rec.check_out_time,
                                status: rec.status,
                                message: 'Sinh viên đã được điểm danh đầu giờ trước đó'
                            };
                        } else {
                            await pool.query(
                                `UPDATE class_attendance 
                                 SET check_in_time = NOW(), check_in_confidence = ?, check_in_status = 'Present',
                                     status = CASE WHEN check_out_time IS NOT NULL THEN 'Completed' ELSE 'Checked-in' END,
                                     confidence_score = GREATEST(COALESCE(confidence_score, 0), ?)
                                 WHERE id = ?`,
                                [aiResponse.confidence, aiResponse.confidence, rec.id]
                            );
                            attendanceResult = {
                                action: 'check_in',
                                check_in_time: new Date(),
                                check_out_time: rec.check_out_time,
                                status: rec.check_out_time ? 'Completed' : 'Checked-in',
                                message: 'Điểm danh đầu giờ thành công'
                            };
                        }
                    } else {
                        await pool.query(
                            `INSERT INTO class_attendance (student_id, schedule_id, check_in_time, check_in_confidence, check_in_status, status, confidence_score) 
                             VALUES (?, ?, NOW(), ?, 'Present', 'Checked-in', ?)`,
                            [student_id, schedule_id, aiResponse.confidence, aiResponse.confidence]
                        );
                        attendanceResult = {
                            action: 'check_in',
                            check_in_time: new Date(),
                            check_out_time: null,
                            status: 'Checked-in',
                            message: 'Điểm danh đầu giờ thành công'
                        };
                    }
                }
            }

            return res.status(200).json({
                success: true,
                message: attendanceResult?.message || 'Xác thực thành công',
                confidence: aiResponse.confidence,
                attendance: attendanceResult
            });
        } else {
            return res.status(401).json({
                success: false,
                message: 'Xác thực khuôn mặt thất bại. Không khớp với dữ liệu sinh viên.',
                confidence: aiResponse.confidence
            });
        }
    } catch (error) {
        console.error('Lỗi verifyAttendance:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.registerFace = async (req, res) => {
    try {
        const { student_id, image_base64 } = req.body;

        if (!student_id || !image_base64) {
            return res.status(400).json({ success: false, message: 'Thiếu student_id hoặc image_base64' });
        }

        const aiResponse = await AiService.registerFace(student_id, image_base64);

        return res.status(200).json({
            success: true,
            message: 'Đăng ký khuôn mặt thành công'
        });
    } catch (error) {
        console.error('Lỗi registerFace:', error);
        return res.status(400).json({ success: false, message: error.message || 'Lỗi server khi đăng ký khuôn mặt' });
    }
};

exports.detectPose = async (req, res) => {
    try {
        const { image_base64 } = req.body;
        if (!image_base64) {
            return res.status(400).json({ success: false, message: 'Thiếu image_base64' });
        }
        const aiResponse = await AiService.detectPose(image_base64);
        return res.status(200).json(aiResponse);
    } catch (error) {
        console.error('Lỗi detectPose:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.registerFace3Step = async (req, res) => {
    try {
        const { student_id, image_straight, image_left, image_right } = req.body;
        
        if (!student_id || !image_straight || !image_left || !image_right) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin hoặc ảnh' });
        }

        const aiResponse = await AiService.registerFace3Step(student_id, image_straight, image_left, image_right);
        
        return res.status(200).json({
            success: true,
            message: 'Đăng ký khuôn mặt 3 bước thành công'
        });
    } catch (error) {
        console.error('Lỗi registerFace3Step:', error);
        return res.status(400).json({ success: false, message: error.message || 'Lỗi server khi đăng ký 3 bước' });
    }
};

exports.getStudents = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, student_code, full_name, class_name, (face_embedding IS NOT NULL) as has_face FROM students ORDER BY id DESC'
        );
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Lỗi getStudents:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.quickCreateStudent = async (req, res) => {
    try {
        const { student_code, full_name, class_name, date_of_birth } = req.body;
        if (!student_code || !full_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập Mã Sinh Viên và Họ Tên' });
        }

        // Check if student already exists
        const [existing] = await pool.query(
            'SELECT id, student_code, full_name, class_name, (face_embedding IS NOT NULL) as has_face FROM students WHERE student_code = ?',
            [student_code]
        );

        if (existing.length > 0) {
            // Update info if provided
            if (class_name || full_name) {
                await pool.query(
                    'UPDATE students SET full_name = ?, class_name = COALESCE(?, class_name) WHERE id = ?',
                    [full_name, class_name || null, existing[0].id]
                );
            }
            return res.status(200).json({
                success: true,
                message: 'Đã cập nhật sinh viên sẵn có',
                data: {
                    id: existing[0].id,
                    student_code: existing[0].student_code,
                    full_name,
                    class_name: class_name || existing[0].class_name,
                    has_face: existing[0].has_face
                }
            });
        }

        const [result] = await pool.query(
            'INSERT INTO students (student_code, full_name, class_name, date_of_birth, status) VALUES (?, ?, ?, ?, ?)',
            [student_code, full_name, class_name || null, date_of_birth || null, 'Active']
        );

        return res.status(201).json({
            success: true,
            message: 'Tạo sinh viên mới thành công',
            data: {
                id: result.insertId,
                student_code,
                full_name,
                class_name,
                has_face: 0
            }
        });
    } catch (error) {
        console.error('Lỗi quickCreateStudent:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi tạo sinh viên' });
    }
};

exports.autoIdentifyAndCheckIn = async (req, res) => {
    try {
        const { image_base64, attendance_type = 'check_in', schedule_id = null } = req.body;
        if (!image_base64) {
            return res.status(400).json({ success: false, message: 'Thiếu image_base64' });
        }

        // 1. Send frame to AI Service for 1:N identification
        const aiRes = await AiService.identifyFace(image_base64);

        if (!aiRes.match || !aiRes.student_id) {
            return res.status(200).json({
                success: true,
                match: false,
                box: aiRes.box || null,
                image_size: aiRes.image_size || null,
                confidence: aiRes.confidence || 0,
                quality_reason: aiRes.quality_reason || null,
                message: aiRes.message || 'Chưa tìm thấy khuôn mặt phù hợp'
            });
        }

        // 2. Fetch student info
        const [studentRows] = await pool.query(
            'SELECT id, student_code, full_name, date_of_birth, class_name, status FROM students WHERE id = ?',
            [aiRes.student_id]
        );

        if (studentRows.length === 0) {
            return res.status(200).json({
                success: true,
                match: false,
                message: 'Không tìm thấy thông tin sinh viên'
            });
        }

        const student = studentRows[0];

        // 3. Class schedule attendance info
        let scheduleQuery = `
            SELECT cs.id as schedule_id, cs.room_name, cs.start_time, cs.end_time, c.course_code, c.course_name 
            FROM class_schedules cs 
            JOIN courses c ON cs.course_id = c.id
        `;
        let scheduleParams = [];
        if (schedule_id) {
            scheduleQuery += ' WHERE cs.id = ?';
            scheduleParams.push(schedule_id);
        } else {
            scheduleQuery += ' WHERE DATE(cs.start_time) = CURDATE() ORDER BY cs.start_time ASC LIMIT 1';
        }

        let [classSchedules] = await pool.query(scheduleQuery, scheduleParams);
        if (classSchedules.length === 0 && !schedule_id) {
            const [latestSched] = await pool.query(`
                SELECT cs.id as schedule_id, cs.room_name, cs.start_time, cs.end_time, c.course_code, c.course_name 
                FROM class_schedules cs 
                JOIN courses c ON cs.course_id = c.id
                ORDER BY cs.id DESC LIMIT 1
            `);
            classSchedules = latestSched;
        }

        let classAttendanceInfo = null;
        if (classSchedules.length > 0) {
            const sched = classSchedules[0];
            const [existingClassAtt] = await pool.query(
                'SELECT * FROM class_attendance WHERE student_id = ? AND schedule_id = ? ORDER BY id DESC LIMIT 1',
                [student.id, sched.schedule_id]
            );

            let checkInTimeStr = null;
            let checkOutTimeStr = null;
            let statusText = '';
            let isComplete = false;

            if (attendance_type === 'check_out') {
                if (existingClassAtt.length > 0) {
                    const rec = existingClassAtt[0];
                    await pool.query(
                        `UPDATE class_attendance 
                         SET check_out_time = NOW(), check_out_confidence = ?, check_out_status = 'Completed', 
                             status = CASE WHEN check_in_time IS NOT NULL THEN 'Completed' ELSE 'Only Checked-out' END,
                             confidence_score = GREATEST(COALESCE(confidence_score, 0), ?)
                         WHERE id = ?`,
                        [aiRes.confidence, aiRes.confidence, rec.id]
                    );
                    checkInTimeStr = rec.check_in_time ? new Date(rec.check_in_time).toLocaleTimeString('vi-VN') : null;
                    checkOutTimeStr = new Date().toLocaleTimeString('vi-VN');
                    isComplete = !!rec.check_in_time;
                    statusText = isComplete 
                        ? '✓ Hoàn thành buổi học (Đủ đầu giờ & cuối giờ)' 
                        : '⚠️ Điểm danh cuối giờ (Chưa check-in đầu giờ)';
                } else {
                    await pool.query(
                        `INSERT INTO class_attendance (student_id, schedule_id, check_out_time, check_out_confidence, check_out_status, status, confidence_score) 
                         VALUES (?, ?, NOW(), ?, 'Completed', 'Only Checked-out', ?)`,
                        [student.id, sched.schedule_id, aiRes.confidence, aiRes.confidence]
                    );
                    checkOutTimeStr = new Date().toLocaleTimeString('vi-VN');
                    statusText = '⚠️ Điểm danh cuối giờ (Chưa check-in đầu giờ)';
                }
            } else {
                // attendance_type === 'check_in'
                if (existingClassAtt.length > 0) {
                    const rec = existingClassAtt[0];
                    checkInTimeStr = rec.check_in_time 
                        ? new Date(rec.check_in_time).toLocaleTimeString('vi-VN') 
                        : new Date().toLocaleTimeString('vi-VN');
                    checkOutTimeStr = rec.check_out_time 
                        ? new Date(rec.check_out_time).toLocaleTimeString('vi-VN') 
                        : null;
                    isComplete = !!rec.check_out_time;

                    if (!rec.check_in_time) {
                        await pool.query(
                            `UPDATE class_attendance 
                             SET check_in_time = NOW(), check_in_confidence = ?, check_in_status = 'Present',
                                 status = CASE WHEN check_out_time IS NOT NULL THEN 'Completed' ELSE 'Checked-in' END,
                                 confidence_score = GREATEST(COALESCE(confidence_score, 0), ?)
                             WHERE id = ?`,
                            [aiRes.confidence, aiRes.confidence, rec.id]
                        );
                    }
                    statusText = isComplete 
                        ? '✓ Hoàn thành buổi học (Đủ đầu giờ & cuối giờ)' 
                        : '✓ Đã điểm danh đầu giờ';
                } else {
                    await pool.query(
                        `INSERT INTO class_attendance (student_id, schedule_id, check_in_time, check_in_confidence, check_in_status, status, confidence_score) 
                         VALUES (?, ?, NOW(), ?, 'Present', 'Checked-in', ?)`,
                        [student.id, sched.schedule_id, aiRes.confidence, aiRes.confidence]
                    );
                    checkInTimeStr = new Date().toLocaleTimeString('vi-VN');
                    statusText = '✓ Đã điểm danh đầu giờ thành công';
                }
            }

            classAttendanceInfo = {
                course_code: sched.course_code,
                course_name: sched.course_name,
                room_name: sched.room_name,
                attendance_type: attendance_type,
                check_in_time: checkInTimeStr,
                check_out_time: checkOutTimeStr,
                is_complete: isComplete,
                status: statusText
            };
        } else {
            // Không có lịch học hôm nay -> trả về null
            classAttendanceInfo = null;
        }

        // 4. Exam schedule attendance info - Lấy lịch thi đang diễn ra hôm nay
        const [examSchedules] = await pool.query(
            `SELECT es.id as exam_schedule_id, es.exam_room, es.exam_time, c.course_code, c.course_name 
             FROM exam_schedules es 
             JOIN courses c ON es.course_id = c.id 
             WHERE DATE(es.exam_time) = CURDATE()
             ORDER BY es.exam_time ASC LIMIT 1`
        );

        let examAttendanceInfo = null;
        if (examSchedules.length > 0) {
            const exam = examSchedules[0];
            const [elig] = await pool.query(
                'SELECT * FROM exam_eligibility WHERE exam_schedule_id = ? AND student_id = ?',
                [exam.exam_schedule_id, student.id]
            );

            const [existingExamAtt] = await pool.query(
                'SELECT * FROM exam_attendance WHERE student_id = ? AND exam_schedule_id = ?',
                [student.id, exam.exam_schedule_id]
            );

            let seatRow = elig.length > 0 ? elig[0].seat_row : 2;
            let seatCol = elig.length > 0 ? elig[0].seat_col : 5;
            let isEligible = elig.length > 0 ? elig[0].is_eligible === 1 : true;

            if (existingExamAtt.length === 0) {
                await pool.query(
                    'INSERT INTO exam_attendance (student_id, exam_schedule_id, check_in_time, is_verified, seat_row, seat_col) VALUES (?, ?, NOW(), 1, ?, ?)',
                    [student.id, exam.exam_schedule_id, seatRow, seatCol]
                );
            }

            examAttendanceInfo = {
                course_code: exam.course_code,
                course_name: exam.course_name,
                exam_room: exam.exam_room,
                seat: `Hàng ${seatRow} - Ghế ${seatCol}`,
                is_eligible: isEligible,
                status: isEligible ? 'Hợp lệ - Đã check-in dự thi' : '⚠️ KHÔNG đủ điều kiện thi'
            };
        } else {
            examAttendanceInfo = null;
        }

        return res.status(200).json({
            success: true,
            match: true,
            box: aiRes.box || null,
            image_size: aiRes.image_size || null,
            confidence: aiRes.confidence,
            student,
            class_attendance: classAttendanceInfo,
            exam_attendance: examAttendanceInfo,
            message: `Tự động xác thực thành công sinh viên ${student.full_name} (${student.student_code})`
        });

    } catch (error) {
        console.error('Lỗi autoIdentifyAndCheckIn:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi tự động nhận diện sinh viên' });
    }
};


// ═══════════════════════════════════════════════
//  GET /schedules/today  — lịch học hôm nay
// ═══════════════════════════════════════════════
exports.getTodaySchedules = async (req, res) => {
    try {
        let [rows] = await pool.query(`
            SELECT cs.id, cs.room_name,
                   cs.start_time, cs.end_time,
                   c.course_code, c.course_name,
                   (SELECT COUNT(*) FROM class_attendance ca WHERE ca.schedule_id = cs.id AND ca.check_in_time IS NOT NULL)  AS checked_in_count,
                   (SELECT COUNT(*) FROM class_attendance ca WHERE ca.schedule_id = cs.id AND ca.check_out_time IS NOT NULL) AS checked_out_count
            FROM class_schedules cs
            JOIN courses c ON cs.course_id = c.id
            WHERE DATE(cs.start_time) = CURDATE()
            ORDER BY cs.start_time ASC
        `);
        if (rows.length === 0) {
            [rows] = await pool.query(`
                SELECT cs.id, cs.room_name,
                       cs.start_time, cs.end_time,
                       c.course_code, c.course_name,
                       (SELECT COUNT(*) FROM class_attendance ca WHERE ca.schedule_id = cs.id AND ca.check_in_time IS NOT NULL)  AS checked_in_count,
                       (SELECT COUNT(*) FROM class_attendance ca WHERE ca.schedule_id = cs.id AND ca.check_out_time IS NOT NULL) AS checked_out_count
                FROM class_schedules cs
                JOIN courses c ON cs.course_id = c.id
                ORDER BY cs.start_time DESC
            `);
        }
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Lỗi getTodaySchedules:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// ═══════════════════════════════════════════════
//  GET /schedules/active — lịch đang trong giờ học
// ═══════════════════════════════════════════════
exports.getActiveSchedules = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT cs.id, cs.room_name,
                   cs.start_time, cs.end_time,
                   c.course_code, c.course_name
            FROM class_schedules cs
            JOIN courses c ON cs.course_id = c.id
            WHERE NOW() BETWEEN cs.start_time AND cs.end_time
            ORDER BY cs.start_time ASC
        `);
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Lỗi getActiveSchedules:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// ═══════════════════════════════════════════════
//  GET /attendance/session/:schedule_id  — trạng thái buổi học
// ═══════════════════════════════════════════════
exports.getSessionStatus = async (req, res) => {
    try {
        const { schedule_id } = req.params;

        const [sched] = await pool.query(`
            SELECT cs.*, c.course_code, c.course_name
            FROM class_schedules cs
            JOIN courses c ON cs.course_id = c.id
            WHERE cs.id = ?`, [schedule_id]);

        if (sched.length === 0)
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch học' });

        const s = sched[0];
        const now = new Date();
        const start = new Date(s.start_time);
        const end   = new Date(s.end_time);
        let phase = now < start ? 'not_started' : now > end ? 'ended' : 'ongoing';

        const [[stats]] = await pool.query(`
            SELECT
                COUNT(*) AS total,
                SUM(check_in_time IS NOT NULL)  AS checked_in,
                SUM(check_out_time IS NOT NULL) AS checked_out,
                SUM(status = 'Completed')       AS completed,
                SUM(status = 'Absent' OR (check_in_time IS NULL AND check_out_time IS NULL)) AS absent
            FROM class_attendance
            WHERE schedule_id = ?`, [schedule_id]);

        return res.status(200).json({
            success: true,
            data: {
                schedule: {
                    id: s.id,
                    course_code: s.course_code,
                    course_name: s.course_name,
                    room_name: s.room_name,
                    teacher_name: s.teacher_name || '',
                    start_time: s.start_time,
                    end_time: s.end_time,
                    phase // 'not_started' | 'ongoing' | 'ended'
                },
                stats: {
                    total:        stats.total        || 0,
                    checked_in:   stats.checked_in   || 0,
                    checked_out:  stats.checked_out  || 0,
                    completed:    stats.completed     || 0,
                    absent:       stats.absent        || 0
                }
            }
        });
    } catch (error) {
        console.error('Lỗi getSessionStatus:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// ═══════════════════════════════════════════════
//  GET /attendance/list/:schedule_id — danh sách điểm danh theo buổi
// ═══════════════════════════════════════════════
exports.getAttendanceBySchedule = async (req, res) => {
    try {
        const { schedule_id } = req.params;

        const [rows] = await pool.query(`
            SELECT
                ca.id,
                s.student_code, s.full_name, s.class_name,
                ca.check_in_time,   ca.check_in_confidence,  ca.check_in_status,
                ca.check_out_time,  ca.check_out_confidence, ca.check_out_status,
                ca.status,
                ca.confidence_score,
                ca.updated_at
            FROM class_attendance ca
            JOIN students s ON s.id = ca.student_id
            WHERE ca.schedule_id = ?
            ORDER BY ca.check_in_time ASC, ca.check_out_time ASC
        `, [schedule_id]);

        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Lỗi getAttendanceBySchedule:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// ═══════════════════════════════════════════════
//  GET /attendance/report  — báo cáo điểm danh
//  Query: ?date_from=&date_to=&course_id=&schedule_id=
// ═══════════════════════════════════════════════
exports.getAttendanceReport = async (req, res) => {
    try {
        const {
            date_from,
            date_to,
            course_id,
            schedule_id
        } = req.query;

        let where = ['1=1'];
        let params = [];

        if (schedule_id) {
            where.push('ca.schedule_id = ?');
            params.push(schedule_id);
        } else {
            if (date_from) { where.push('DATE(cs.start_time) >= ?'); params.push(date_from); }
            if (date_to)   { where.push('DATE(cs.start_time) <= ?'); params.push(date_to); }
            if (course_id) { where.push('cs.course_id = ?');         params.push(course_id); }
        }

        const [rows] = await pool.query(`
            SELECT
                ca.id,
                s.student_code, s.full_name, s.class_name,
                c.course_code,  c.course_name,
                cs.room_name,
                cs.start_time,  cs.end_time,
                ca.check_in_time,  ca.check_in_confidence,  ca.check_in_status,
                ca.check_out_time, ca.check_out_confidence, ca.check_out_status,
                ca.status,
                ca.confidence_score
            FROM class_attendance ca
            JOIN students        s  ON s.id         = ca.student_id
            JOIN class_schedules cs ON cs.id        = ca.schedule_id
            JOIN courses         c  ON c.id         = cs.course_id
            WHERE ${where.join(' AND ')}
            ORDER BY cs.start_time DESC, s.student_code ASC
        `, params);

        // Summary stats
        const total       = rows.length;
        const checkedIn   = rows.filter(r => r.check_in_time).length;
        const checkedOut  = rows.filter(r => r.check_out_time).length;
        const completed   = rows.filter(r => r.status === 'Completed').length;
        const absent      = rows.filter(r => !r.check_in_time && !r.check_out_time).length;

        return res.status(200).json({
            success: true,
            summary: { total, checkedIn, checkedOut, completed, absent },
            data: rows
        });
    } catch (error) {
        console.error('Lỗi getAttendanceReport:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// ═══════════════════════════════════════════════
//  POST /schedules/create — Tạo ca học mới
// ═══════════════════════════════════════════════
exports.createSchedule = async (req, res) => {
    try {
        const { course_name, room_name, start_time, end_time, teacher_name } = req.body;
        if (!course_name || !room_name || !start_time || !end_time) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin ca học' });
        }

        // Find or create course
        let [courses] = await pool.query('SELECT id FROM courses WHERE course_name = ? LIMIT 1', [course_name]);
        let courseId;
        if (courses.length > 0) {
            courseId = courses[0].id;
        } else {
            const courseCode = 'CS' + Math.floor(100 + Math.random() * 900);
            const [newCourse] = await pool.query(
                'INSERT INTO courses (course_code, course_name, credits) VALUES (?, ?, 3)',
                [courseCode, course_name]
            );
            courseId = newCourse.insertId;
        }

        const [result] = await pool.query(
            `INSERT INTO class_schedules (course_id, room_name, teacher_name, start_time, end_time) 
             VALUES (?, ?, ?, ?, ?)`,
            [courseId, room_name, teacher_name || 'Giảng viên', start_time, end_time]
        );

        return res.status(201).json({
            success: true,
            message: 'Tạo buổi học mới thành công',
            data: { id: result.insertId, course_id: courseId, course_name, room_name, start_time, end_time }
        });
    } catch (error) {
        console.error('Lỗi createSchedule:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi tạo ca học' });
    }
};

// ═══════════════════════════════════════════════
//  GET /schedules/all — Lấy toàn bộ lịch giảng dạy
// ═══════════════════════════════════════════════
exports.getAllSchedules = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                cs.id, cs.course_id, cs.class_id, cs.room_id, cs.shift_id, cs.room_name, cs.teacher_name,
                cs.start_time, cs.end_time, cs.is_recurring, cs.day_of_week, cs.period_start, cs.period_end, cs.week_from, cs.week_to,
                c.course_code, c.course_name, c.credits,
                cl.class_code as official_class_code, cl.class_name as official_class_name,
                f.faculty_name,
                COALESCE(
                    NULLIF((SELECT COUNT(DISTINCT e.student_id) FROM enrollments e WHERE e.schedule_id = cs.id), 0),
                    (SELECT COUNT(*) FROM students s WHERE s.class_id = cs.class_id OR s.class_name = cl.class_code),
                    0
                ) as student_count,
                (
                    SELECT COUNT(DISTINCT ca.student_id) 
                    FROM class_attendance ca 
                    WHERE ca.schedule_id = cs.id AND (ca.check_in_time IS NOT NULL OR ca.check_out_time IS NOT NULL)
                ) as attended_count
            FROM class_schedules cs
            JOIN courses c ON cs.course_id = c.id
            LEFT JOIN classes cl ON cs.class_id = cl.id
            LEFT JOIN faculties f ON cl.faculty_id = f.id
            ORDER BY cs.start_time DESC
        `);

        const now = new Date();
        const formatted = rows.map(s => {
            const start = new Date(s.start_time);
            const end = new Date(s.end_time);
            let status = 'Upcoming';
            if (now >= start && now <= end) status = 'Active';
            else if (now > end) status = 'Ended';

            const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
            const dayStr = days[start.getDay()];
            const startTimeStr = start.toTimeString().slice(0, 5);
            const endTimeStr = end.toTimeString().slice(0, 5);

            return {
                ...s,
                day: dayStr,
                time: `${startTimeStr} – ${endTimeStr}`,
                course: `${s.course_code} - ${s.course_name}`,
                room: s.room_name || 'Chưa xếp phòng',
                group: s.official_class_code ? `Lớp ${s.official_class_code}` : 'Nhóm 01',
                count: Number(s.student_count) || 0,
                attended_count: Number(s.attended_count) || 0,
                status
            };
        });

        return res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        console.error('Lỗi getAllSchedules:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// ═══════════════════════════════════════════════
//  GET /exams/list — Lấy tất cả ca coi thi
// ═══════════════════════════════════════════════
exports.getExamSchedules = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                es.id, es.exam_room, es.exam_time,
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
            const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
            const dateStr = `${days[examDate.getDay()]}, ${examDate.toLocaleDateString('vi-VN')}`;
            const timeStr = `${examDate.toTimeString().slice(0, 5)} – 10:30`;

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

// ═══════════════════════════════════════════════
//  GET /reports/teacher-summary — Thống kê báo cáo giảng viên
// ═══════════════════════════════════════════════
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

// ═══════════════════════════════════════════════
//  GET /reports/export — Xuất file CSV/Excel điểm danh
// ═══════════════════════════════════════════════
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
