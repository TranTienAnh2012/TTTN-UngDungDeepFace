const AiService = require('../../services/ai.service');
const pool = require('../../config/db');

let ExcelJS = null;
try {
    ExcelJS = require('exceljs');
} catch (err) {
    console.warn('exceljs module not loaded:', err.message);
}

exports.verifyAttendance = async (req, res) => {
    try {
        const { student_id, schedule_id, image_base64, attendance_type = 'check_in', session_type = 'class' } = req.body;

        if (!student_id || !image_base64) {
            return res.status(400).json({ success: false, message: 'Thiếu student_id hoặc image_base64' });
        }

        const aiResponse = await AiService.verifyFace(student_id, image_base64);

        if (aiResponse.match) {
            let attendanceResult = null;

            if (schedule_id) {
                if (session_type === 'exam') {
                    const [existing] = await pool.query(
                        'SELECT * FROM exam_attendance WHERE student_id = ? AND exam_schedule_id = ? ORDER BY id DESC LIMIT 1',
                        [student_id, schedule_id]
                    );

                    if (attendance_type === 'check_out') {
                        if (existing.length > 0) {
                            const rec = existing[0];
                            await pool.query(
                                `UPDATE exam_attendance 
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
                                message: 'Điểm danh ra phòng thi thành công'
                            };
                        } else {
                            await pool.query(
                                `INSERT INTO exam_attendance (student_id, exam_schedule_id, check_out_time, check_out_confidence, check_out_status, status, confidence_score, is_verified) 
                                 VALUES (?, ?, NOW(), ?, 'Completed', 'Only Checked-out', ?, 1)`,
                                [student_id, schedule_id, aiResponse.confidence, aiResponse.confidence]
                            );
                            attendanceResult = {
                                action: 'check_out',
                                check_in_time: null,
                                check_out_time: new Date(),
                                status: 'Only Checked-out',
                                message: 'Điểm danh ra phòng thi thành công (Chưa điểm danh vào phòng thi)'
                            };
                        }
                    } else {
                        if (existing.length > 0) {
                            const rec = existing[0];
                            if (rec.check_in_time) {
                                attendanceResult = {
                                    action: 'check_in',
                                    check_in_time: rec.check_in_time,
                                    check_out_time: rec.check_out_time,
                                    status: rec.status,
                                    message: 'Thí sinh đã được điểm danh vào phòng thi trước đó'
                                };
                            } else {
                                await pool.query(
                                    `UPDATE exam_attendance 
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
                                    message: 'Điểm danh vào phòng thi thành công'
                                };
                            }
                        } else {
                            await pool.query(
                                `INSERT INTO exam_attendance (student_id, exam_schedule_id, check_in_time, check_in_confidence, check_in_status, status, confidence_score, is_verified) 
                                 VALUES (?, ?, NOW(), ?, 'Present', 'Checked-in', ?, 1)`,
                                [student_id, schedule_id, aiResponse.confidence, aiResponse.confidence]
                            );
                            attendanceResult = {
                                action: 'check_in',
                                check_in_time: new Date(),
                                check_out_time: null,
                                status: 'Checked-in',
                                message: 'Điểm danh vào phòng thi thành công'
                            };
                        }
                    }
                } else {
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

exports.autoIdentifyAndCheckIn = async (req, res) => {
    try {
        const { image_base64, attendance_type = 'check_in', schedule_id = null, session_type = null } = req.body;
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
                is_live: aiRes.is_live !== false,
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
        if (schedule_id && session_type !== 'exam') {
            scheduleQuery += ' WHERE cs.id = ?';
            scheduleParams.push(schedule_id);
        } else {
            scheduleQuery += ' WHERE DATE(cs.start_time) = CURDATE() ORDER BY cs.start_time ASC LIMIT 1';
        }

        let [classSchedules] = await pool.query(scheduleQuery, scheduleParams);
        if (classSchedules.length === 0 && !schedule_id && session_type !== 'exam') {
            const [latestSched] = await pool.query(`
                SELECT cs.id as schedule_id, cs.room_name, cs.start_time, cs.end_time, c.course_code, c.course_name 
                FROM class_schedules cs 
                JOIN courses c ON cs.course_id = c.id
                ORDER BY cs.id DESC LIMIT 1
            `);
            classSchedules = latestSched;
        }

        let classAttendanceInfo = null;
        if (classSchedules.length > 0 && session_type !== 'exam') {
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
            classAttendanceInfo = null;
        }

        // 4. Exam schedule attendance info
        let examQuery = `
            SELECT es.id as exam_schedule_id, es.exam_room, es.exam_time, es.end_time, c.course_code, c.course_name 
            FROM exam_schedules es 
            JOIN courses c ON es.course_id = c.id 
        `;
        let examParams = [];
        if (schedule_id && session_type === 'exam') {
            examQuery += ' WHERE es.id = ?';
            examParams.push(schedule_id);
        } else {
            examQuery += ' WHERE DATE(es.exam_time) = CURDATE() ORDER BY es.exam_time ASC LIMIT 1';
        }

        let [examSchedules] = await pool.query(examQuery, examParams);

        if (examSchedules.length === 0 && !schedule_id) {
            const [latestExam] = await pool.query(`
                SELECT es.id as exam_schedule_id, es.exam_room, es.exam_time, es.end_time, c.course_code, c.course_name 
                FROM exam_schedules es 
                JOIN courses c ON es.course_id = c.id 
                ORDER BY es.exam_time DESC LIMIT 1
            `);
            examSchedules = latestExam;
        }

        let examAttendanceInfo = null;
        if (examSchedules.length > 0) {
            const exam = examSchedules[0];
            const [elig] = await pool.query(
                'SELECT * FROM exam_eligibility WHERE exam_schedule_id = ? AND student_id = ?',
                [exam.exam_schedule_id, student.id]
            );

            const [existingExamAtt] = await pool.query(
                'SELECT * FROM exam_attendance WHERE student_id = ? AND exam_schedule_id = ? ORDER BY id DESC LIMIT 1',
                [student.id, exam.exam_schedule_id]
            );

            let seatRow = elig.length > 0 ? elig[0].seat_row : 2;
            let seatCol = elig.length > 0 ? elig[0].seat_col : 5;
            let isEligible = elig.length > 0 ? elig[0].is_eligible === 1 : true;

            let checkInTimeStr = null;
            let checkOutTimeStr = null;
            let statusText = '';
            let isComplete = false;

            if (attendance_type === 'check_out') {
                if (existingExamAtt.length > 0) {
                    const rec = existingExamAtt[0];
                    await pool.query(
                        `UPDATE exam_attendance 
                         SET check_out_time = NOW(), check_out_confidence = ?, check_out_status = 'Completed', 
                             status = CASE WHEN check_in_time IS NOT NULL THEN 'Completed' ELSE 'Only Checked-out' END,
                             confidence_score = GREATEST(COALESCE(confidence_score, 0), ?)
                         WHERE id = ?`,
                        [aiRes.confidence, aiRes.confidence, rec.id]
                    );
                    checkInTimeStr = rec.check_in_time ? new Date(rec.check_in_time).toLocaleTimeString('vi-VN') : null;
                    checkOutTimeStr = new Date().toLocaleTimeString('vi-VN');
                    isComplete = !!rec.check_in_time;
                    statusText = isComplete ? '✓ Hoàn thành dự thi (Đã ra phòng thi)' : '⚠️ Check-out ra phòng thi (Chưa check-in)';
                } else {
                    await pool.query(
                        `INSERT INTO exam_attendance (student_id, exam_schedule_id, check_out_time, check_out_confidence, check_out_status, status, confidence_score, is_verified, seat_row, seat_col) 
                         VALUES (?, ?, NOW(), ?, 'Completed', 'Only Checked-out', ?, 1, ?, ?)`,
                        [student.id, exam.exam_schedule_id, aiRes.confidence, aiRes.confidence, seatRow, seatCol]
                    );
                    checkOutTimeStr = new Date().toLocaleTimeString('vi-VN');
                    statusText = '⚠️ Check-out ra phòng thi (Chưa check-in vào phòng thi)';
                }
            } else {
                // check_in
                if (existingExamAtt.length > 0) {
                    const rec = existingExamAtt[0];
                    checkInTimeStr = rec.check_in_time 
                        ? new Date(rec.check_in_time).toLocaleTimeString('vi-VN') 
                        : new Date().toLocaleTimeString('vi-VN');
                    checkOutTimeStr = rec.check_out_time 
                        ? new Date(rec.check_out_time).toLocaleTimeString('vi-VN') 
                        : null;
                    isComplete = !!rec.check_out_time;

                    if (!rec.check_in_time) {
                        await pool.query(
                            `UPDATE exam_attendance 
                             SET check_in_time = NOW(), check_in_confidence = ?, check_in_status = 'Present',
                                 status = CASE WHEN check_out_time IS NOT NULL THEN 'Completed' ELSE 'Checked-in' END,
                                 confidence_score = GREATEST(COALESCE(confidence_score, 0), ?)
                             WHERE id = ?`,
                            [aiRes.confidence, aiRes.confidence, rec.id]
                        );
                    }
                    statusText = isComplete ? '✓ Hoàn thành dự thi (Đã ra phòng thi)' : '✓ Đã vào phòng thi';
                } else {
                    await pool.query(
                        `INSERT INTO exam_attendance (student_id, exam_schedule_id, check_in_time, check_in_confidence, check_in_status, status, confidence_score, is_verified, seat_row, seat_col) 
                         VALUES (?, ?, NOW(), ?, 'Present', 'Checked-in', ?, 1, ?, ?)`,
                        [student.id, exam.exam_schedule_id, aiRes.confidence, aiRes.confidence, seatRow, seatCol]
                    );
                    checkInTimeStr = new Date().toLocaleTimeString('vi-VN');
                    statusText = '✓ Đã điểm danh vào phòng thi thành công';
                }
            }

            examAttendanceInfo = {
                course_code: exam.course_code,
                course_name: exam.course_name,
                exam_room: exam.exam_room,
                seat: (seatRow !== null && seatCol !== null) ? `Hàng ${seatRow + 1} - Ghế ${seatCol + 1}` : 'Tự do',
                is_eligible: isEligible,
                attendance_type: attendance_type,
                check_in_time: checkInTimeStr,
                check_out_time: checkOutTimeStr,
                is_complete: isComplete,
                status: isEligible ? statusText : '⚠️ KHÔNG đủ điều kiện thi'
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
            is_live: aiRes.is_live !== false,
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

exports.registerFace = async (req, res) => {
    try {
        const { student_id, image_base64 } = req.body;

        if (!student_id || !image_base64) {
            return res.status(400).json({ success: false, message: 'Thiếu student_id hoặc image_base64' });
        }

        await AiService.registerFace(student_id, image_base64);

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

        await AiService.registerFace3Step(student_id, image_straight, image_left, image_right);
        
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

        const [existing] = await pool.query(
            'SELECT id, student_code, full_name, class_name, (face_embedding IS NOT NULL) as has_face FROM students WHERE student_code = ?',
            [student_code]
        );

        if (existing.length > 0) {
            return res.status(200).json({
                success: true,
                message: 'Sinh viên đã tồn tại trong hệ thống',
                data: existing[0]
            });
        }

        const [result] = await pool.query(
            'INSERT INTO students (student_code, full_name, class_name, date_of_birth, status) VALUES (?, ?, ?, ?, "Active")',
            [student_code, full_name, class_name || null, date_of_birth || null]
        );

        return res.status(201).json({
            success: true,
            message: 'Thêm sinh viên thành công',
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
        return res.status(500).json({ success: false, message: 'Lỗi server khi tạo sinh viên nhanh' });
    }
};

exports.getSessionStatus = async (req, res) => {
    try {
        const { schedule_id } = req.params;
        const type = req.query.type || req.query.session_type || 'class';

        if (type === 'exam') {
            const [scheduleRows] = await pool.query(`
                SELECT es.id as schedule_id, es.exam_room as room_name, es.exam_time as start_time, es.end_time, c.course_code, c.course_name 
                FROM exam_schedules es
                JOIN courses c ON c.id = es.course_id
                WHERE es.id = ?
            `, [schedule_id]);

            if (scheduleRows.length === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy ca thi' });
            }
            const schedule = scheduleRows[0];

            const [attRows] = await pool.query(`
                SELECT 
                    ea.id, ea.student_id,
                    s.student_code, s.full_name, s.class_name,
                    ea.check_in_time,  ea.check_in_confidence,  ea.check_in_status,
                    ea.check_out_time, ea.check_out_confidence, ea.check_out_status,
                    ea.seat_row, ea.seat_col,
                    ea.status, ea.confidence_score
                FROM exam_attendance ea
                JOIN students s ON s.id = ea.student_id
                WHERE ea.exam_schedule_id = ?
                ORDER BY COALESCE(ea.check_out_time, ea.check_in_time) DESC
            `, [schedule_id]);

            const total      = attRows.length;
            const checkedIn  = attRows.filter(r => r.check_in_time).length;
            const checkedOut = attRows.filter(r => r.check_out_time).length;
            const completed  = attRows.filter(r => r.status === 'Completed').length;

            return res.status(200).json({
                success: true,
                data: {
                    schedule,
                    summary: { total, checkedIn, checkedOut, completed },
                    attendances: attRows
                }
            });
        }

        const [scheduleRows] = await pool.query(`
            SELECT cs.*, c.course_code, c.course_name 
            FROM class_schedules cs
            JOIN courses c ON c.id = cs.course_id
            WHERE cs.id = ?
        `, [schedule_id]);

        if (scheduleRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy buổi học' });
        }
        const schedule = scheduleRows[0];

        const [attRows] = await pool.query(`
            SELECT 
                ca.id, ca.student_id,
                s.student_code, s.full_name, s.class_name,
                ca.check_in_time,  ca.check_in_confidence,  ca.check_in_status,
                ca.check_out_time, ca.check_out_confidence, ca.check_out_status,
                ca.status, ca.confidence_score
            FROM class_attendance ca
            JOIN students s ON s.id = ca.student_id
            WHERE ca.schedule_id = ?
            ORDER BY COALESCE(ca.check_out_time, ca.check_in_time) DESC
        `, [schedule_id]);

        const total      = attRows.length;
        const checkedIn  = attRows.filter(r => r.check_in_time).length;
        const checkedOut = attRows.filter(r => r.check_out_time).length;
        const completed  = attRows.filter(r => r.status === 'Completed').length;

        return res.status(200).json({
            success: true,
            data: {
                schedule,
                summary: { total, checkedIn, checkedOut, completed },
                attendances: attRows
            }
        });
    } catch (error) {
        console.error('Lỗi getSessionStatus:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.getAttendanceBySchedule = async (req, res) => {
    try {
        const { schedule_id } = req.params;
        const type = req.query.type || req.query.session_type || 'class';

        if (type === 'exam') {
            const [rows] = await pool.query(`
                SELECT 
                    ea.id, ea.student_id,
                    s.student_code, s.full_name, s.class_name,
                    ea.check_in_time,  ea.check_in_confidence,  ea.check_in_status,
                    ea.check_out_time, ea.check_out_confidence, ea.check_out_status,
                    ea.seat_row, ea.seat_col,
                    ea.status, ea.confidence_score
                FROM exam_attendance ea
                JOIN students s ON s.id = ea.student_id
                WHERE ea.exam_schedule_id = ?
                ORDER BY COALESCE(ea.check_out_time, ea.check_in_time) DESC
            `, [schedule_id]);
            return res.status(200).json({ success: true, data: rows });
        }

        const [rows] = await pool.query(`
            SELECT 
                ca.id, ca.student_id,
                s.student_code, s.full_name, s.class_name,
                ca.check_in_time,  ca.check_in_confidence,  ca.check_in_status,
                ca.check_out_time, ca.check_out_confidence, ca.check_out_status,
                ca.status, ca.confidence_score
            FROM class_attendance ca
            JOIN students s ON s.id = ca.student_id
            WHERE ca.schedule_id = ?
            ORDER BY COALESCE(ca.check_out_time, ca.check_in_time) DESC
        `, [schedule_id]);

        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Lỗi getAttendanceBySchedule:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.getAttendanceReport = async (req, res) => {
    try {
        const { date_from, date_to, course_id, schedule_id, type = 'class' } = req.query;

        if (type === 'exam') {
            let where = ['1=1'];
            let params = [];

            if (schedule_id) {
                where.push('ea.exam_schedule_id = ?');
                params.push(schedule_id);
            } else {
                if (date_from) { where.push('DATE(es.exam_time) >= ?'); params.push(date_from); }
                if (date_to)   { where.push('DATE(es.exam_time) <= ?'); params.push(date_to); }
                if (course_id) { where.push('es.course_id = ?');         params.push(course_id); }
            }

            const [rows] = await pool.query(`
                SELECT
                    ea.id,
                    s.student_code, s.full_name, s.class_name,
                    c.course_code,  c.course_name,
                    es.exam_room as room_name,
                    es.exam_time as start_time, es.end_time,
                    ea.check_in_time,  ea.check_in_confidence,  ea.check_in_status,
                    ea.check_out_time, ea.check_out_confidence, ea.check_out_status,
                    ea.seat_row, ea.seat_col,
                    ea.status,
                    ea.confidence_score
                FROM exam_attendance ea
                JOIN students      s  ON s.id               = ea.student_id
                JOIN exam_schedules es ON es.id             = ea.exam_schedule_id
                JOIN courses       c  ON c.id               = es.course_id
                WHERE ${where.join(' AND ')}
                ORDER BY es.exam_time DESC, s.student_code ASC
            `, params);

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
        }

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

// GET /attendance/sessions/recent?limit=10 — lấy danh sách buổi học gần đây có điểm danh
exports.getRecentSessions = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const type = req.query.type || req.query.session_type || 'class';

        if (type === 'exam') {
            const [rows] = await pool.query(`
                SELECT 
                    es.id as schedule_id,
                    es.exam_room as room_name,
                    es.exam_time as start_time,
                    es.end_time,
                    c.course_code,
                    c.course_name,
                    COUNT(DISTINCT ea.student_id) as total_attended,
                    SUM(CASE WHEN ea.check_in_time IS NOT NULL THEN 1 ELSE 0 END) as checked_in_count,
                    SUM(CASE WHEN ea.check_out_time IS NOT NULL THEN 1 ELSE 0 END) as checked_out_count,
                    SUM(CASE WHEN ea.status = 'Completed' THEN 1 ELSE 0 END) as completed_count
                FROM exam_schedules es
                JOIN courses c ON c.id = es.course_id
                LEFT JOIN exam_attendance ea ON ea.exam_schedule_id = es.id
                GROUP BY es.id, es.exam_room, es.exam_time, es.end_time, c.course_code, c.course_name
                ORDER BY es.exam_time DESC
                LIMIT ?
            `, [limit]);

            return res.status(200).json({ success: true, data: rows });
        }

        const [rows] = await pool.query(`
            SELECT 
                cs.id as schedule_id,
                cs.room_name,
                cs.start_time,
                cs.end_time,
                c.course_code,
                c.course_name,
                COUNT(DISTINCT ca.student_id) as total_attended,
                SUM(CASE WHEN ca.check_in_time IS NOT NULL THEN 1 ELSE 0 END) as checked_in_count,
                SUM(CASE WHEN ca.check_out_time IS NOT NULL THEN 1 ELSE 0 END) as checked_out_count,
                SUM(CASE WHEN ca.status = 'Completed' THEN 1 ELSE 0 END) as completed_count
            FROM class_schedules cs
            JOIN courses c ON c.id = cs.course_id
            LEFT JOIN class_attendance ca ON ca.schedule_id = cs.id
            GROUP BY cs.id, cs.room_name, cs.start_time, cs.end_time, c.course_code, c.course_name
            ORDER BY cs.start_time DESC
            LIMIT ?
        `, [limit]);

        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Lỗi getRecentSessions:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /attendance/export/:schedule_id — xuất Excel danh sách điểm danh
exports.exportAttendanceExcel = async (req, res) => {
    try {
        const { schedule_id } = req.params;
        let type = req.query.type || req.query.session_type;

        // Auto-detect if type is not explicitly provided
        if (!type) {
            const [checkExam] = await pool.query('SELECT id FROM exam_schedules WHERE id = ?', [schedule_id]);
            if (checkExam.length > 0) {
                type = 'exam';
            } else {
                type = 'class';
            }
        }

        if (type === 'exam') {
            const [examRows] = await pool.query(`
                SELECT es.*, c.course_code, c.course_name
                FROM exam_schedules es JOIN courses c ON c.id = es.course_id
                WHERE es.id = ?
            `, [schedule_id]);

            if (examRows.length === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy ca thi' });
            }
            const schedule = examRows[0];

            const [rows] = await pool.query(`
                SELECT 
                    s.student_code, s.full_name, s.class_name,
                    ea.seat_row, ea.seat_col,
                    ea.check_in_time, ea.check_out_time, ea.status, ea.confidence_score
                FROM students s
                LEFT JOIN exam_attendance ea ON s.id = ea.student_id AND ea.exam_schedule_id = ?
                ORDER BY COALESCE(ea.check_in_time, ea.check_out_time) DESC, s.student_code ASC
            `, [schedule_id]);

            if (!ExcelJS) {
                const csvHeaders = ['STT', 'Mã Sinh Viên', 'Họ và Tên', 'Lớp', 'Số ghế', 'Thời gian Check-in', 'Thời gian Check-out', 'Trạng thái'];
                const lines = [csvHeaders.join(',')];
                rows.forEach((r, i) => {
                    const statusLabel = r.status === 'Completed' ? 'Đã thi & Ra phòng'
                        : r.status === 'Checked-in' ? 'Đang dự thi'
                        : r.status === 'Only Checked-out' ? 'Chỉ check-out'
                        : 'Vắng';
                    const seatLabel = (r.seat_row !== null && r.seat_col !== null) ? `Hàng ${r.seat_row + 1} Ghế ${r.seat_col + 1}` : 'Tự do';
                    lines.push([
                        i + 1,
                        r.student_code,
                        `"${r.full_name}"`,
                        `"${r.class_name || ''}"`,
                        `"${seatLabel}"`,
                        r.check_in_time ? new Date(r.check_in_time).toLocaleString('vi-VN') : '—',
                        r.check_out_time ? new Date(r.check_out_time).toLocaleString('vi-VN') : '—',
                        `"${statusLabel}"`
                    ].join(','));
                });
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="diemdanh_thi_${schedule_id}.csv"`);
                return res.send('\uFEFF' + lines.join('\n'));
            }

            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'He thong Diem danh Khuon mat';
            workbook.created = new Date();

            const sheet = workbook.addWorksheet('Bao cao diem danh thi', {
                pageSetup: { paperSize: 9, orientation: 'landscape' }
            });

            const startTime = new Date(schedule.exam_time);
            const endTime = schedule.end_time ? new Date(schedule.end_time) : new Date(startTime.getTime() + 90 * 60000);
            const fmtDateTime = (d) => d ? new Date(d).toLocaleString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                day: '2-digit', month: '2-digit', year: 'numeric'
            }) : '—';
            const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
                hour: '2-digit', minute: '2-digit'
            }) : '';
            const dateStr = startTime.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

            // Title
            sheet.mergeCells('A1:H1');
            sheet.getCell('A1').value = 'BÁO CÁO ĐIỂM DANH THÍ SINH PHÒNG THI';
            sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF1E3A5F' } };
            sheet.getCell('A1').alignment = { horizontal: 'center' };
            sheet.getRow(1).height = 24;

            sheet.mergeCells('A2:H2');
            sheet.getCell('A2').value = `Mon thi: ${schedule.course_code} - ${schedule.course_name} | Phòng: ${schedule.exam_room} | Ngày: ${dateStr} | Giờ: ${fmtTime(startTime)} – ${fmtTime(endTime)}`;
            sheet.getCell('A2').font = { italic: true, size: 11, color: { argb: 'FF555555' } };
            sheet.getCell('A2').alignment = { horizontal: 'center' };
            sheet.getRow(2).height = 20;

            sheet.addRow([]);

            // Header
            const headerRow = sheet.addRow([
                'STT', 'Mã Sinh Viên', 'Họ và Tên', 'Lớp', 'Chỗ ngồi',
                'Thời gian Vào phòng', 'Thời gian Ra phòng', 'Trạng thái'
            ]);
            headerRow.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' }, bottom: { style: 'thin' },
                    left: { style: 'thin' }, right: { style: 'thin' }
                };
            });
            headerRow.height = 22;

            // Data rows
            rows.forEach((r, i) => {
                const statusLabel = r.status === 'Completed' ? 'Đã thi & Ra phòng'
                    : r.status === 'Checked-in' ? 'Đang dự thi'
                    : r.status === 'Only Checked-out' ? 'Chỉ check-out'
                    : 'Vắng';

                const statusColor = r.status === 'Completed' ? 'FFD1FAE5'
                    : r.status === 'Checked-in' ? 'FFFEF3C7'
                    : 'FFFEE2E2';

                const seatLabel = (r.seat_row !== null && r.seat_col !== null) ? `Hàng ${r.seat_row + 1} - Ghế ${r.seat_col + 1}` : 'Tự do';

                const dataRow = sheet.addRow([
                    i + 1,
                    r.student_code,
                    r.full_name,
                    r.class_name || '—',
                    seatLabel,
                    r.check_in_time ? fmtDateTime(r.check_in_time) : '—',
                    r.check_out_time ? fmtDateTime(r.check_out_time) : '—',
                    statusLabel
                ]);

                dataRow.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusColor } };
                if (i % 2 === 1) {
                    for (let c = 1; c <= 7; c++) {
                        dataRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                    }
                }
                dataRow.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                    };
                    cell.alignment = { vertical: 'middle' };
                });
                dataRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
                dataRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
                dataRow.height = 20;
            });

            // Column widths
            sheet.getColumn(1).width = 6;
            sheet.getColumn(2).width = 16;
            sheet.getColumn(3).width = 28;
            sheet.getColumn(4).width = 14;
            sheet.getColumn(5).width = 18;
            sheet.getColumn(6).width = 24;
            sheet.getColumn(7).width = 24;
            sheet.getColumn(8).width = 22;

            // Summary footer
            const total = rows.length;
            const ci = rows.filter(r => r.check_in_time).length;
            const co = rows.filter(r => r.check_out_time).length;
            const comp = rows.filter(r => r.status === 'Completed').length;
            sheet.addRow([]);
            const sumRow = sheet.addRow([`Tổng thí sinh: ${total} SV | Check-in vào phòng: ${ci} | Check-out ra phòng: ${co} | Hoàn thành ca thi: ${comp}`]);
            sheet.mergeCells(`A${sumRow.number}:H${sumRow.number}`);
            sumRow.getCell(1).font = { bold: true, italic: true, color: { argb: 'FF4338CA' } };

            const safeCourseName = (schedule.course_code || 'export').replace(/[^a-zA-Z0-9]/g, '_');
            const safeDateStr = dateStr.replace(/\//g, '-');
            const filename = `diemdanh_thi_${safeCourseName}_${safeDateStr}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            await workbook.xlsx.write(res);
            return res.end();
        }

        const [scheduleRows] = await pool.query(`
            SELECT cs.*, c.course_code, c.course_name
            FROM class_schedules cs JOIN courses c ON c.id = cs.course_id
            WHERE cs.id = ?
        `, [schedule_id]);

        if (scheduleRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy buổi học' });
        }
        const schedule = scheduleRows[0];

        const [rows] = await pool.query(`
            SELECT 
                s.student_code, s.full_name, s.class_name,
                ca.check_in_time, ca.check_out_time, ca.status, ca.confidence_score
            FROM students s
            LEFT JOIN class_attendance ca ON s.id = ca.student_id AND ca.schedule_id = ?
            ORDER BY COALESCE(ca.check_in_time, ca.check_out_time) DESC, s.student_code ASC
        `, [schedule_id]);

        if (!ExcelJS) {
            const csvHeaders = ['STT', 'Mã Sinh Viên', 'Họ và Tên', 'Lớp', 'Thời gian Check-in', 'Thời gian Check-out', 'Trạng thái'];
            const lines = [csvHeaders.join(',')];
            rows.forEach((r, i) => {
                const statusLabel = r.status === 'Completed' ? 'Đủ đầu & cuối giờ'
                    : r.status === 'Checked-in' ? 'Chỉ check-in'
                    : r.status === 'Only Checked-out' ? 'Chỉ check-out'
                    : 'Vắng';
                lines.push([
                    i + 1,
                    r.student_code,
                    `"${r.full_name}"`,
                    `"${r.class_name || ''}"`,
                    r.check_in_time ? new Date(r.check_in_time).toLocaleString('vi-VN') : '—',
                    r.check_out_time ? new Date(r.check_out_time).toLocaleString('vi-VN') : '—',
                    `"${statusLabel}"`
                ].join(','));
            });
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="diemdanh_${schedule_id}.csv"`);
            return res.send('\uFEFF' + lines.join('\n'));
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'He thong Diem danh Khuon mat';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Danh sach diem danh', {
            pageSetup: { paperSize: 9, orientation: 'landscape' }
        });

        const startTime = new Date(schedule.start_time);
        const endTime = new Date(schedule.end_time);
        const fmtDateTime = (d) => d ? new Date(d).toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric'
        }) : '—';
        const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour: '2-digit', minute: '2-digit'
        }) : '';
        const dateStr = startTime.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

        // Title
        sheet.mergeCells('A1:G1');
        sheet.getCell('A1').value = 'DANH SÁCH ĐIỂM DANH SINH VIÊN';
        sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF1E3A5F' } };
        sheet.getCell('A1').alignment = { horizontal: 'center' };
        sheet.getRow(1).height = 24;

        sheet.mergeCells('A2:G2');
        sheet.getCell('A2').value = `${schedule.course_code} - ${schedule.course_name} | Phòng: ${schedule.room_name} | Ngày: ${dateStr} | Giờ: ${fmtTime(startTime)} – ${fmtTime(endTime)}`;
        sheet.getCell('A2').font = { italic: true, size: 11, color: { argb: 'FF555555' } };
        sheet.getCell('A2').alignment = { horizontal: 'center' };
        sheet.getRow(2).height = 20;

        sheet.addRow([]);

        // Header
        const headerRow = sheet.addRow([
            'STT', 'Mã Sinh Viên', 'Họ và Tên', 'Lớp',
            'Thời gian Check-in', 'Thời gian Check-out', 'Trạng thái'
        ]);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' }, bottom: { style: 'thin' },
                left: { style: 'thin' }, right: { style: 'thin' }
            };
        });
        headerRow.height = 22;

        // Data rows
        rows.forEach((r, i) => {
            const statusLabel = r.status === 'Completed' ? 'Đủ đầu & cuối giờ'
                : r.status === 'Checked-in' ? 'Chỉ check-in'
                : r.status === 'Only Checked-out' ? 'Chỉ check-out'
                : 'Vắng';

            const statusColor = r.status === 'Completed' ? 'FFD1FAE5'
                : r.status === 'Checked-in' ? 'FFFEF3C7'
                : 'FFFEE2E2';

            const dataRow = sheet.addRow([
                i + 1,
                r.student_code,
                r.full_name,
                r.class_name || '—',
                r.check_in_time ? fmtDateTime(r.check_in_time) : '—',
                r.check_out_time ? fmtDateTime(r.check_out_time) : '—',
                statusLabel
            ]);

            dataRow.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusColor } };
            if (i % 2 === 1) {
                for (let c = 1; c <= 6; c++) {
                    dataRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                }
            }
            dataRow.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                };
                cell.alignment = { vertical: 'middle' };
            });
            dataRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
            dataRow.height = 20;
        });

        // Column widths
        sheet.getColumn(1).width = 6;
        sheet.getColumn(2).width = 16;
        sheet.getColumn(3).width = 28;
        sheet.getColumn(4).width = 14;
        sheet.getColumn(5).width = 24;
        sheet.getColumn(6).width = 24;
        sheet.getColumn(7).width = 22;

        // Summary footer
        const total = rows.length;
        const ci = rows.filter(r => r.check_in_time).length;
        const co = rows.filter(r => r.check_out_time).length;
        const comp = rows.filter(r => r.status === 'Completed').length;
        sheet.addRow([]);
        const sumRow = sheet.addRow([`Tổng: ${total} SV | Check-in: ${ci} | Check-out: ${co} | Hoàn thành (đủ 2 lượt): ${comp}`]);
        sheet.mergeCells(`A${sumRow.number}:G${sumRow.number}`);
        sumRow.getCell(1).font = { bold: true, italic: true, color: { argb: 'FF4F46E5' } };

        const safeCourseName = (schedule.course_code || 'export').replace(/[^a-zA-Z0-9]/g, '_');
        const safeDateStr = dateStr.replace(/\//g, '-');
        const filename = `diemdanh_${safeCourseName}_${safeDateStr}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Lỗi exportAttendanceExcel:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi xuất Excel' });
    }
};
