const pool = require('../config/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ── Key rotation ──────────────────────────────────────────────
const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
const API_KEYS = rawKeys.split(',').map(k => k.trim()).filter(Boolean);
let currentKeyIndex = 0;
function getNextKey() {
    if (!API_KEYS.length) return null;
    const key = API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    return key;
}

const CANDIDATE_MODELS = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-2.0-flash-exp', 'gemini-1.5-pro'];

const SYSTEM_PROMPT = `Ban la Tro ly AI Huong dan vien cua he thong diem danh khuon mat dai hoc.
QUY TAC BAO MAT & QUYEN HAN (RAT QUAN TRONG):
1. Ban CHI la Tro ly tu van/huong dan (Read-only Info Assistant). Ban KHONG CO QUYEN thuc hien thao tac CSDL nhu: tao sinh vien, sua thong tin, xoa du lieu, hoac nang quyen/cap quyen Admin.
2. Neu nguoi dung bao ban "tao sinh vien", "nang quyen admin", "doi mat khau", hay tu chối va giai thich ro: Chatbox la tro ly huong dan, khong co quyen thay doi CSDL hay quyen han.
3. PHAN QUYEN HE THONG:
   - Admin: Co quyen Quan ly Nguoi dung, Them/Sua/Xoa Sinh vien, Mon hoc, Lich hoc, Lich thi, Bao cao.
   - Giang vien: Chi co quyen Xem lich day, Diem danh sinh vien lop minh, Xem bao cao. Giang vien KHONG THETU TAO sinh vien moi.`;

// Helper to extract relative date offset from Vietnamese natural text
function extractDateOffset(q) {
    // Check "X ngày/hôm nữa" (e.g., "2 hôm nữa", "5 ngày nữa")
    const matchNum = q.match(/(\d+)\s*(hôm|ngày)\s*nữa/);
    if (matchNum) {
        const days = parseInt(matchNum[1], 10);
        return { offset: days, label: `${days} ngày nữa` };
    }

    if (q.includes('hai hôm nữa') || q.includes('hai ngày nữa') || q.includes('mốt') || q.includes('ngày kia') || q.includes('ngay kia')) {
        return { offset: 2, label: '2 ngày nữa' };
    }
    if (q.includes('ba hôm nữa') || q.includes('ba ngày nữa')) {
        return { offset: 3, label: '3 ngày nữa' };
    }
    if (q.includes('bốn hôm nữa') || q.includes('bốn ngày nữa')) {
        return { offset: 4, label: '4 ngày nữa' };
    }
    if (q.includes('ngày mai') || q.includes('ngay mai') || q.includes('sáng mai') || q.includes('chiều mai')) {
        return { offset: 1, label: 'ngày mai' };
    }
    if (q.includes('hôm qua') || q.includes('hom qua')) {
        return { offset: -1, label: 'hôm qua' };
    }
    if (q.includes('tuần này') || q.includes('tuan nay')) {
        return { offset: null, isWeek: true, label: 'tuần này' };
    }
    if (q.includes('hôm nay') || q.includes('hom nay') || q.includes('bây giờ') || q.includes('bay gio')) {
        return { offset: 0, label: 'hôm nay' };
    }

    return null;
}

// ── On-Demand Targeted Database Context Provider (Token-Optimized RAG) ──
async function getOnDemandDbContext(query) {
    if (!query) return { contextString: '', dynamicAnswer: null };
    const q = query.toLowerCase().trim();

    // 1. Live Exam Schedules Query ("lịch thi", "phòng thi", "khi nào thi", "thi môn")
    if (q.includes('lịch thi') || q.includes('lich thi') || q.includes('phòng thi') || q.includes('phong thi') || q.includes('thi môn')) {
        try {
            const [rows] = await pool.query(`
                SELECT es.exam_room, DATE_FORMAT(es.exam_time, '%d/%m/%Y %H:%i') as exam_dt,
                       c.course_code, c.course_name
                FROM exam_schedules es
                JOIN courses c ON es.course_id = c.id
                WHERE es.exam_time >= NOW()
                ORDER BY es.exam_time ASC
                LIMIT 5
            `);

            if (rows.length === 0) {
                const answer = '📝 Dạ hiện tại không có lịch thi nào được xếp trong thời gian tới.';
                return { contextString: 'DULIEU_CSDL: Khong co lich thi.', dynamicAnswer: answer };
            }

            const items = rows.map((r, idx) => `• Môn **${r.course_name} (${r.course_code})** | Giờ thi: ${r.exam_dt} | Phòng thi: **${r.exam_room}**`);
            const answer = `📝 **Lịch thi sắp tới trong hệ thống:**\n\n` + items.join('\n');
            return { contextString: `DULIEU_LICH_THI: ${items.join('; ')}`, dynamicAnswer: answer };
        } catch (err) {
            console.error('Lỗi RAG query exams:', err.message);
        }
    }

    // 2. Student Count Query ("bao nhiêu sinh viên", "tổng sinh viên", "số sinh viên")
    if (q.includes('bao nhiêu sinh viên') || q.includes('tong sinh vien') || q.includes('tổng sinh viên') || q.includes('số sinh viên')) {
        try {
            const [rows] = await pool.query('SELECT COUNT(*) as total FROM students');
            const total = rows[0]?.total || 0;
            const answer = `🎓 Hiện tại hệ thống đang quản lý tổng cộng **${total} sinh viên**.`;
            return { contextString: `DULIEU_TONG_SV: ${total} sinh vien.`, dynamicAnswer: answer };
        } catch (err) {
            console.error('Lỗi RAG query students:', err.message);
        }
    }

    // 2b. Attendance Log Query ("ai điểm danh", "ai đi muộn", "báo cáo điểm danh", "danh sách điểm danh")
    // NOTE: Only trigger database report if user is asking for a list/report, NOT asking for help/troubleshooting!
    const isHelpOrTroubleshooting = q.includes('làm sao') || q.includes('lam sao') || q.includes('cứu tôi') || q.includes('cuu toi') || q.includes('giúp tôi') || q.includes('giup toi') || q.includes('thế nào') || q.includes('the nao') || q.includes('phải làm gì') || q.includes('không điểm danh được') || q.includes('khong diem danh duoc') || q.includes('đi muộn rồi') || q.includes('di muon roi');

    const isAttendanceReportQuery = !isHelpOrTroubleshooting && (
        q.includes('ai điểm danh') || q.includes('ai diem danh') ||
        q.includes('ai đi muộn') || q.includes('ai di muon') ||
        q.includes('danh sách điểm danh') || q.includes('báo cáo điểm danh') ||
        q.includes('có ai đi muộn') || q.includes('co ai di muon') ||
        (q.includes('điểm danh') && q.includes('hôm nay') && !q.includes('tôi'))
    );

    if (isAttendanceReportQuery) {
        try {
            const [rows] = await pool.query(`
                SELECT ca.check_in_time, ca.check_in_status, ca.status,
                       s.student_code, s.full_name,
                       cs.room_name, c.course_name
                FROM class_attendance ca
                JOIN students s ON ca.student_id = s.id
                JOIN class_schedules cs ON ca.schedule_id = cs.id
                JOIN courses c ON cs.course_id = c.id
                ORDER BY ca.check_in_time DESC
                LIMIT 10
            `);

            if (rows.length === 0) {
                const answer = '📋 Dạ hiện tại chưa có sinh viên nào thực hiện điểm danh khuôn mặt trên hệ thống.';
                return { contextString: 'DULIEU_DIEM_DANH: Chưa có lượt điểm danh.', dynamicAnswer: answer };
            }

            const lateCount = rows.filter(r => (r.check_in_status || r.status || '').toLowerCase().includes('late') || (r.check_in_status || r.status || '').toLowerCase().includes('muộn')).length;
            const items = rows.map((r, idx) => {
                const timeStr = r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
                const isLate = (r.check_in_status || r.status || '').toLowerCase().includes('late') || (r.check_in_status || r.status || '').toLowerCase().includes('muộn');
                const statusLabel = isLate ? '⚠️ Đi muộn' : '✅ Đúng giờ';
                return `${idx + 1}. **${r.full_name} (${r.student_code})** - ${timeStr} | ${statusLabel} (Môn ${r.course_name})`;
            });

            const answer = `📋 **Báo cáo danh sách điểm danh gần nhất (${rows.length} lượt):**\n\n` + items.join('\n') + `\n\n📊 *Tổng lượt có mặt: ${rows.length} | Đi muộn: ${lateCount}*`;
            return { contextString: `DULIEU_DIEM_DANH: ${items.join('; ')}`, dynamicAnswer: answer };
        } catch (err) {
            console.error('Lỗi RAG query attendance:', err.message);
        }
    }

    // 3. Live Class Schedules Query ("lớp", "lịch", "tiết", "hoạt động", "hôm nay", "ngày mai", "hôm qua", "tuần", "nữa", "phòng")
    const dateMeta = extractDateOffset(q);
    const isScheduleQuery = dateMeta || q.includes('lớp') || q.includes('lop') || q.includes('lịch') || q.includes('lich') || q.includes('tiết') || q.includes('tiet') || q.includes('ca học') || q.includes('ca hoc') || q.includes('phòng') || q.includes('phong');

    if (isScheduleQuery) {
        try {
            let dateCondition = 'DATE(cs.start_time) = CURDATE() OR (NOW() BETWEEN cs.start_time AND cs.end_time)';
            let label = dateMeta ? dateMeta.label : 'hôm nay';

            if (dateMeta && dateMeta.isWeek) {
                dateCondition = 'YEARWEEK(cs.start_time, 1) = YEARWEEK(CURDATE(), 1)';
            } else if (dateMeta && dateMeta.offset !== null) {
                if (dateMeta.offset >= 0) {
                    dateCondition = `DATE(cs.start_time) = DATE_ADD(CURDATE(), INTERVAL ${dateMeta.offset} DAY)`;
                } else {
                    dateCondition = `DATE(cs.start_time) = DATE_SUB(CURDATE(), INTERVAL ${Math.abs(dateMeta.offset)} DAY)`;
                }
            }

            const [rows] = await pool.query(`
                SELECT cs.id, cs.room_name, cs.teacher_name,
                       DATE_FORMAT(cs.start_time, '%H:%i') as start_hm,
                       DATE_FORMAT(cs.end_time, '%H:%i') as end_hm,
                       DATE_FORMAT(cs.start_time, '%d/%m/%Y') as date_str,
                       c.course_code, c.course_name
                FROM class_schedules cs
                JOIN courses c ON cs.course_id = c.id
                WHERE ${dateCondition}
                ORDER BY cs.start_time ASC
                LIMIT 5
            `);

            // Also query calculated target date string for direct natural response
            const [dateRows] = await pool.query(
                dateMeta && dateMeta.offset !== null
                    ? `SELECT DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL ? DAY), '%d/%m/%Y') as target_date`
                    : `SELECT DATE_FORMAT(CURDATE(), '%d/%m/%Y') as target_date`,
                [dateMeta ? dateMeta.offset || 0 : 0]
            );
            const targetDateStr = dateRows[0]?.target_date || '';

            if (rows.length === 0) {
                // Natural answer directly responding to user's question
                let answer = `Dạ vào ${label} (${targetDateStr}), hệ thống hiện **chưa có tiết học nào** được xếp lịch.`;

                // Add nearest upcoming class as helpful context
                const [allRows] = await pool.query(`
                    SELECT cs.id, cs.room_name, cs.teacher_name,
                           DATE_FORMAT(cs.start_time, '%H:%i') as start_hm,
                           DATE_FORMAT(cs.end_time, '%H:%i') as end_hm,
                           DATE_FORMAT(cs.start_time, '%d/%m/%Y') as date_str,
                           c.course_code, c.course_name
                    FROM class_schedules cs
                    JOIN courses c ON cs.course_id = c.id
                    ORDER BY cs.start_time ASC
                    LIMIT 3
                `);

                if (allRows.length > 0) {
                    answer += `\n\n📌 **Lịch học gần nhất trong CSDL:**\n` +
                        allRows.map(r => `• Môn **${r.course_name} (${r.course_code})** - Ngày ${r.date_str} (${r.start_hm} - ${r.end_hm} tại **${r.room_name}**) - GV: ${r.teacher_name || 'Chưa phân công'}`).join('\n');
                }

                return { contextString: `DULIEU_CSDL: Không có tiết học ngày ${label} (${targetDateStr}).`, dynamicAnswer: answer };
            }

            // Natural answer directly answering "Có tiết nào không? Ở lớp nào?"
            const items = rows.map((r, idx) => `${idx + 1}. Môn **${r.course_name} (${r.course_code})**\n   • Thời gian: ${r.start_hm} - ${r.end_hm}\n   • Phòng / Lớp: **${r.room_name || 'Phòng Lab'}**\n   • Giảng viên: ${r.teacher_name || 'Chưa phân công'}`);
            
            const answer = `Dạ vào **${label} (${rows[0].date_str})**, hệ thống có **${rows.length} tiết học**:\n\n` + items.join('\n\n') + '\n\n👉 Bạn có thể bấm nút "Mở Camera Điểm Danh Ngay" trên màn hình để điểm danh AI.';
            return { contextString: `DULIEU_CSDL: ${rows.map(r => `${r.course_code} - ${r.course_name} tại ${r.room_name}`).join('; ')}`, dynamicAnswer: answer };
        } catch (err) {
            console.error('Lỗi RAG query schedules:', err.message);
        }
    }

    return { contextString: '', dynamicAnswer: null };
}

// General static system guidance for security, role rules, & FAQs (Situation & Workflow Engine)
function getLocalStaticAnswer(query) {
    if (!query) return null;
    const q = query.toLowerCase().trim();

    // Greetings
    if (q === 'xin chào' || q === 'chào' || q === 'hi' || q === 'hello' || q === 'chao bạn' || q === 'chào bạn') {
        return '👋 **Xin chào! Tôi là Trợ lý AI Hệ thống Điểm danh Khuôn mặt.**\n\nBạn có thể hỏi tôi về:\n1. 📅 Lịch học hôm nay, ngày mai, hoặc tuần này.\n2. 📝 Lịch thi & phòng thi.\n3. 🎓 Thống kê tổng số sinh viên trong hệ thống.\n4. ⏰ Quy trình xử lý tình huống (quá giờ điểm danh, sinh viên trễ, mất mạng, lỗi scan).\n5. 📷 Hướng dẫn mở camera điểm danh & phân quyền Giảng viên / Admin.\n\nTôi có thể giúp gì cho bạn hôm nay?';
    }

    // Action requests to execute/create/elevate (Action Denial & Security Clarification)
    if (q.includes('tạo') || q.includes('tao') || q.includes('thêm giúp') || q.includes('them giup') || q.includes('nâng') || q.includes('nang admin') || q.includes('cấp quyền')) {
        if (q.includes('admin') || q.includes('quyền') || q.includes('quyen')) {
            return '⛔ **Từ chối thao tác:** Chatbox là trợ lý hướng dẫn thông tin (Read-only) và **KHÔNG CÓ QUYỀN** truy cập hay thay đổi quyền hạn người dùng. Việc phân quyền chỉ do Quản trị viên (Admin) thực hiện trong hệ thống.';
        }
        return '⛔ **Từ chối thao tác:** Chatbox là trợ lý tư vấn hướng dẫn và **KHÔNG CÓ QUYỀN** tự động tạo hoặc sửa dữ liệu trong CSDL.\n\n• Chức năng thêm sinh viên mới thuộc quyền hạn của tài khoản **Admin** tại mục "Quản lý Sinh viên".\n• Tài khoản **Giảng viên** không thể tự tạo sinh viên mới mà chỉ xem và điểm danh danh sách sinh viên lớp mình.';
    }

    // ── SITUATIONAL WORKFLOW HANDLERS (XỬ LÝ TÌNH HUỐNG THỰC TẾ) ──

    // Situation 1: Late check-in / Expired check-in window / Manual attendance override / Student asking for help when late
    if (q.includes('tôi đi muộn') || q.includes('đi muộn rồi') || q.includes('đi muộn nên') || q.includes('không điểm danh được') || q.includes('cứu tôi') || q.includes('quá giờ') || q.includes('qua gio') || q.includes('trễ giờ') || q.includes('quên điểm danh') || q.includes('điểm danh bù') || (q.includes('muộn') && (q.includes('làm sao') || q.includes('thế nào') || q.includes('giúp') || q.includes('xử lý')))) {
        return '⏰ **Đừng lo lắng! Quy trình xử lý khi bạn ĐI MUỘN hoặc hệ thống QUÁ GIỜ điểm danh tự động:**\n\n' +
               '1. **Báo ngay cho Giảng viên đứng lớp:**\n' +
               '   • Giảng viên có toàn quyền điểm danh bổ sung trực tiếp trên hệ thống Web.\n\n' +
               '2. **Giảng viên điều chỉnh thủ công (Manual Attendance):**\n' +
               '   • Giảng viên mở Dashboard ca học ➔ Chọn tên bạn trên danh sách lớp.\n' +
               '   • Đổi trạng thái từ *Vắng* sang **"Đi muộn"** hoặc **"Có mặt"** kèm ghi chú lý do (Ví dụ: *"Đến muộn 10 phút"*).\n\n' +
               '3. **Lưu chốt số liệu:**\n' +
               '   • Sau khi Giảng viên bấm **Lưu điểm danh**, nhật ký cá nhân của bạn sẽ được tự động cập nhật đúng giờ.';
    }

    // Situation 2: Unregistered face / Face recognition failed
    if (q.includes('chưa đăng ký') || q.includes('chua dang ky') || q.includes('không nhận diện') || q.includes('khong nhan dien') || q.includes('mặt lạ') || q.includes('chưa có mẫu')) {
        return '👤 **Quy trình xử lý khi AI KHÔNG nhận diện được mặt hoặc chưa đăng ký mẫu:**\n\n' +
               '1. **Xác minh sinh viên:** Giảng viên kiểm tra MSSV/Thẻ sinh viên xem có trong danh sách Lớp/Môn không.\n' +
               '2. **Tích chọn thủ công:** Nếu đúng sinh viên, Giảng viên chọn trạng thái **"Có mặt"** thủ công trên giao diện ca học.\n' +
               '3. **Đăng ký bổ sung:** Hướng dẫn sinh viên vào mục **"Đăng ký khuôn mặt"** chụp lại 5 ảnh mẫu chuẩn để hệ thống học dữ liệu AI cho các ca sau.';
    }

    // Situation 3: Hardware / Network failure
    if (q.includes('mất mạng') || q.includes('mat mang') || q.includes('hỏng camera') || q.includes('hong camera') || q.includes('camera bị đen') || q.includes('mất điện')) {
        return '🔌 **Quy trình xử lý khi gặp Sự cố Thiết bị / Mất mạng:**\n\n' +
               '1. **Sử dụng Điểm danh thủ công:** Giảng viên chuyển sang danh sách tick chọn thủ công trên hệ thống Web.\n' +
               '2. **Cập nhật bù trong 24h:** Sau khi có mạng/thiết bị hoạt động trở lại, Giảng viên có thể mở lại ca học để cập nhật bù trạng thái điểm danh.';
    }

    // Situation 4: Exam eligibility / Absences threshold
    if (q.includes('cấm thi') || q.includes('cam thi') || q.includes('đủ điều kiện') || q.includes('du dieu kien') || q.includes('nghỉ quá') || q.includes('vắng quá')) {
        return '📋 **Quy định về Điều kiện dự thi & Nghỉ quá số buổi:**\n\n' +
               '• Hệ thống tự động tính tỷ lệ vắng mặt dựa trên nhật ký điểm danh.\n' +
               '• Nếu sinh viên **vắng quá 20% tổng số tiết** (hoặc quá số buổi quy định), hệ thống sẽ tự động xếp sinh viên vào danh sách **Cấm thi**.\n' +
               '• Admin & Giảng viên xem danh sách chi tiết tại mục **"Điều kiện dự thi"**.';
    }

    // Role queries about Teacher vs Admin
    if (q.includes('giảng viên') || q.includes('giang vien') || q.includes('giảng viên làm được gì') || q.includes('quyền giảng viên')) {
        return '👨‍🏫 **Phân quyền tài khoản Giảng viên:**\n' +
               '• **Được phép:** Xem lịch dạy, điểm danh khuôn mặt bằng camera AI cho ca học, xem danh sách sinh viên lớp mình, xem báo cáo điểm danh, điều chỉnh điểm danh thủ công.\n' +
               '• **Không được phép:** Tạo tài khoản sinh viên mới, sửa thông tin CSDL hệ thống, thay đổi phân quyền Admin.';
    }

    // How to start face attendance / camera ("mở camera", "điểm danh", "kích hoạt")
    if ((q.includes('cách') || q.includes('hướng dẫn') || q.includes('bắt đầu') || q.includes('mở')) && (q.includes('camera') || q.includes('điểm danh'))) {
        return '📷 **Cách kích hoạt điểm danh khuôn mặt:**\n' +
               '1. Tại màn hình Dashboard Giảng viên, chọn ca học muốn điểm danh.\n' +
               '2. Nút **"Mở Camera Điểm Danh Ngay"** màu xanh dương sẽ nổi bật trên cùng.\n' +
               '3. Bấm vào nút này để hệ thống bật webcam và bắt đầu nhận diện sinh viên tự động.';
    }

    // How to add students (Instructional FAQ)
    if (q.includes('cách thêm') || q.includes('cach them') || q.includes('hướng dẫn thêm') || q.includes('huong dan them') || q.includes('thêm sinh viên')) {
        return '📝 **Cách thêm sinh viên mới (Dành cho tài khoản Admin):**\n' +
               '1. Đăng nhập tài khoản Admin.\n' +
               '2. Vào mục **"Sinh viên"** trên menu quản trị.\n' +
               '3. Bấm **"Thêm sinh viên mới"**, chọn Khoa, chọn Lớp và nhập MSSV, Họ tên, Email.\n' +
               '4. Lưu ý: MSSV và Email không được trùng lặp.';
    }

    // Face scanning failure & troubleshooting
    if (q.includes('scan') || q.includes('không nhận') || q.includes('nhận diện') || q.includes('lỗi scan')) {
        return '💡 **Hướng dẫn xử lý khi không scan được khuôn mặt:**\n' +
               '1. Đảm bảo khu vực đứng có đủ ánh sáng (tránh tối quá hoặc ngược sáng).\n' +
               '2. Sinh viên nhìn thẳng vào camera, khoảng cách từ 40cm đến 60cm.\n' +
               '3. Đảm bảo trình duyệt đã được cho phép truy cập Camera (biểu tượng khóa bên trái thanh địa chỉ).\n' +
               '4. Kiểm tra tài khoản sinh viên đã chụp đủ 5 ảnh mẫu khuôn mặt chuẩn trong mục Đăng ký khuôn mặt chưa.';
    }

    // Rate limiting & server error
    if (q.includes('request') || q.includes('quá nhiều') || q.includes('qua nhieu') || q.includes('thử lại') || q.includes('lỗi')) {
        return '⚠️ **Thông báo sự cố hệ thống:**\n' +
               '• Nếu gặp lỗi "Quá nhiều request": Hệ thống tạm thời giới hạn tần suất gửi yêu cầu để bảo mật. Bạn vui lòng chờ khoảng 15 phút rồi thử lại.\n' +
               '• Nếu camera bị đen: Hãy kiểm tra thiết bị webcam và cấp lại quyền truy cập camera trên trình duyệt.';
    }

    // Face registration
    if (q.includes('đăng ký') || q.includes('dang ky') || q.includes('chụp ảnh') || q.includes('chup anh')) {
        return '📸 **Hướng dẫn Đăng ký khuôn mặt:**\n' +
               '1. Đăng nhập tài khoản Admin/Sinh viên, chọn mục **"Đăng ký khuôn mặt"**.\n' +
               '2. Giữ khuôn mặt giữa khung hình camera tròn.\n' +
               '3. Lần lượt nghiêng nhẹ sang trái, phải, ngước lên, cúi xuống để chụp đủ 5 bức ảnh chất lượng tốt nhất.';
    }

    return '🤖 **Trợ lý AI hệ thống điểm danh luôn sẵn sàng giải đáp các thắc mắc:**\n' +
           '• ⏰ **Xử lý tình huống**: Quá giờ điểm danh, sinh viên đi muộn, lỗi camera/scan mặt, mất mạng.\n' +
           '• 📅 **Lịch học & Ca giảng dạy**: Tra cứu hôm nay, ngày mai, 2 hôm nữa, tuần này.\n' +
           '• 📋 **Nhật ký điểm danh**: Ai đã điểm danh, ai đi muộn.\n' +
           '• 📝 **Lịch thi & Phòng thi**: Môn thi và phòng thi sắp tới.\n' +
           '• 🔐 **Phân quyền & Hướng dẫn**: Quy định Admin/Giảng viên và cách mở camera.\n\nBạn cần hỗ trợ tình huống hoặc thông tin nào cụ thể?';
}

const _modelCache = {};
function getModel(key, modelName, systemInstruction) {
    const cacheKey = `${key}_${modelName}`;
    if (!_modelCache[cacheKey]) {
        const genAI = new GoogleGenerativeAI(key);
        _modelCache[cacheKey] = genAI.getGenerativeModel({ model: modelName, systemInstruction: systemInstruction || SYSTEM_PROMPT });
    }
    return _modelCache[cacheKey];
}

// ── GROQ API ROTATION & HYBRID LLM PROVIDER ───────────────────
const rawGroqKeys = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '';
const GROQ_API_KEYS = rawGroqKeys.split(',').map(k => k.trim()).filter(Boolean);
let currentGroqIndex = 0;
function getNextGroqKey() {
    if (!GROQ_API_KEYS.length) return null;
    const key = GROQ_API_KEYS[currentGroqIndex];
    currentGroqIndex = (currentGroqIndex + 1) % GROQ_API_KEYS.length;
    return key;
}

const GROQ_MODELS = ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'llama3-8b-8192'];

// Helper to call Groq API (Non-streaming)
async function callGroq(messages, systemInstruction) {
    if (!GROQ_API_KEYS.length) return null;
    const apiKey = getNextGroqKey();
    if (!apiKey) return null;

    const formattedMsgs = [
        { role: 'system', content: systemInstruction },
        ...messages.slice(-6).map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
        }))
    ];

    for (const model of GROQ_MODELS) {
        try {
            const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model,
                    messages: formattedMsgs,
                    temperature: 0.3,
                    max_tokens: 400
                })
            });

            if (!resp.ok) {
                const errText = await resp.text();
                console.error(`Groq API (${model}) failed HTTP ${resp.status}:`, errText);
                continue;
            }

            const data = await resp.json();
            const resultText = data?.choices?.[0]?.message?.content;
            if (resultText && resultText.trim()) {
                console.log(`[HYBRID AI] Successfully responded via Groq (${model})`);
                return resultText.trim();
            }
        } catch (err) {
            console.error(`Groq model ${model} error:`, err.message);
        }
    }
    return null;
}

// Helper to call Groq API (Streaming)
async function callGroqStream(messages, systemInstruction, onChunk) {
    if (!GROQ_API_KEYS.length) return null;
    const apiKey = getNextGroqKey();
    if (!apiKey) return null;

    const formattedMsgs = [
        { role: 'system', content: systemInstruction },
        ...messages.slice(-6).map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
        }))
    ];

    for (const model of GROQ_MODELS) {
        try {
            const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model,
                    messages: formattedMsgs,
                    temperature: 0.3,
                    max_tokens: 400,
                    stream: true
                })
            });

            if (!resp.ok) {
                const errText = await resp.text();
                console.error(`Groq Stream (${model}) failed HTTP ${resp.status}:`, errText);
                continue;
            }

            const reader = resp.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data: ')) continue;
                    const jsonStr = trimmed.slice(6);
                    if (jsonStr === '[DONE]') break;
                    try {
                        const parsed = JSON.parse(jsonStr);
                        const chunk = parsed?.choices?.[0]?.delta?.content;
                        if (chunk) {
                            fullText += chunk;
                            onChunk(chunk);
                        }
                    } catch (_) {}
                }
            }

            if (fullText.trim()) {
                console.log(`[HYBRID AI] Successfully streamed via Groq (${model})`);
                return fullText.trim();
            }
        } catch (err) {
            console.error(`Groq Stream model ${model} error:`, err.message);
        }
    }
    return null;
}

// ── Build Gemini-compatible history ──────────────────────────
function buildHistory(messages) {
    const trimmed = messages.slice(-6);
    const firstUser = trimmed.findIndex(m => m.role === 'user');
    const relevant  = firstUser >= 0 ? trimmed.slice(firstUser) : trimmed;
    const histMsgs  = relevant.slice(0, -1);
    const lastMsg   = relevant[relevant.length - 1];

    const history = [];
    for (const m of histMsgs) {
        const role = m.role === 'assistant' ? 'model' : 'user';
        if (!history.length) {
            if (role === 'user') history.push({ role, parts: [{ text: m.content }] });
        } else if (role !== history[history.length - 1].role) {
            history.push({ role, parts: [{ text: m.content }] });
        }
    }
    return { history, lastMsg };
}

// ── Non-streaming Hybrid AI Engine ───────────────────────────
async function chat(messages) {
    const { history, lastMsg } = buildHistory(messages);
    const { contextString, dynamicAnswer } = await getOnDemandDbContext(lastMsg?.content);

    const fullInstruction = contextString 
        ? `${SYSTEM_PROMPT}\nTHONG TIN DULIEU CSDL THUCTHOI (AP DUNG CUA NGUOI DUNG): ${contextString}`
        : SYSTEM_PROMPT;

    // 1. Try Groq Cloud LLM (Ultra-fast Llama-3.3-70b / Mixtral)
    if (GROQ_API_KEYS.length) {
        const groqResult = await callGroq(messages, fullInstruction);
        if (groqResult) return groqResult;
    }

    // 2. Try Gemini LLM
    if (API_KEYS.length) {
        for (const modelName of CANDIDATE_MODELS) {
            for (let i = 0; i < API_KEYS.length; i++) {
                const key = getNextKey();
                try {
                    const session = getModel(key, modelName, fullInstruction).startChat({
                        history,
                        generationConfig: { maxOutputTokens: 256, temperature: 0.2, candidateCount: 1 },
                    });
                    const result = await session.sendMessage(lastMsg.content);
                    return result.response.text();
                } catch (err) {
                    delete _modelCache[`${key}_${modelName}`];
                }
            }
        }
    }

    // 3. Fallback to Local RAG Engine & Static Guidance
    return dynamicAnswer || getLocalStaticAnswer(lastMsg?.content);
}

// ── Streaming Hybrid AI Engine ───────────────────────────────
async function chatStream(messages, onChunk) {
    const { history, lastMsg } = buildHistory(messages);
    const { contextString, dynamicAnswer } = await getOnDemandDbContext(lastMsg?.content);

    const fullInstruction = contextString 
        ? `${SYSTEM_PROMPT}\nTHONG TIN DULIEU CSDL THUCTHOI (AP DUNG CUA NGUOI DUNG): ${contextString}`
        : SYSTEM_PROMPT;

    // 1. Try Groq Cloud LLM Stream (Ultra-fast Llama-3.3-70b / Mixtral <200ms)
    if (GROQ_API_KEYS.length) {
        const groqStreamResult = await callGroqStream(messages, fullInstruction, onChunk);
        if (groqStreamResult) return groqStreamResult;
    }

    // 2. Try Gemini LLM Stream
    if (API_KEYS.length) {
        for (const modelName of CANDIDATE_MODELS) {
            for (let i = 0; i < API_KEYS.length; i++) {
                const key = getNextKey();
                try {
                    const session = getModel(key, modelName, fullInstruction).startChat({
                        history,
                        generationConfig: { maxOutputTokens: 256, temperature: 0.2, candidateCount: 1 },
                    });
                    const streamResult = await session.sendMessageStream(lastMsg.content);
                    let full = '';
                    for await (const chunk of streamResult.stream) {
                        const text = chunk.text();
                        if (text) { full += text; onChunk(text); }
                    }
                    if (full.trim()) return full;
                } catch (err) {
                    delete _modelCache[`${key}_${modelName}`];
                }
            }
        }
    }

    // 3. Fallback to Local RAG Engine & Static Guidance
    const finalAnswer = dynamicAnswer || getLocalStaticAnswer(lastMsg?.content);
    onChunk(finalAnswer);
    return finalAnswer;
}

module.exports = { chat, chatStream };





