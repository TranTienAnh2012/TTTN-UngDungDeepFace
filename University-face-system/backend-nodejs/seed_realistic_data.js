const path = require('path');
require('dotenv').config({ path: [path.join(__dirname, '.env'), path.join(__dirname, '..', '.env')] });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seedRealisticData() {
    const host = process.env.DB_HOST || '127.0.0.1';
    const port = Number(process.env.DB_PORT) || 3306;
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
    const dbName = process.env.DB_NAME || 'face_attendance_db';

    console.log('================================================================');
    console.log('   BẮT ĐẦU NÂNG CẤP DỮ LIỆU DATABASE HỆ THỐNG ĐIỂM DANH ĐẠI HỌC');
    console.log('================================================================');

    const conn = await mysql.createConnection({
        host,
        port,
        user,
        password,
        database: dbName,
        multipleStatements: true
    });

    try {
        console.log('[1/8] Chuẩn hóa danh mục Khoa / Viện...');
        const facultiesData = [
            { code: 'CNTT', name: 'Khoa Công Nghệ Thông Tin', desc: 'Kỹ thuật phần mềm, Trí tuệ nhân tạo, Khoa học máy tính' },
            { code: 'ATTT', name: 'Khoa An Toàn Thông Tin', desc: 'An ninh mạng, Mật mã học, Điều tra số' },
            { code: 'DTVT', name: 'Khoa Điện Tử Viễn Thông', desc: 'Kỹ thuật viễn thông, Mạng máy tính, IoT & Vi mạch' },
            { code: 'QTKD', name: 'Khoa Quản Trị Kinh Doanh', desc: 'Quản trị kinh doanh số, Marketing số, Thương mại điện tử' },
            { code: 'KTDN', name: 'Khoa Kinh Tế & Kế Toán', desc: 'Kế toán doanh nghiệp, Tài chính số, Kiểm toán' },
            { code: 'NN',   name: 'Khoa Ngoại Ngữ', desc: 'Tiếng Anh thương mại, Tiếng Nhật công nghệ' }
        ];

        for (const f of facultiesData) {
            await conn.execute(
                `INSERT INTO faculties (faculty_code, faculty_name, description) 
                 VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE faculty_name = VALUES(faculty_name), description = VALUES(description)`,
                [f.code, f.name, f.desc]
            );
        }

        const [faculties] = await conn.query('SELECT id, faculty_code FROM faculties');
        const fMap = {};
        faculties.forEach(f => { fMap[f.faculty_code] = f.id; });

        console.log('[2/8] Chuẩn hóa danh mục Lớp sinh viên chính quy...');
        const classesData = [
            { code: 'CNTT1-K15', name: 'Công Nghệ Thông Tin 1 - Khóa 15', fid: fMap['CNTT'], year: '2022-2026' },
            { code: 'CNTT2-K15', name: 'Công Nghệ Thông Tin 2 - Khóa 15', fid: fMap['CNTT'], year: '2022-2026' },
            { code: 'KTPM1-K15', name: 'Kỹ Thuật Phần Mềm 1 - Khóa 15', fid: fMap['CNTT'], year: '2022-2026' },
            { code: 'ATTT1-K15', name: 'An Toàn Thông Tin 1 - Khóa 15', fid: fMap['ATTT'], year: '2022-2026' },
            { code: 'DTVT1-K14', name: 'Điện Tử Viễn Thông 1 - Khóa 14', fid: fMap['DTVT'], year: '2021-2025' },
            { code: 'QTKD1-K15', name: 'Quản Trị Kinh Doanh 1 - Khóa 15', fid: fMap['QTKD'], year: '2022-2026' },
            { code: 'KETOAN1-K15', name: 'Kế Toán Doanh Nghiệp 1 - Khóa 15', fid: fMap['KTDN'], year: '2022-2026' }
        ];

        for (const c of classesData) {
            await conn.execute(
                `INSERT INTO classes (class_code, class_name, faculty_id, academic_year, status) 
                 VALUES (?, ?, ?, ?, 'Active') 
                 ON DUPLICATE KEY UPDATE class_name = VALUES(class_name), faculty_id = VALUES(faculty_id), academic_year = VALUES(academic_year)`,
                [c.code, c.name, c.fid, c.year]
            );
        }

        const [classes] = await conn.query('SELECT id, class_code FROM classes');
        const cMap = {};
        classes.forEach(c => { cMap[c.class_code] = c.id; });

        console.log('[3/8] Chuẩn hóa Phòng học và Ca học...');
        const roomsData = [
            { code: 'A201', name: 'Giảng đường 201 - Tòa A', b: 'Tòa A', type: 'theory', cap: 50, r: 5, c: 10 },
            { code: 'A205', name: 'Giảng đường 205 - Tòa A', b: 'Tòa A', type: 'theory', cap: 50, r: 5, c: 10 },
            { code: 'B401', name: 'Phòng thi chuẩn 401 - Tòa B', b: 'Tòa B', type: 'exam_hall', cap: 48, r: 6, c: 8 },
            { code: 'B402', name: 'Phòng học đa năng 402 - Tòa B', b: 'Tòa B', type: 'theory', cap: 40, r: 5, c: 8 },
            { code: 'LAB01', name: 'Phòng Thực Hành Máy Tính 01 - Tòa C', b: 'Tòa C', type: 'lab', cap: 36, r: 6, c: 6 },
            { code: 'LAB02', name: 'Phòng Lab AI & Deep Learning 02 - Tòa C', b: 'Tòa C', type: 'lab', cap: 36, r: 6, c: 6 },
            { code: 'HT-A1', name: 'Hội Trường Lớn A1', b: 'Tòa A', type: 'exam_hall', cap: 64, r: 8, c: 8 }
        ];

        for (const rm of roomsData) {
            await conn.execute(
                `INSERT INTO rooms (room_code, room_name, building, room_type, capacity, seating_rows, seating_cols, disabled_seats, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, '[]', 'Active') 
                 ON DUPLICATE KEY UPDATE room_name = VALUES(room_name), building = VALUES(building), room_type = VALUES(room_type), capacity = VALUES(capacity), seating_rows = VALUES(seating_rows), seating_cols = VALUES(seating_cols)`,
                [rm.code, rm.name, rm.b, rm.type, rm.cap, rm.r, rm.c]
            );
        }

        const [rooms] = await conn.query('SELECT id, room_code FROM rooms');
        const rMap = {};
        rooms.forEach(r => { rMap[r.room_code] = r.id; });

        const shiftsData = [
            { code: 'CA1', name: 'Ca 1 (Sáng: 07h00 - 09h15)', start: '07:00:00', end: '09:15:00', ps: 1, pe: 3, type: 'morning' },
            { code: 'CA2', name: 'Ca 2 (Sáng: 09h30 - 11h45)', start: '09:30:00', end: '11:45:00', ps: 4, pe: 6, type: 'morning' },
            { code: 'CA3', name: 'Ca 3 (Chiều: 13h00 - 15h15)', start: '13:00:00', end: '15:15:00', ps: 7, pe: 9, type: 'afternoon' },
            { code: 'CA4', name: 'Ca 4 (Chiều: 15h30 - 17h45)', start: '15:30:00', end: '17:45:00', ps: 10, pe: 12, type: 'afternoon' },
            { code: 'CA5', name: 'Ca 5 (Tối: 18h00 - 20h15)', start: '18:00:00', end: '20:15:00', ps: 13, pe: 15, type: 'evening' }
        ];

        for (const s of shiftsData) {
            await conn.execute(
                `INSERT INTO study_shifts (shift_code, shift_name, start_time, end_time, period_start, period_end, shift_type) 
                 VALUES (?, ?, ?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE shift_name = VALUES(shift_name), start_time = VALUES(start_time), end_time = VALUES(end_time), period_start = VALUES(period_start), period_end = VALUES(period_end), shift_type = VALUES(shift_type)`,
                [s.code, s.name, s.start, s.end, s.ps, s.pe, s.type]
            );
        }

        const [shifts] = await conn.query('SELECT id, shift_code FROM study_shifts');
        const sMap = {};
        shifts.forEach(s => { sMap[s.shift_code] = s.id; });

        console.log('[4/8] Chuẩn hóa Môn học (Học phần)...');
        const coursesData = [
            { code: 'INT1434', name: 'Thị giác Máy tính & Học sâu (Deep Learning)', credits: 3 },
            { code: 'INT1340', name: 'Trí tuệ Nhân tạo & Ứng dụng', credits: 3 },
            { code: 'INT1332', name: 'Phát triển Ứng dụng Web & Cloud', credits: 3 },
            { code: 'INT1306', name: 'Cấu trúc Dữ liệu & Giải thuật', credits: 4 },
            { code: 'INT1314', name: 'Hệ Quản trị Cơ sở Dữ liệu', credits: 3 },
            { code: 'SEC1201', name: 'An toàn & Bảo mật Thông tin', credits: 3 },
            { code: 'ELE1102', name: 'Mạng Máy tính & Truyền thông', credits: 3 },
            { code: 'BUS1010', name: 'Quản trị Doanh nghiệp & Khởi nghiệp', credits: 3 }
        ];

        for (const crs of coursesData) {
            const [existing] = await conn.execute('SELECT id FROM courses WHERE course_code = ?', [crs.code]);
            if (existing.length > 0) {
                await conn.execute('UPDATE courses SET course_name = ?, credits = ? WHERE id = ?', [crs.name, crs.credits, existing[0].id]);
            } else {
                await conn.execute('INSERT INTO courses (course_code, course_name, credits) VALUES (?, ?, ?)', [crs.code, crs.name, crs.credits]);
            }
        }

        const [courses] = await conn.query('SELECT id, course_code FROM courses');
        const crsMap = {};
        courses.forEach(crs => { crsMap[crs.course_code] = crs.id; });

        console.log('[5/8] Chuẩn hóa Quản trị viên & Giảng viên bộ môn...');
        const passAdminHash = await bcrypt.hash('admin', 12);
        const pass123Hash = await bcrypt.hash('123456', 12);

        const adminsData = [
            { email: 'admin@system.com', username: 'admin', name: 'Super Admin - Quản Trị Hệ Thống', role: 'admin', pass: passAdminHash },
            { email: 'ctung@gmail.com', username: 'nctung', name: 'TS. Nguyễn Công Tùng', role: 'teacher', pass: pass123Hash },
            { email: 'ttanh@university.edu.vn', username: 'ttanh', name: 'ThS. Trần Tiến Anh', role: 'teacher', pass: pass123Hash },
            { email: 'lvson@university.edu.vn', username: 'lvson', name: 'TS. Lục Văn Sơn', role: 'teacher', pass: pass123Hash },
            { email: 'lmhoa@university.edu.vn', username: 'lmhoa', name: 'PGS.TS. Lê Thị Mai Hoa', role: 'teacher', pass: pass123Hash },
            { email: 'vhung@university.edu.vn', username: 'vhung', name: 'TS. Vũ Mạnh Hùng', role: 'teacher', pass: pass123Hash }
        ];

        for (const adm of adminsData) {
            const [existing] = await conn.execute('SELECT id FROM administrators WHERE email = ? OR username = ?', [adm.email, adm.username]);
            if (existing.length > 0) {
                await conn.execute(
                    `UPDATE administrators SET full_name = ?, role = ?, is_email_verified = 1 WHERE id = ?`,
                    [adm.name, adm.role, existing[0].id]
                );
            } else {
                await conn.execute(
                    `INSERT INTO administrators (username, full_name, email, password, role, is_email_verified) 
                     VALUES (?, ?, ?, ?, ?, 1)`,
                    [adm.username, adm.name, adm.email, adm.pass, adm.role]
                );
            }
        }

        console.log('[6/8] Bổ sung và cập nhật danh sách Sinh viên chính quy...');
        // Đảm bảo gán đúng khoa và lớp cho các sinh viên ban đầu
        await conn.execute(`UPDATE students SET faculty_id = ?, class_id = ?, class_name = 'CNTT1-K15' WHERE student_code IN ('2310900051', '2310900052', '2310900087', '2310900107')`, [fMap['CNTT'], cMap['CNTT1-K15']]);
        await conn.execute(`UPDATE students SET faculty_id = ?, class_id = ?, class_name = 'CNTT2-K15' WHERE student_code IN ('2310900012', '2310900028')`, [fMap['CNTT'], cMap['CNTT2-K15']]);
        await conn.execute(`UPDATE students SET faculty_id = ?, class_id = ?, class_name = 'KTPM1-K15' WHERE student_code IN ('2310900035', '2310900049', '2310900000')`, [fMap['CNTT'], cMap['KTPM1-K15']]);

        // Thêm danh sách sinh viên thực tế mới (không ghi đè embedding của sinh viên cũ)
        const additionalStudents = [
            // Lớp CNTT1-K15
            { code: '2310900001', name: 'Nguyễn Văn An', dob: '2004-03-15', email: 'an.nv23@university.edu.vn', fid: fMap['CNTT'], cid: cMap['CNTT1-K15'], cname: 'CNTT1-K15' },
            { code: '2310900002', name: 'Trần Thị Bình', dob: '2004-07-22', email: 'binh.tt23@university.edu.vn', fid: fMap['CNTT'], cid: cMap['CNTT1-K15'], cname: 'CNTT1-K15' },
            { code: '2310900003', name: 'Lê Minh Cường', dob: '2004-11-05', email: 'cuong.lm23@university.edu.vn', fid: fMap['CNTT'], cid: cMap['CNTT1-K15'], cname: 'CNTT1-K15' },
            { code: '2310900004', name: 'Phạm Thu Dung', dob: '2004-01-19', email: 'dung.pt23@university.edu.vn', fid: fMap['CNTT'], cid: cMap['CNTT1-K15'], cname: 'CNTT1-K15' },
            { code: '2310900005', name: 'Hoàng Hải Đăng', dob: '2004-09-30', email: 'dang.hh23@university.edu.vn', fid: fMap['CNTT'], cid: cMap['CNTT1-K15'], cname: 'CNTT1-K15' },
            { code: '2310900006', name: 'Vũ Đức Giang', dob: '2004-05-12', email: 'giang.vd23@university.edu.vn', fid: fMap['CNTT'], cid: cMap['CNTT1-K15'], cname: 'CNTT1-K15' },
            { code: '2310900007', name: 'Ngô Thanh Hà', dob: '2004-12-08', email: 'ha.nt23@university.edu.vn', fid: fMap['CNTT'], cid: cMap['CNTT1-K15'], cname: 'CNTT1-K15' },
            { code: '2310900008', name: 'Đỗ Quang Huy', dob: '2004-04-14', email: 'huy.dq23@university.edu.vn', fid: fMap['CNTT'], cid: cMap['CNTT1-K15'], cname: 'CNTT1-K15' },
            // Lớp CNTT2-K15
            { code: '2310900021', name: 'Bùi Tuấn Kiệt', dob: '2004-08-18', email: 'kiet.bt23@university.edu.vn', fid: fMap['CNTT'], cid: cMap['CNTT2-K15'], cname: 'CNTT2-K15' },
            { code: '2310900022', name: 'Dương Thúy Linh', dob: '2004-02-27', email: 'linh.dt23@university.edu.vn', fid: fMap['CNTT'], cid: cMap['CNTT2-K15'], cname: 'CNTT2-K15' },
            { code: '2310900023', name: 'Lý Quốc Mạnh', dob: '2004-10-10', email: 'manh.lq23@university.edu.vn', fid: fMap['CNTT'], cid: cMap['CNTT2-K15'], cname: 'CNTT2-K15' },
            { code: '2310900024', name: 'Phan Tuyết Mai', dob: '2004-06-25', email: 'mai.pt23@university.edu.vn', fid: fMap['CNTT'], cid: cMap['CNTT2-K15'], cname: 'CNTT2-K15' },
            { code: '2310900025', name: 'Trịnh Trọng Nam', dob: '2004-12-01', email: 'nam.tt23@university.edu.vn', fid: fMap['CNTT'], cid: cMap['CNTT2-K15'], cname: 'CNTT2-K15' },
            { code: '2310900026', name: 'Đặng Yến Nhi', dob: '2004-03-09', email: 'nhi.dy23@university.edu.vn', fid: fMap['CNTT'], cid: cMap['CNTT2-K15'], cname: 'CNTT2-K15' },
            // Lớp KTPM1-K15
            { code: '2310900041', name: 'Hồ Hữu Phước', dob: '2004-09-15', email: 'phuoc.hh23@university.edu.vn', fid: fMap['CNTT'], cid: cMap['KTPM1-K15'], cname: 'KTPM1-K15' },
            { code: '2310900042', name: 'Nguyễn Như Quỳnh', dob: '2004-11-20', email: 'quynh.nn23@university.edu.vn', fid: fMap['CNTT'], cid: cMap['KTPM1-K15'], cname: 'KTPM1-K15' },
            { code: '2310900043', name: 'Tạ Minh Quân', dob: '2004-04-02', email: 'quan.tm23@university.edu.vn', fid: fMap['CNTT'], cid: cMap['KTPM1-K15'], cname: 'KTPM1-K15' },
            { code: '2310900044', name: 'Cao Ngọc Sơn', dob: '2004-07-17', email: 'son.cn23@university.edu.vn', fid: fMap['CNTT'], cid: cMap['KTPM1-K15'], cname: 'KTPM1-K15' },
            { code: '2310900045', name: 'Đoàn Thị Thảo', dob: '2004-01-30', email: 'thao.dt23@university.edu.vn', fid: fMap['CNTT'], cid: cMap['KTPM1-K15'], cname: 'KTPM1-K15' },
            // Lớp ATTT1-K15
            { code: '2310900061', name: 'Mai Quốc Thịnh', dob: '2004-08-04', email: 'thinh.mq23@university.edu.vn', fid: fMap['ATTT'], cid: cMap['ATTT1-K15'], cname: 'ATTT1-K15' },
            { code: '2310900062', name: 'Lương Hoài Thương', dob: '2004-10-28', email: 'thuong.lh23@university.edu.vn', fid: fMap['ATTT'], cid: cMap['ATTT1-K15'], cname: 'ATTT1-K15' },
            { code: '2310900063', name: 'Vũ Đức Tiến', dob: '2004-05-19', email: 'tien.vd23@university.edu.vn', fid: fMap['ATTT'], cid: cMap['ATTT1-K15'], cname: 'ATTT1-K15' },
            { code: '2310900064', name: 'Trương Cẩm Tú', dob: '2004-03-24', email: 'tu.tc23@university.edu.vn', fid: fMap['ATTT'], cid: cMap['ATTT1-K15'], cname: 'ATTT1-K15' },
            { code: '2310900065', name: 'Nguyễn Hoàng Việt', dob: '2004-06-11', email: 'viet.nh23@university.edu.vn', fid: fMap['ATTT'], cid: cMap['ATTT1-K15'], cname: 'ATTT1-K15' },
            // Lớp DTVT1-K14
            { code: '2210900081', name: 'Nguyễn Anh Tuấn', dob: '2003-02-14', email: 'tuan.na22@university.edu.vn', fid: fMap['DTVT'], cid: cMap['DTVT1-K14'], cname: 'DTVT1-K14' },
            { code: '2210900082', name: 'Trần Văn Vinh', dob: '2003-09-09', email: 'vinh.tv22@university.edu.vn', fid: fMap['DTVT'], cid: cMap['DTVT1-K14'], cname: 'DTVT1-K14' },
            { code: '2210900083', name: 'Lê Thùy Vy', dob: '2003-12-16', email: 'vy.lt22@university.edu.vn', fid: fMap['DTVT'], cid: cMap['DTVT1-K14'], cname: 'DTVT1-K14' },
            // Lớp QTKD1-K15 & KETOAN1-K15
            { code: '2310900091', name: 'Đỗ Phương Anh', dob: '2004-04-08', email: 'anh.dp23@university.edu.vn', fid: fMap['QTKD'], cid: cMap['QTKD1-K15'], cname: 'QTKD1-K15' },
            { code: '2310900092', name: 'Hoàng Bảo Châu', dob: '2004-10-12', email: 'chau.hb23@university.edu.vn', fid: fMap['QTKD'], cid: cMap['QTKD1-K15'], cname: 'QTKD1-K15' },
            { code: '2310900095', name: 'Nguyễn Khánh Linh', dob: '2004-07-03', email: 'linh.nk23@university.edu.vn', fid: fMap['KTDN'], cid: cMap['KETOAN1-K15'], cname: 'KETOAN1-K15' }
        ];

        for (const st of additionalStudents) {
            const [existing] = await conn.execute('SELECT id FROM students WHERE student_code = ?', [st.code]);
            if (existing.length > 0) {
                await conn.execute(
                    `UPDATE students SET full_name = ?, date_of_birth = ?, email = ?, faculty_id = ?, class_id = ?, class_name = ?, status = 'Active' WHERE id = ?`,
                    [st.name, st.dob, st.email, st.fid, st.cid, st.cname, existing[0].id]
                );
            } else {
                await conn.execute(
                    `INSERT INTO students (student_code, full_name, date_of_birth, faculty_id, class_id, class_name, email, status) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')`,
                    [st.code, st.name, st.dob, st.fid, st.cid, st.cname, st.email]
                );
            }
        }

        const [allStudents] = await conn.query('SELECT id, student_code, full_name, class_id FROM students');
        console.log(`[+] Đã cập nhật tổng cộng ${allStudents.length} sinh viên thực tế trong hệ thống.`);

        console.log('[7/8] Thiết lập Lịch Học Phần & Ghi danh & Điểm danh mẫu thực tế...');
        // Tạo các mốc thời gian động theo ngày hôm nay
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const todayStr = `${y}-${m}-${d}`;

        // Hàm tính offset ngày (VD: -1 ngày, +1 ngày)
        const getOffsetDateStr = (offsetDays) => {
            const dt = new Date(now);
            dt.setDate(dt.getDate() + offsetDays);
            return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
        };

        const schedulesBlueprint = [
            // 1. Ca học ĐANG DIỄN RA HÔM NAY (Active Session) - Môn Thị giác Máy tính
            {
                crs: crsMap['INT1434'],
                cls: cMap['CNTT1-K15'],
                rm: rMap['LAB02'],
                sh: sMap['CA3'],
                rName: 'Phòng Lab AI 02 - Tòa C',
                tName: 'TS. Nguyễn Công Tùng',
                start: `${todayStr} 13:00:00`,
                end: `${todayStr} 15:15:00`,
                rec: 1, dow: 3, pStart: 7, pEnd: 9,
                isActiveNow: true
            },
            // 2. Ca học SẮP DIỄN RA HÔM NAY (Upcoming Session) - Môn Lập trình Web
            {
                crs: crsMap['INT1332'],
                cls: cMap['CNTT1-K15'],
                rm: rMap['LAB01'],
                sh: sMap['CA4'],
                rName: 'Phòng Thực Hành 01 - Tòa C',
                tName: 'ThS. Trần Tiến Anh',
                start: `${todayStr} 15:30:00`,
                end: `${todayStr} 17:45:00`,
                rec: 1, dow: 3, pStart: 10, pEnd: 12,
                isActiveNow: false
            },
            // 3. Ca học SÁNG NAY ĐÃ KẾT THÚC - Môn Cấu trúc Dữ liệu
            {
                crs: crsMap['INT1306'],
                cls: cMap['CNTT2-K15'],
                rm: rMap['A201'],
                sh: sMap['CA1'],
                rName: 'Giảng đường 201 - Tòa A',
                tName: 'TS. Lục Văn Sơn',
                start: `${todayStr} 07:00:00`,
                end: `${todayStr} 09:15:00`,
                rec: 1, dow: 3, pStart: 1, pEnd: 3,
                isActiveNow: false
            },
            // 4. Ca học HÔM QUA (Past) - Môn Trí tuệ Nhân tạo
            {
                crs: crsMap['INT1340'],
                cls: cMap['KTPM1-K15'],
                rm: rMap['A205'],
                sh: sMap['CA2'],
                rName: 'Giảng đường 205 - Tòa A',
                tName: 'PGS.TS. Lê Thị Mai Hoa',
                start: `${getOffsetDateStr(-1)} 09:30:00`,
                end: `${getOffsetDateStr(-1)} 11:45:00`,
                rec: 1, dow: 2, pStart: 4, pEnd: 6,
                isActiveNow: false
            },
            // 5. Ca học HÔM KIA (Past) - Môn An toàn Thông tin
            {
                crs: crsMap['SEC1201'],
                cls: cMap['ATTT1-K15'],
                rm: rMap['B402'],
                sh: sMap['CA3'],
                rName: 'Phòng học 402 - Tòa B',
                tName: 'TS. Vũ Mạnh Hùng',
                start: `${getOffsetDateStr(-2)} 13:00:00`,
                end: `${getOffsetDateStr(-2)} 15:15:00`,
                rec: 1, dow: 1, pStart: 7, pEnd: 9,
                isActiveNow: false
            },
            // 6. Ca học NGÀY MAI (Upcoming) - Môn Quản trị Doanh nghiệp
            {
                crs: crsMap['BUS1010'],
                cls: cMap['QTKD1-K15'],
                rm: rMap['A201'],
                sh: sMap['CA2'],
                rName: 'Giảng đường 201 - Tòa A',
                tName: 'ThS. Trần Hoàng Nam',
                start: `${getOffsetDateStr(1)} 09:30:00`,
                end: `${getOffsetDateStr(1)} 11:45:00`,
                rec: 1, dow: 4, pStart: 4, pEnd: 6,
                isActiveNow: false
            }
        ];

        // Đảm bảo check_in_time cho phép NULL (đối với sinh viên vắng mặt)
        try {
            await conn.query('ALTER TABLE class_attendance MODIFY COLUMN check_in_time DATETIME NULL');
        } catch (e) {}

        // Xóa các bảng dữ liệu cũ liên quan để đồng bộ sạch
        await conn.query('DELETE FROM class_attendance');
        await conn.query('DELETE FROM enrollments');
        await conn.query('DELETE FROM class_schedules');

        for (const sc of schedulesBlueprint) {
            const [res] = await conn.execute(
                `INSERT INTO class_schedules 
                 (course_id, class_id, room_id, shift_id, room_name, teacher_name, start_time, end_time, is_recurring, day_of_week, period_start, period_end, week_from, week_to) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [sc.crs, sc.cls, sc.rm, sc.sh, sc.rName, sc.tName, sc.start, sc.end, sc.rec, sc.dow, sc.pStart, sc.pEnd, '2026-09-01', '2026-12-31']
            );
            const scheduleId = res.insertId;

            // Tìm danh sách sinh viên thuộc lớp chính của ca học này
            const enrolledStudents = allStudents.filter(st => st.class_id === sc.cls);
            // Thêm 1 sinh viên học ghép/học lại
            const retakeStudent = allStudents.find(st => st.class_id !== sc.cls);

            const allEnrolled = [...enrolledStudents];
            if (retakeStudent) allEnrolled.push(retakeStudent);

            for (const st of allEnrolled) {
                const isRetake = (st.id === retakeStudent?.id);
                await conn.execute(
                    `INSERT INTO enrollments (student_id, schedule_id, enrollment_type) VALUES (?, ?, ?)`,
                    [st.id, scheduleId, isRetake ? 'retake' : 'regular']
                );

                // Nếu là ca học trong quá khứ hoặc ca sáng nay hoặc ca đang diễn ra -> sinh dữ liệu điểm danh
                const isPastOrToday = new Date(sc.start) <= new Date();
                if (isPastOrToday) {
                    const rnd = Math.random();
                    const checkInMinutes = Math.floor(Math.random() * 15); // quẹt mặt 0 - 15 phút đầu giờ
                    const checkInDate = new Date(sc.start);
                    checkInDate.setMinutes(checkInDate.getMinutes() + checkInMinutes);
                    const checkInStr = checkInDate.toISOString().slice(0, 19).replace('T', ' ');

                    const checkOutDate = new Date(sc.end);
                    checkOutDate.setMinutes(checkOutDate.getMinutes() - Math.floor(Math.random() * 5));
                    const checkOutStr = checkOutDate.toISOString().slice(0, 19).replace('T', ' ');

                    if (rnd > 0.15) {
                        // 85% Sinh viên có mặt điểm danh đầy đủ
                        const confScore = +(0.88 + Math.random() * 0.10).toFixed(4);
                        await conn.execute(
                            `INSERT INTO class_attendance 
                             (student_id, schedule_id, check_in_time, check_in_confidence, check_in_status, check_out_time, check_out_confidence, check_out_status, status, confidence_score, notes) 
                             VALUES (?, ?, ?, ?, 'Present', ?, ?, 'Present', 'Completed', ?, 'Điểm danh khuôn mặt AI DeepFace chuẩn xác')`,
                            [st.id, scheduleId, checkInStr, confScore, checkOutStr, confScore, confScore]
                        );
                    } else if (rnd > 0.05) {
                        // 10% Sinh viên đi muộn
                        const lateCheckInDate = new Date(sc.start);
                        lateCheckInDate.setMinutes(lateCheckInDate.getMinutes() + 20);
                        const lateCheckInStr = lateCheckInDate.toISOString().slice(0, 19).replace('T', ' ');
                        const confScore = +(0.85 + Math.random() * 0.08).toFixed(4);

                        await conn.execute(
                            `INSERT INTO class_attendance 
                             (student_id, schedule_id, check_in_time, check_in_confidence, check_in_status, check_out_time, check_out_confidence, check_out_status, status, confidence_score, notes) 
                             VALUES (?, ?, ?, ?, 'Late', ?, ?, 'Present', 'Completed', ?, 'Sinh viên đến muộn 20 phút')`,
                            [st.id, scheduleId, lateCheckInStr, confScore, checkOutStr, confScore, confScore]
                        );
                    } else {
                        // 5% Vắng mặt
                        await conn.execute(
                            `INSERT INTO class_attendance 
                             (student_id, schedule_id, check_in_status, status, notes) 
                             VALUES (?, ?, 'Absent', 'Absent', 'Không có mặt tại phòng học')`,
                            [st.id, scheduleId]
                        );
                    }
                }
            }
        }

        console.log('[8/8] Thiết lập Lịch Thi Chuẩn, Sơ đồ chỗ ngồi & Điểm danh phòng thi...');
        await conn.query('DELETE FROM exam_attendance');
        await conn.query('DELETE FROM exam_eligibility');
        await conn.query('DELETE FROM exam_schedules');

        const examBlueprint = [
            // 1. Ca thi Kết thúc học phần Thị giác Máy tính - Phòng B401
            {
                crs: crsMap['INT1434'],
                cls: cMap['CNTT1-K15'],
                rm: rMap['B401'],
                rName: 'Phòng thi 401 - Tòa B',
                time: `${todayStr} 14:00:00`,
                endTime: `${todayStr} 15:30:00`,
                dur: 90, rows: 6, cols: 8
            },
            // 2. Ca thi Môn Cấu trúc Dữ liệu - Phòng A201
            {
                crs: crsMap['INT1306'],
                cls: cMap['CNTT2-K15'],
                rm: rMap['A201'],
                rName: 'Giảng đường 201 - Tòa A',
                time: `${getOffsetDateStr(2)} 08:30:00`,
                endTime: `${getOffsetDateStr(2)} 10:00:00`,
                dur: 90, rows: 5, cols: 10
            },
            // 3. Ca thi Môn An toàn Thông tin - Hội trường HT-A1
            {
                crs: crsMap['SEC1201'],
                cls: cMap['ATTT1-K15'],
                rm: rMap['HT-A1'],
                rName: 'Hội Trường Lớn A1',
                time: `${getOffsetDateStr(4)} 13:30:00`,
                endTime: `${getOffsetDateStr(4)} 15:00:00`,
                dur: 90, rows: 8, cols: 8
            }
        ];

        for (const ex of examBlueprint) {
            const [res] = await conn.execute(
                `INSERT INTO exam_schedules 
                 (course_id, class_id, room_id, exam_room, exam_time, exam_end_time, duration_minutes, seating_rows, seating_cols, disabled_seats) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '[]')`,
                [ex.crs, ex.cls, ex.rm, ex.rName, ex.time, ex.endTime, ex.dur, ex.rows, ex.cols]
            );
            const examId = res.insertId;

            // Phân bổ chỗ ngồi cho từng thí sinh (hàng, cột xen kẽ để chống quay cóp)
            const examStudents = allStudents.filter(st => st.class_id === ex.cls);
            let row = 0;
            let col = 0;

            for (let i = 0; i < examStudents.length; i++) {
                const st = examStudents[i];
                await conn.execute(
                    `INSERT INTO exam_eligibility (exam_schedule_id, student_id, student_type, is_eligible, seat_row, seat_col, notes) 
                     VALUES (?, ?, 'regular', 1, ?, ?, ?)`,
                    [examId, st.id, row, col, `SBD: ${String(i + 1).padStart(3, '0')}`]
                );

                // Nếu ca thi đã/đang diễn ra -> tạo dữ liệu quẹt mặt vào phòng thi
                if (new Date(ex.time) <= new Date()) {
                    const checkInTime = new Date(ex.time);
                    checkInTime.setMinutes(checkInTime.getMinutes() - (15 - Math.floor(Math.random() * 10)));
                    const checkInTimeStr = checkInTime.toISOString().slice(0, 19).replace('T', ' ');

                    await conn.execute(
                        `INSERT INTO exam_attendance (student_id, exam_schedule_id, check_in_time, is_verified, seat_row, seat_col) 
                         VALUES (?, ?, ?, 1, ?, ?)`,
                        [st.id, examId, checkInTimeStr, row, col]
                    );
                }

                // Cách 1 ghế để giãn cách phòng thi
                col += 2;
                if (col >= ex.cols) {
                    col = (row % 2 === 0) ? 1 : 0;
                    row++;
                }
            }
        }

        console.log('\n================================================================');
        console.log('✅ ĐÃ NẠP & CHUẨN HÓA DỮ LIỆU THỰC TẾ CHO TOÀN BỘ HỆ THỐNG!');
        console.log('================================================================');

        // Báo cáo số liệu tổng kết
        const [facultiesCount] = await conn.query('SELECT COUNT(*) as c FROM faculties');
        const [classesCount] = await conn.query('SELECT COUNT(*) as c FROM classes');
        const [roomsCount] = await conn.query('SELECT COUNT(*) as c FROM rooms');
        const [shiftsCount] = await conn.query('SELECT COUNT(*) as c FROM study_shifts');
        const [coursesCount] = await conn.query('SELECT COUNT(*) as c FROM courses');
        const [studentsCount] = await conn.query('SELECT COUNT(*) as c FROM students');
        const [schedulesCount] = await conn.query('SELECT COUNT(*) as c FROM class_schedules');
        const [attendanceCount] = await conn.query('SELECT COUNT(*) as c FROM class_attendance');
        const [examSchedulesCount] = await conn.query('SELECT COUNT(*) as c FROM exam_schedules');
        const [examAttendanceCount] = await conn.query('SELECT COUNT(*) as c FROM exam_attendance');

        console.log(`- Khoa / Viện:       ${facultiesCount[0].c}`);
        console.log(`- Lớp sinh viên:     ${classesCount[0].c}`);
        console.log(`- Phòng học / thi:   ${roomsCount[0].c}`);
        console.log(`- Ca học chuẩn:      ${shiftsCount[0].c}`);
        console.log(`- Môn học:           ${coursesCount[0].c}`);
        console.log(`- Sinh viên:         ${studentsCount[0].c}`);
        console.log(`- Lịch học phần:     ${schedulesCount[0].c}`);
        console.log(`- Bản ghi điểm danh: ${attendanceCount[0].c}`);
        console.log(`- Lịch thi:          ${examSchedulesCount[0].c}`);
        console.log(`- Điểm danh thi:     ${examAttendanceCount[0].c}`);
        console.log('================================================================\n');

    } catch (err) {
        console.error('❌ Lỗi trong quá trình nạp dữ liệu:', err);
    } finally {
        await conn.end();
    }
}

if (require.main === module) {
    seedRealisticData();
}

module.exports = seedRealisticData;
