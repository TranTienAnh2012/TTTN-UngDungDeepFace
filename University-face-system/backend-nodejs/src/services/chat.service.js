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

// ── Token-Optimized System Prompt (Concise + Smart) ──────────
const SYSTEM_PROMPT = `Bạn là Trợ lý AI Hệ thống Điểm danh Khuôn mặt Đại học. Trả lời NGẮN GỌN, ĐÚNG TRỌNG TÂM (tối đa 3-5 câu trừ khi cần hướng dẫn chi tiết).

QUY TẮC TRẢ LỜI:
- Trả lời bằng tiếng Việt, thân thiện, chuyên nghiệp.
- KHÔNG lặp lại câu hỏi. KHÔNG giải thích dài dòng khi không cần.
- Nếu câu hỏi liên quan dữ liệu CSDL, ưu tiên dùng dữ liệu thực được cung cấp.
- Nếu không biết, nói ngắn "Tôi không có thông tin này" thay vì bịa.
- Chatbox là Read-only, KHÔNG thay đổi CSDL hay phân quyền.

HỆ THỐNG GỒM:
1. Đăng ký khuôn mặt: 3 bước (Nhập thông tin → Quét 3 góc mặt bằng MTCNN/ArcFace → Lưu vector Base64 BLOB).
2. Điểm danh 1:N: Camera AI tự động nhận diện Check-in/Check-out. Giảng viên có thể điểm danh thủ công.
3. Thi & Cấm thi: Vắng >20% → Cấm thi tự động. Ca thi có sơ đồ chỗ ngồi.
4. Phân quyền: Admin (toàn quyền), Giảng viên (lịch dạy + điểm danh ca mình), Chatbox (read-only).`;

// ── Smart Intent Detection: Synonym Mapping ──────────────────
// Maps normalized Vietnamese synonyms → canonical intent keywords
const SYNONYM_MAP = {
  // Lịch học / Thời khóa biểu
  'thoi khoa bieu': 'lich hoc', 'tkb': 'lich hoc', 'lich giang': 'lich hoc',
  'hoc gi': 'lich hoc', 'mon gi': 'lich hoc', 'co mon nao': 'lich hoc',
  'hom nay hoc gi': 'lich hoc', 'co hoc khong': 'lich hoc',
  'gio hoc': 'lich hoc', 'phong hoc': 'lich hoc', 'lop hoc': 'lich hoc',
  'sang nay': 'lich hoc', 'chieu nay': 'lich hoc',
  // Điểm danh
  'cham cong': 'diem danh', 'diem danh': 'diem danh', 'check in': 'diem danh',
  'checkin': 'diem danh', 'kiem tra co mat': 'diem danh', 'co mat': 'diem danh',
  'vang mat': 'diem danh', 'nghi hoc': 'diem danh',
  // Đăng ký khuôn mặt
  'dang ky mat': 'dang ky khuon mat', 'dang ky face': 'dang ky khuon mat',
  'chup mat': 'dang ky khuon mat', 'tao mau': 'dang ky khuon mat',
  'dang ky': 'dang ky khuon mat', 'scan mat': 'dang ky khuon mat',
  'quet mat': 'dang ky khuon mat', 'nhan dien': 'dang ky khuon mat',
  // Lịch thi
  'bai kiem tra': 'lich thi', 'bai thi': 'lich thi', 'khi nao thi': 'lich thi',
  'lich kiem tra': 'lich thi', 'phong thi': 'lich thi', 'thi mon': 'lich thi',
  // Sinh viên
  'hoc sinh': 'sinh vien', 'sv': 'sinh vien', 'hs': 'sinh vien',
  'nguoi hoc': 'sinh vien', 'hoc vien': 'sinh vien',
  // Đi muộn / trễ giờ
  'den tre': 'di muon', 'tre gio': 'di muon', 'qua gio': 'di muon',
  'muon gio': 'di muon', 'cham tre': 'di muon', 'quen diem danh': 'di muon',
  // Cấm thi
  'khong du dieu kien': 'cam thi', 'du dieu kien thi': 'cam thi',
  'nghi qua nhieu': 'cam thi', 'vang nhieu': 'cam thi',
  // Giảng viên
  'thay': 'giang vien', 'co giao': 'giang vien', 'giao vien': 'giang vien',
  'gv': 'giang vien', 'nguoi day': 'giang vien',
  // Lỗi camera
  'khong quet duoc': 'loi camera', 'loi cam': 'loi camera',
  'cam bi hong': 'loi camera', 'camera den': 'loi camera',
  'mat mang': 'loi camera', 'khong nhan dien duoc': 'loi camera',
  // Chào hỏi
  'hello': 'chao', 'hi': 'chao', 'hey': 'chao', 'xin chao': 'chao',
  'chao ban': 'chao', 'chao ai': 'chao',
};

// Expand user query with synonym-matched canonical intents
function expandQueryWithSynonyms(normalizedQuery) {
  const expanded = new Set();
  const words = normalizedQuery.split(/\s+/);
  
  // Check full phrases first (2-4 word combos)
  for (let len = 4; len >= 2; len--) {
    for (let i = 0; i <= words.length - len; i++) {
      const phrase = words.slice(i, i + len).join(' ');
      if (SYNONYM_MAP[phrase]) expanded.add(SYNONYM_MAP[phrase]);
    }
  }
  // Then single words
  for (const w of words) {
    if (SYNONYM_MAP[w]) expanded.add(SYNONYM_MAP[w]);
  }
  
  return expanded;
}

// Detect primary intent from user query (returns intent string or null)
function detectIntent(normalizedQuery) {
  const q = normalizedQuery;
  const synonymIntents = expandQueryWithSynonyms(q);
  
  // Priority-ordered intent matching
  const INTENT_PATTERNS = [
    { intent: 'greeting', check: () => q === 'chao' || q === 'hi' || q === 'hello' || q === 'hey' || synonymIntents.has('chao') && q.length < 20 },
    { intent: 'exam_schedule', check: () => q.includes('lich thi') || q.includes('phong thi') || q.includes('thi mon') || q.includes('khi nao thi') || synonymIntents.has('lich thi') },
    { intent: 'class_schedule', check: () => q.includes('lich hoc') || q.includes('ca hoc') || q.includes('lich day') || q.includes('tiet') || q.includes('tuan') || synonymIntents.has('lich hoc') },
    { intent: 'attendance_report', check: () => (q.includes('diem danh') && (q.includes('bao cao') || q.includes('danh sach') || q.includes('ai'))) || (q.includes('di muon') && q.includes('ai')) },
    { intent: 'student_count', check: () => q.includes('bao nhieu sinh vien') || q.includes('tong sinh vien') || q.includes('so sinh vien') || (q.includes('bao nhieu') && synonymIntents.has('sinh vien')) },
    { intent: 'face_register', check: () => q.includes('dang ky') || synonymIntents.has('dang ky khuon mat') },
    { intent: 'attendance_workflow', check: () => (synonymIntents.has('diem danh') || q.includes('diem danh')) && (q.includes('quy trinh') || q.includes('huong dan') || q.includes('cach') || q.includes('the nao') || q.includes('lam sao')) },
    { intent: 'late_checkin', check: () => q.includes('di muon') || q.includes('tre gio') || q.includes('qua gio') || synonymIntents.has('di muon') },
    { intent: 'camera_error', check: () => q.includes('loi camera') || q.includes('mat mang') || q.includes('khong quet') || synonymIntents.has('loi camera') },
    { intent: 'exam_eligibility', check: () => q.includes('cam thi') || q.includes('du dieu kien') || synonymIntents.has('cam thi') },
    { intent: 'teacher_role', check: () => q.includes('giang vien') || q.includes('quyen giang vien') || synonymIntents.has('giang vien') },
    { intent: 'add_student', check: () => q.includes('them sinh vien') || q.includes('tao sinh vien') || q.includes('quan ly sinh vien') },
    { intent: 'security_deny', check: () => (q.includes('tao') || q.includes('them') || q.includes('sua')) && (q.includes('admin') || q.includes('quyen') || q.includes('csdl')) },
  ];
  
  for (const p of INTENT_PATTERNS) {
    if (p.check()) return p.intent;
  }
  return null; // Unknown intent → let LLM handle
}

// Helper to strip diacritics/accents and normalize text for reliable matching
function normalizeText(str) {
    if (!str) return '';
    return str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .trim();
}

// Helper to extract relative date offset from Vietnamese natural text
function extractDateOffset(query) {
    const q = normalizeText(query);

    // ── PAST: "X hôm/ngày trước" ──
    const matchPast = q.match(/(\d+)\s*(hom|ngay)\s*(truoc|qua)/);
    if (matchPast) {
        const days = parseInt(matchPast[1], 10);
        return { offset: -days, label: `${days} ngày trước` };
    }

    // ── FUTURE: "X hôm/ngày nữa" ──
    const matchFuture = q.match(/(\d+)\s*(hom|ngay)\s*nua/);
    if (matchFuture) {
        const days = parseInt(matchFuture[1], 10);
        return { offset: days, label: `${days} ngày nữa` };
    }

    // Past - word-based
    if (q.includes('hom kia') && q.includes('truoc')) {
        return { offset: -3, label: '3 ngày trước' };
    }
    if (q.includes('hai hom truoc') || q.includes('hai ngay truoc')) {
        return { offset: -2, label: '2 ngày trước' };
    }
    if (q.includes('ba hom truoc') || q.includes('ba ngay truoc')) {
        return { offset: -3, label: '3 ngày trước' };
    }
    if (q.includes('bon hom truoc') || q.includes('bon ngay truoc')) {
        return { offset: -4, label: '4 ngày trước' };
    }
    if (q.includes('hom truoc') || q.includes('hom bua') || q.includes('bua truoc') || q.includes('may hom truoc')) {
        return { offset: -1, label: 'hôm trước' };
    }
    if (q.includes('tuan truoc') || q.includes('tuan qua') || q.includes('tuan roi')) {
        return { offset: null, isPastWeek: true, label: 'tuần trước' };
    }

    // Future - word-based
    if (q.includes('hai hom nua') || q.includes('hai ngay nua') || q.includes('ngay kia')) {
        return { offset: 2, label: '2 ngày nữa' };
    }
    if (q.includes('ba hom nua') || q.includes('ba ngay nua')) {
        return { offset: 3, label: '3 ngày nữa' };
    }
    if (q.includes('bon hom nua') || q.includes('bon ngay nua')) {
        return { offset: 4, label: '4 ngày nữa' };
    }
    if (q.includes('ngay mai') || q.includes('sang mai') || q.includes('chieu mai')) {
        return { offset: 1, label: 'ngày mai' };
    }

    // Yesterday
    if (q.includes('hom qua')) {
        return { offset: -1, label: 'hôm qua' };
    }

    // This week
    if (q.includes('tuan nay') || q.includes('tuan hom nay')) {
        return { offset: null, isWeek: true, label: 'tuần này' };
    }

    // Today
    if (q.includes('hom nay') || q.includes('bay gio')) {
        return { offset: 0, label: 'hôm nay' };
    }

    return null;
}

// ── On-Demand Targeted Database Context Provider (Token-Optimized RAG) ──
async function getOnDemandDbContext(query) {
    if (!query) return { contextString: '', dynamicAnswer: null };
    const q = normalizeText(query);
    const intent = detectIntent(q);

    // If intent is purely instructional (workflow/registration/error guidance), skip DB query
    const instructionalIntents = ['face_register', 'attendance_workflow', 'late_checkin', 'camera_error', 'exam_eligibility', 'teacher_role', 'add_student', 'security_deny', 'greeting'];
    if (instructionalIntents.includes(intent) && !q.includes('lich') && !q.includes('danh sach')) {
        return { contextString: '', dynamicAnswer: null };
    }

    // 1. Live Exam Schedules Query
    if (intent === 'exam_schedule') {
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

    // 2. Student Count Query
    if (intent === 'student_count') {
        try {
            const [rows] = await pool.query('SELECT COUNT(*) as total FROM students');
            const total = rows[0]?.total || 0;
            const answer = `🎓 Hiện tại hệ thống đang quản lý tổng cộng **${total} sinh viên**.`;
            return { contextString: `DULIEU_TONG_SV: ${total} sinh vien.`, dynamicAnswer: answer };
        } catch (err) {
            console.error('Lỗi RAG query students:', err.message);
        }
    }

    // 2b. Attendance Log Query
    if (intent === 'attendance_report') {
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

    // 3. Live Class Schedules Query
    const dateMeta = extractDateOffset(query);
    if (intent === 'class_schedule' || dateMeta) {
        try {
            let dateCondition = 'DATE(cs.start_time) = CURDATE() OR (NOW() BETWEEN cs.start_time AND cs.end_time)';
            let label = dateMeta ? dateMeta.label : 'hôm nay';

            if ((dateMeta && dateMeta.isWeek) || (q.includes('tuan nay'))) {
                dateCondition = 'YEARWEEK(cs.start_time, 1) = YEARWEEK(CURDATE(), 1)';
                label = 'tuần này';
            } else if (dateMeta && dateMeta.isPastWeek) {
                dateCondition = 'YEARWEEK(cs.start_time, 1) = YEARWEEK(DATE_SUB(CURDATE(), INTERVAL 1 WEEK), 1)';
                label = 'tuần trước';
            } else if (dateMeta && dateMeta.offset !== null) {
                if (dateMeta.offset >= 0) {
                    dateCondition = `DATE(cs.start_time) = DATE_ADD(CURDATE(), INTERVAL ${dateMeta.offset} DAY)`;
                } else {
                    dateCondition = `DATE(cs.start_time) = DATE_SUB(CURDATE(), INTERVAL ${Math.abs(dateMeta.offset)} DAY)`;
                }
            }

            const [rows] = await pool.query(`
                SELECT cs.id, cs.room_name,
                       DATE_FORMAT(cs.start_time, '%H:%i') as start_hm,
                       DATE_FORMAT(cs.end_time, '%H:%i') as end_hm,
                       DATE_FORMAT(cs.start_time, '%d/%m/%Y') as date_str,
                       DAYNAME(cs.start_time) as day_name,
                       c.course_code, c.course_name
                FROM class_schedules cs
                JOIN courses c ON cs.course_id = c.id
                WHERE ${dateCondition}
                ORDER BY cs.start_time ASC
                LIMIT 10
            `);

            let scheduleRows = rows;
            if (scheduleRows.length === 0) {
                const [allRows] = await pool.query(`
                    SELECT cs.id, cs.room_name,
                           DATE_FORMAT(cs.start_time, '%H:%i') as start_hm,
                           DATE_FORMAT(cs.end_time, '%H:%i') as end_hm,
                           DATE_FORMAT(cs.start_time, '%d/%m/%Y') as date_str,
                           DAYNAME(cs.start_time) as day_name,
                           c.course_code, c.course_name
                    FROM class_schedules cs
                    JOIN courses c ON cs.course_id = c.id
                    ORDER BY cs.start_time DESC
                    LIMIT 5
                `);
                scheduleRows = allRows;
            }

            if (scheduleRows.length === 0) {
                const answer = `📅 Dạ hiện tại hệ thống chưa có dữ liệu lịch giảng dạy nào trong cơ sở dữ liệu.`;
                return { contextString: 'DULIEU_CSDL: Chưa có lịch học.', dynamicAnswer: answer };
            }

            const dayViMap = {
                'Monday': 'Thứ Hai',
                'Tuesday': 'Thứ Ba',
                'Wednesday': 'Thứ Tư',
                'Thursday': 'Thứ Năm',
                'Friday': 'Thứ Sáu',
                'Saturday': 'Thứ Bảy',
                'Sunday': 'Chủ Nhật'
            };

            const items = scheduleRows.map((r, idx) => {
                const dayVi = dayViMap[r.day_name] || r.date_str;
                return `${idx + 1}. Môn **${r.course_name} (${r.course_code})**\n   • Thời gian: ${dayVi}, ${r.date_str} (${r.start_hm} - ${r.end_hm})\n   • Phòng học: **${r.room_name || 'Phòng Lab'}**`;
            });
            
            const answer = `📅 **Danh sách lịch giảng dạy ${label} (${scheduleRows.length} ca):**\n\n` + items.join('\n\n') + '\n\n👉 Bạn có thể bấm nút "Mở Camera Điểm Danh Ngay" trên màn hình để điểm danh AI.';
            return { contextString: `DULIEU_CSDL: ${scheduleRows.map(r => `${r.course_code} - ${r.course_name} tại ${r.room_name}`).join('; ')}`, dynamicAnswer: answer };
        } catch (err) {
            console.error('Lỗi RAG query schedules:', err.message);
        }
    }

    return { contextString: '', dynamicAnswer: null };
}

// General static system guidance for security, role rules, & FAQs (uses Smart Intent)
function getLocalStaticAnswer(query) {
    if (!query) return null;
    const q = normalizeText(query);
    const intent = detectIntent(q);

    if (intent === 'attendance_workflow' && !q.includes('dang ky') && !q.includes('di muon') && !q.includes('bao cao')) {
        return '📷 **Quy trình Điểm danh Khuôn mặt Sinh viên khi vào Ca học:**\n\n' +
               '1. **Giảng viên kích hoạt ca học:**\n' +
               '   • Giảng viên đăng nhập hệ thống ➔ Vào mục **"Lịch giảng dạy"** ➔ Chọn ca học hiện tại.\n' +
               '   • Bấm nút màu xanh **"Mở Camera Điểm Danh Ngay"** trên cùng màn hình.\n\n' +
               '2. **Sinh viên thực hiện điểm danh AI 1:N (Check-in đầu giờ):**\n' +
               '   • Sinh viên đứng trước Camera phòng học (khoảng cách 40cm - 60cm, đủ ánh sáng).\n' +
               '   • Camera AI tự động phát hiện khuôn mặt (Bounding Box), trích xuất vector và đối soát 1:N với CSDL sinh viên.\n' +
               '   • Màn hình hiển thị thông báo **"✅ Điểm danh thành công: [MSSV - Họ tên]"** và chốt trạng thái **Đúng giờ** (hoặc **Đi muộn** nếu trễ giờ).\n\n' +
               '3. **Check-out cuối giờ học:**\n' +
               '   • Cuối tiết học, sinh viên xác nhận Check-out qua camera để hệ thống ghi nhận tổng thời gian có mặt thực tế.\n\n' +
               '4. **Xử lý sự cố / Điểm danh thủ công:**\n' +
               '   • Nếu sinh viên chưa đăng ký mẫu hoặc camera hỏng, Giảng viên chọn tên sinh viên trong danh sách ca học để cập nhật thủ công thành **"Có mặt"** / **"Đi muộn"**.';
    }

    // 2. Face Registration Steps
    if (intent === 'face_register') {
        return '📸 **Quy trình Đăng ký Khuôn mặt bao gồm 3 BƯỚC CHUẨN AI như sau:**\n\n' +
               '1. **Bước 1: Nhập & Xác thực thông tin sinh viên**\n' +
               '   • Điền/Chọn đầy đủ thông tin: MSSV, Họ tên, Lớp sinh hoạt, Ngày sinh, Khoa.\n' +
               '   • Bấm **"Tạo thông tin"** để hệ thống khởi tạo hồ sơ sinh viên trong CSDL.\n\n' +
               '2. **Bước 2: Quét 3 góc khuôn mặt qua Camera AI**\n' +
               '   • Đứng trước camera, giữ mặt trong khung hình oval hướng dẫn.\n' +
               '   • Lần lượt chụp 3 ảnh góc mặt:\n' +
               '     - **Góc 1**: Nhìn thẳng góc mặt.\n' +
               '     - **Góc 2**: Nghiêng nhẹ sang góc TRÁI.\n' +
               '     - **Góc 3**: Nghiêng nhẹ sang góc PHẢI.\n' +
               '   • AI (MTCNN/ArcFace) trích xuất vector embedding 3 góc và tính vector đặc trưng trung bình (mean embedding).\n\n' +
               '3. **Bước 3: Hoàn thành & Lưu dữ liệu Vector**\n' +
               '   • Hệ thống mã hóa vector Base64 BLOB và lưu an toàn vào CSDL MySQL.\n' +
               '   • Hiển thị thẻ thông báo hoàn thành và cho phép chuyển nhanh sang giao diện Điểm danh AI.';
    }

    // 3. Greetings
    if (intent === 'greeting') {
        return '👋 **Xin chào! Tôi là Trợ lý AI Hệ thống Điểm danh Khuôn mặt.**\n\nBạn có thể hỏi tôi về:\n1. 📸 Quy trình đăng ký khuôn mặt (3 bước AI).\n2. 📷 Quy trình điểm danh sinh viên khi vào ca học (1:N AI).\n3. 📅 Lịch học & Ca giảng dạy (hôm nay, ngày mai, tuần này).\n4. 📝 Lịch thi & Phòng thi.\n5. ⏰ Quy trình xử lý tình huống (đi muộn, lỗi camera, mất mạng, cấm thi).\n6. 🔐 Phân quyền Giảng viên / Admin.\n\nTôi có thể giúp gì cho bạn hôm nay?';
    }

    // 4. Action Requests Denial (Security Rules)
    if (intent === 'security_deny') {
        return '⛔ **Từ chối thao tác:** Chatbox là trợ lý hướng dẫn thông tin (Read-only) và **KHÔNG CÓ QUYỀN** truy cập hay thay đổi dữ liệu/quyền hạn người dùng.';
    }

    // 5. Late Check-in / Manual Override / Expired Window
    if (intent === 'late_checkin') {
        return '⏰ **Đừng lo lắng! Quy trình xử lý khi ĐI MUỘN hoặc QUÁ GIỜ điểm danh tự động:**\n\n' +
               '1. **Báo ngay cho Giảng viên đứng lớp:**\n' +
               '   • Giảng viên có toàn quyền điểm danh bổ sung trực tiếp trên hệ thống Web.\n\n' +
               '2. **Giảng viên điều chỉnh thủ công (Manual Attendance):**\n' +
               '   • Giảng viên mở Dashboard ca học ➔ Chọn tên bạn trên danh sách lớp.\n' +
               '   • Đổi trạng thái từ *Vắng* sang **"Đi muộn"** hoặc **"Có mặt"** kèm ghi chú lý do (Ví dụ: *"Đến muộn 10 phút"*).\n\n' +
               '3. **Lưu chốt số liệu:**\n' +
               '   • Sau khi Giảng viên bấm **Lưu điểm danh**, nhật ký cá nhân của bạn sẽ được tự động cập nhật đúng giờ.';
    }

    // 6. Unregistered Face / Recognition Failure
    if (intent === 'camera_error' || q.includes('chua dang ky') || q.includes('mat la') || q.includes('chua co mau')) {
        return '👤 **Quy trình xử lý khi AI KHÔNG nhận diện được mặt hoặc chưa đăng ký mẫu:**\n\n' +
               '1. **Xác minh sinh viên:** Giảng viên kiểm tra MSSV/Thẻ sinh viên xem có trong danh sách Lớp/Môn không.\n' +
               '2. **Tích chọn thủ công:** Nếu đúng sinh viên, Giảng viên chọn trạng thái **"Có mặt"** thủ công trên giao diện ca học.\n' +
               '3. **Đăng ký bổ sung:** Hướng dẫn sinh viên vào mục **"Đăng ký khuôn mặt"** thực hiện đủ 3 bước chụp mẫu chuẩn để hệ thống học dữ liệu AI cho các ca sau.';
    }

    // 7. Network / Camera hardware issues
    if (q.includes('hong camera') || q.includes('mat dien') || (intent === 'camera_error' && (q.includes('mat mang') || q.includes('camera den')))) {
        return '🔌 **Quy trình xử lý khi gặp Sự cố Thiết bị / Mất mạng:**\n\n' +
               '1. **Sử dụng Điểm danh thủ công:** Giảng viên chuyển sang danh sách tick chọn thủ công trên hệ thống Web.\n' +
               '2. **Cập nhật bù trong 24h:** Sau khi có mạng/thiết bị hoạt động trở lại, Giảng viên có thể mở lại ca học để cập nhật bù trạng thái điểm danh.';
    }

    // 8. Exam Eligibility & Attendance rules
    if (intent === 'exam_eligibility') {
        return '📋 **Quy định về Điều kiện dự thi & Nghỉ quá số buổi:**\n\n' +
               '• Hệ thống tự động tính tỷ lệ vắng mặt dựa trên nhật ký điểm danh 2 ca.\n' +
               '• Nếu sinh viên **vắng quá 20% tổng số tiết** (hoặc quá số buổi quy định), hệ thống sẽ tự động xếp sinh viên vào danh sách **Cấm thi**.\n' +
               '• Admin & Giảng viên xem danh sách chi tiết tại mục **"Điểm danh thi / Điều kiện dự thi"** và hệ thống gán vị trí chỗ ngồi tự động.';
    }

    // 9. Teacher vs Admin Role Boundaries
    if (intent === 'teacher_role') {
        return '👨‍🏫 **Phân quyền tài khoản Giảng viên:**\n' +
               '• **Được phép:** Xem lịch dạy cá nhân, mở camera điểm danh AI ca học của mình (Check-in & Check-out), xem danh sách sinh viên lớp môn học, xem báo cáo điểm danh, điều chỉnh điểm danh thủ công, đăng ký khuôn mặt Giảng viên.\n' +
               '• **Không được phép:** Tạo tài khoản sinh viên mới, sửa thông tin CSDL hệ thống, thay đổi phân quyền Admin.';
    }

    // 10. Admin Student Management
    if (intent === 'add_student') {
        return '📝 **Cách thêm sinh viên mới (Dành cho tài khoản Admin):**\n' +
               '1. Đăng nhập tài khoản Admin.\n' +
               '2. Vào mục **"Sinh viên"** trên menu quản trị.\n' +
               '3. Bấm **"Thêm sinh viên mới"**, chọn Khoa, chọn Lớp sinh hoạt và nhập MSSV, Họ tên, Email.\n' +
               '4. Lưu ý: MSSV và Email không được trùng lặp.';
    }

    // 11. General fallback summary -> Return null so RAG or chat fallback handles general prompts
    return null;
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
            content: (m.content || '').slice(0, 500)
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
                    temperature: 0.25,
                    max_tokens: 280
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
            content: (m.content || '').slice(0, 500)
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
                    temperature: 0.25,
                    max_tokens: 280,
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

// ── Build Gemini-compatible history (with token protection) ──
function buildHistory(messages) {
    const MAX_MSG_LEN = 500; // Truncate each message to save tokens
    const trimmed = messages.slice(-6);
    const firstUser = trimmed.findIndex(m => m.role === 'user');
    const relevant  = firstUser >= 0 ? trimmed.slice(firstUser) : trimmed;
    const histMsgs  = relevant.slice(0, -1);
    const lastMsg   = relevant[relevant.length - 1];

    // Truncate last message content for safety
    const safeLast = lastMsg ? { ...lastMsg, content: (lastMsg.content || '').slice(0, MAX_MSG_LEN) } : lastMsg;

    const history = [];
    for (const m of histMsgs) {
        const role = m.role === 'assistant' ? 'model' : 'user';
        const safeContent = (m.content || '').slice(0, MAX_MSG_LEN);
        if (!history.length) {
            if (role === 'user') history.push({ role, parts: [{ text: safeContent }] });
        } else if (role !== history[history.length - 1].role) {
            history.push({ role, parts: [{ text: safeContent }] });
        }
    }
    return { history, lastMsg: safeLast };
}

// ── Non-streaming Hybrid AI Engine ───────────────────────────
async function chat(messages) {
    const { history, lastMsg } = buildHistory(messages);
    const userQuery = lastMsg?.content || '';

    // Check if query is instructional/procedural FAQ
    const staticAnswer = getLocalStaticAnswer(userQuery);

    const { contextString, dynamicAnswer } = await getOnDemandDbContext(userQuery);

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
                        generationConfig: { maxOutputTokens: 280, temperature: 0.2, candidateCount: 1 },
                    });
                    const result = await session.sendMessage(userQuery);
                    return result.response.text();
                } catch (err) {
                    delete _modelCache[`${key}_${modelName}`];
                }
            }
        }
    }

    // Simulate natural thinking delay (1.0s) for smoother experience
    await new Promise(r => setTimeout(r, 1000));

    // 3. Fallback to Local RAG Engine & Dynamic CSDL Guidance
    return dynamicAnswer || staticAnswer || '🤖 **Trợ lý AI hệ thống điểm danh luôn sẵn sàng giải đáp các thắc mắc:**\n' +
           '• 📷 **Quy trình điểm danh vào ca**: Kích hoạt camera AI 1:N, Check-in/Check-out.\n' +
           '• 📸 **Đăng ký khuôn mặt**: Quy trình 3 bước chuẩn AI (Thẳng, Trái, Phải).\n' +
           '• ⏰ **Xử lý tình huống**: Quá giờ điểm danh, sinh viên đi muộn, lỗi camera/scan mặt, mất mạng.\n' +
           '• 📅 **Lịch học & Ca giảng dạy**: Tra cứu hôm nay, ngày mai, tuần này.\n' +
           '• 📝 **Lịch thi & Điều kiện dự thi**: Sơ đồ chỗ ngồi, quy định cấm thi (>20% vắng).\n' +
           '• 🔐 **Phân quyền**: Quy định Admin vs Giảng viên.\n\nBạn cần hỗ trợ thông tin nào cụ thể?';
}

// Helper to stream text smoothly with word pacing
async function streamTextSmoothly(text, onChunk, delayMs = 18) {
    if (!text) return;
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
        const word = words[i] + (i === words.length - 1 ? '' : ' ');
        onChunk(word);
        await new Promise(r => setTimeout(r, delayMs));
    }
}

// ── Streaming Hybrid AI Engine ───────────────────────────────
async function chatStream(messages, onChunk) {
    const { history, lastMsg } = buildHistory(messages);
    const userQuery = lastMsg?.content || '';

    const staticAnswer = getLocalStaticAnswer(userQuery);
    const { contextString, dynamicAnswer } = await getOnDemandDbContext(userQuery);

    const fullInstruction = contextString 
        ? `${SYSTEM_PROMPT}\nTHONG TIN DULIEU CSDL THUCTHOI (AP DUNG CUA NGUOI DUNG): ${contextString}`
        : SYSTEM_PROMPT;

    // Simulate natural 1.2s thinking delay to display sleek "Thinking..." state
    await new Promise(r => setTimeout(r, 1200));

    // 1. Try Groq Cloud LLM Stream (Ultra-fast Llama-3.3-70b / Mixtral)
    if (GROQ_API_KEYS.length) {
        const groqStreamResult = await callGroqStream(messages, fullInstruction, async (chunk) => {
            await streamTextSmoothly(chunk, onChunk, 15);
        });
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
                        generationConfig: { maxOutputTokens: 280, temperature: 0.2, candidateCount: 1 },
                    });
                    const streamResult = await session.sendMessageStream(userQuery);
                    let full = '';
                    for await (const chunk of streamResult.stream) {
                        const text = chunk.text();
                        if (text) {
                            full += text;
                            await streamTextSmoothly(text, onChunk, 15);
                        }
                    }
                    if (full.trim()) return full;
                } catch (err) {
                    delete _modelCache[`${key}_${modelName}`];
                }
            }
        }
    }

    // 3. Fallback to Local RAG Engine & Dynamic CSDL Guidance with smooth word-by-word streaming
    const finalAnswer = dynamicAnswer || staticAnswer || '🤖 **Trợ lý AI hệ thống điểm danh luôn sẵn sàng giải đáp các thắc mắc:**\n' +
           '• 📷 **Quy trình điểm danh vào ca**: Kích hoạt camera AI 1:N, Check-in/Check-out.\n' +
           '• 📸 **Đăng ký khuôn mặt**: Quy trình 3 bước chuẩn AI (Thẳng, Trái, Phải).\n' +
           '• ⏰ **Xử lý tình huống**: Quá giờ điểm danh, sinh viên đi muộn, lỗi camera/scan mặt, mất mạng.\n' +
           '• 📅 **Lịch học & Ca giảng dạy**: Tra cứu hôm nay, ngày mai, tuần này.\n' +
           '• 📝 **Lịch thi & Điều kiện dự thi**: Sơ đồ chỗ ngồi, quy định cấm thi (>20% vắng).\n' +
           '• 🔐 **Phân quyền**: Quy định Admin vs Giảng viên.\n\nBạn cần hỗ trợ thông tin nào cụ thể?';
    await streamTextSmoothly(finalAnswer, onChunk, 18);
    return finalAnswer;
}

module.exports = { chat, chatStream };

