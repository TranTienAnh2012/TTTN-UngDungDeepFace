const path = require('path');
require('dotenv').config({ path: [path.join(__dirname, '.env'), path.join(__dirname, '..', '.env')] });
const fs = require('fs');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function ensureTableColumns(connection) {
    const tableSpecs = [
        {
            table: 'administrators',
            cols: [
                { name: 'email', def: "VARCHAR(255) NULL" },
                { name: 'username', def: "VARCHAR(50) NULL" },
                { name: 'role', def: "ENUM('user', 'admin', 'sales', 'teacher', 'manager', 'accountant') DEFAULT 'teacher'" },
                { name: 'is_email_verified', def: "TINYINT(1) DEFAULT 0" },
                { name: 'email_verify_token', def: "VARCHAR(255) NULL" },
                { name: 'email_verify_expires', def: "DATETIME NULL" },
                { name: 'refresh_token_hash', def: "VARCHAR(255) NULL" },
                { name: 'password_reset_token_hash', def: "VARCHAR(255) NULL" },
                { name: 'password_reset_expires', def: "DATETIME NULL" },
                { name: 'last_login_at', def: "DATETIME NULL" },
                { name: 'updated_at', def: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" }
            ]
        },
        {
            table: 'faculties',
            cols: [
                { name: 'faculty_code', def: "VARCHAR(50) NOT NULL" },
                { name: 'faculty_name', def: "VARCHAR(150) NOT NULL" },
                { name: 'description', def: "TEXT NULL" },
                { name: 'created_at', def: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" },
                { name: 'updated_at', def: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" }
            ]
        },
        {
            table: 'classes',
            cols: [
                { name: 'class_code', def: "VARCHAR(50) NOT NULL" },
                { name: 'class_name', def: "VARCHAR(150) NOT NULL" },
                { name: 'faculty_id', def: "BIGINT(20) NULL" },
                { name: 'academic_year', def: "VARCHAR(50) NULL" },
                { name: 'status', def: "VARCHAR(20) DEFAULT 'Active'" },
                { name: 'created_at', def: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" },
                { name: 'updated_at', def: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" }
            ]
        },
        {
            table: 'students',
            cols: [
                { name: 'faculty_id', def: "BIGINT(20) NULL" },
                { name: 'class_id', def: "BIGINT(20) NULL" },
                { name: 'email', def: "VARCHAR(150) NULL" },
                { name: 'status', def: "VARCHAR(20) DEFAULT 'Active'" },
                { name: 'created_at', def: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" }
            ]
        },
        {
            table: 'courses',
            cols: [
                { name: 'credits', def: "INT(11) DEFAULT 3" },
                { name: 'created_at', def: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" }
            ]
        },
        {
            table: 'rooms',
            cols: [
                { name: 'room_code', def: "VARCHAR(50) NOT NULL" },
                { name: 'room_name', def: "VARCHAR(100) NOT NULL" },
                { name: 'building', def: "VARCHAR(50) NULL" },
                { name: 'room_type', def: "ENUM('theory', 'lab', 'exam_hall') DEFAULT 'theory'" },
                { name: 'capacity', def: "INT(11) DEFAULT 40" },
                { name: 'seating_rows', def: "INT(11) NOT NULL DEFAULT 6" },
                { name: 'seating_cols', def: "INT(11) NOT NULL DEFAULT 8" },
                { name: 'disabled_seats', def: "TEXT NULL" },
                { name: 'status', def: "VARCHAR(20) DEFAULT 'Active'" },
                { name: 'created_at', def: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" },
                { name: 'updated_at', def: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" }
            ]
        },
        {
            table: 'study_shifts',
            cols: [
                { name: 'shift_code', def: "VARCHAR(20) NOT NULL" },
                { name: 'shift_name', def: "VARCHAR(50) NOT NULL" },
                { name: 'start_time', def: "TIME NOT NULL" },
                { name: 'end_time', def: "TIME NOT NULL" },
                { name: 'period_start', def: "TINYINT(2) NULL" },
                { name: 'period_end', def: "TINYINT(2) NULL" },
                { name: 'shift_type', def: "ENUM('morning', 'afternoon', 'evening') DEFAULT 'morning'" },
                { name: 'created_at', def: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" }
            ]
        },
        {
            table: 'class_schedules',
            cols: [
                { name: 'class_id', def: "BIGINT(20) NULL" },
                { name: 'room_id', def: "BIGINT(20) NULL" },
                { name: 'shift_id', def: "INT NULL" },
                { name: 'teacher_name', def: "VARCHAR(100) NULL" },
                { name: 'is_recurring', def: "TINYINT(1) DEFAULT 0 COMMENT '1 = lặp lại hàng tuần'" },
                { name: 'day_of_week', def: "TINYINT(1) NULL COMMENT '0=CN,1=T2,...,6=T7'" },
                { name: 'period_start', def: "TINYINT(1) NULL COMMENT 'Tiết bắt đầu (1-12)'" },
                { name: 'period_end', def: "TINYINT(1) NULL COMMENT 'Tiết kết thúc (1-12)'" },
                { name: 'week_from', def: "DATE NULL COMMENT 'Tuần bắt đầu học'" },
                { name: 'week_to', def: "DATE NULL COMMENT 'Tuần kết thúc học'" },
                { name: 'created_at', def: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" }
            ]
        },
        {
            table: 'enrollments',
            cols: [
                { name: 'enrollment_type', def: "ENUM('regular', 'retake', 'supplementary') DEFAULT 'regular'" }
            ]
        },
        {
            table: 'class_attendance',
            cols: [
                { name: 'check_in_time', def: "DATETIME NULL" },
                { name: 'check_in_confidence', def: "FLOAT NULL" },
                { name: 'check_in_status', def: "VARCHAR(50) DEFAULT 'Present'" },
                { name: 'check_out_time', def: "DATETIME NULL" },
                { name: 'check_out_confidence', def: "FLOAT NULL" },
                { name: 'check_out_status', def: "VARCHAR(50) NULL" },
                { name: 'status', def: "VARCHAR(50) DEFAULT 'Checked-in'" },
                { name: 'confidence_score', def: "FLOAT NULL" },
                { name: 'notes', def: "TEXT NULL" },
                { name: 'created_at', def: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" },
                { name: 'updated_at', def: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" }
            ]
        },
        {
            table: 'exam_schedules',
            cols: [
                { name: 'class_id', def: "BIGINT(20) NULL" },
                { name: 'room_id', def: "BIGINT(20) NULL" },
                { name: 'exam_end_time', def: "DATETIME NULL" },
                { name: 'duration_minutes', def: "INT(11) DEFAULT 90" },
                { name: 'disabled_seats', def: "TEXT NULL" }
            ]
        },
        {
            table: 'exam_eligibility',
            cols: [
                { name: 'student_type', def: "ENUM('regular', 'retake') DEFAULT 'regular'" },
                { name: 'notes', def: "VARCHAR(100) NULL" }
            ]
        }
    ];

    for (const spec of tableSpecs) {
        try {
            const [cols] = await connection.query(`SHOW COLUMNS FROM \`${spec.table}\``);
            const existingColNames = cols.map(c => c.Field.toLowerCase());

            for (const col of spec.cols) {
                if (!existingColNames.includes(col.name.toLowerCase())) {
                    console.log(`[*] Tự động bổ sung cột \`${col.name}\` cho bảng \`${spec.table}\`...`);
                    try {
                        await connection.query(`ALTER TABLE \`${spec.table}\` ADD COLUMN ${col.name} ${col.def}`);
                    } catch (err) {
                        console.warn(`[!] Cảnh báo khi thêm cột ${col.name} vào ${spec.table}:`, err.message);
                    }
                }
            }
        } catch (err) {
            console.warn(`[!] Không thể kiểm tra bảng ${spec.table}:`, err.message);
        }
    }
}

async function seedInitialData(connection) {
    // 1. Seed Faculties if empty
    let facultyMap = {};
    try {
        const [faculties] = await connection.query('SELECT COUNT(*) as total FROM faculties');
        if (faculties[0].total === 0) {
            console.log('[*] Đang nạp dữ liệu mẫu các Khoa / Viện...');
            const sampleFaculties = [
                { code: 'CNTT', name: 'Khoa Công Nghệ Thông Tin', desc: 'Đào tạo ngành Kỹ thuật Phần mềm, KHMT, ATTT, HTTT' },
                { code: 'DTVT', name: 'Khoa Điện Tử Viễn Thông', desc: 'Đào tạo ngành Kỹ thuật Điện tử, Viễn thông, IoT' },
                { code: 'QTKD', name: 'Khoa Quản Trị Kinh Doanh', desc: 'Đào tạo ngành Quản trị Kinh doanh, Marketing, Tài chính' }
            ];
            for (const f of sampleFaculties) {
                const [res] = await connection.execute(
                    'INSERT INTO faculties (faculty_code, faculty_name, description) VALUES (?, ?, ?)',
                    [f.code, f.name, f.desc]
                );
                facultyMap[f.code] = res.insertId;
            }
            console.log('[+] Đã nạp thành công 3 khoa mẫu.');
        } else {
            const [rows] = await connection.query('SELECT id, faculty_code FROM faculties');
            rows.forEach(r => { facultyMap[r.faculty_code] = r.id; });
        }
    } catch (e) {
        console.warn('[!] Cảnh báo seed faculties:', e.message);
    }

    // 2. Seed Classes if empty
    let classMap = {};
    try {
        const [classes] = await connection.query('SELECT COUNT(*) as total FROM classes');
        if (classes[0].total === 0) {
            console.log('[*] Đang nạp dữ liệu mẫu các Lớp sinh viên chính quy...');
            const cnttId = facultyMap['CNTT'] || null;
            const dtvtId = facultyMap['DTVT'] || null;
            const qtkdId = facultyMap['QTKD'] || null;

            const sampleClasses = [
                { code: 'CNTT1-K15', name: 'Công Nghệ Thông Tin 1 - Khóa 15', fid: cnttId, year: '2022-2026' },
                { code: 'CNTT2-K15', name: 'Công Nghệ Thông Tin 2 - Khóa 15', fid: cnttId, year: '2022-2026' },
                { code: 'DTVT1-K14', name: 'Điện Tử Viễn Thông 1 - Khóa 14', fid: dtvtId, year: '2021-2025' },
                { code: 'QTKD1-K15', name: 'Quản Trị Kinh Doanh 1 - Khóa 15', fid: qtkdId, year: '2022-2026' }
            ];
            for (const c of sampleClasses) {
                const [res] = await connection.execute(
                    'INSERT INTO classes (class_code, class_name, faculty_id, academic_year) VALUES (?, ?, ?, ?)',
                    [c.code, c.name, c.fid, c.year]
                );
                classMap[c.code] = res.insertId;
            }
            console.log('[+] Đã nạp thành công 4 lớp sinh viên mẫu.');
        } else {
            const [rows] = await connection.query('SELECT id, class_code FROM classes');
            rows.forEach(r => { classMap[r.class_code] = r.id; });
        }
    } catch (e) {
        console.warn('[!] Cảnh báo seed classes:', e.message);
    }

    // 3. Link existing students to class_id and faculty_id if missing
    try {
        const cnttClassId = classMap['CNTT1-K15'] || Object.values(classMap)[0] || null;
        const cnttFacultyId = facultyMap['CNTT'] || Object.values(facultyMap)[0] || null;
        if (cnttClassId || cnttFacultyId) {
            await connection.execute(
                'UPDATE students SET class_id = COALESCE(class_id, ?), faculty_id = COALESCE(faculty_id, ?) WHERE class_id IS NULL OR faculty_id IS NULL',
                [cnttClassId, cnttFacultyId]
            );
        }
    } catch (e) {
        console.warn('[!] Cảnh báo update student class link:', e.message);
    }

    // 4. Seed Rooms if empty
    try {
        const [rooms] = await connection.query('SELECT COUNT(*) as total FROM rooms');
        if (rooms[0].total === 0) {
            console.log('[*] Đang nạp dữ liệu mẫu các phòng học/phòng thi...');
            const sampleRooms = [
                { code: 'B401', name: 'Phòng thi 401 - Tòa B', building: 'Tòa B', type: 'exam_hall', capacity: 48, rows: 6, cols: 8, disabled: '[]' },
                { code: 'B402', name: 'Phòng học 402 - Tòa B', building: 'Tòa B', type: 'theory', capacity: 40, rows: 5, cols: 8, disabled: '[]' },
                { code: 'A205', name: 'Phòng lý thuyết 205 - Tòa A', building: 'Tòa A', type: 'theory', capacity: 50, rows: 5, cols: 10, disabled: '[]' },
                { code: 'LAB01', name: 'Phòng Thực Hành Máy Tính 01', building: 'Tòa C', type: 'lab', capacity: 36, rows: 6, cols: 6, disabled: '[]' },
            ];
            for (const r of sampleRooms) {
                await connection.execute(
                    'INSERT INTO rooms (room_code, room_name, building, room_type, capacity, seating_rows, seating_cols, disabled_seats) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [r.code, r.name, r.building, r.type, r.capacity, r.rows, r.cols, r.disabled]
                );
            }
            console.log('[+] Đã nạp thành công 4 phòng mẫu.');
        }
    } catch (e) {
        console.warn('[!] Cảnh báo seed rooms:', e.message);
    }

    // 5. Seed Study Shifts if empty
    try {
        const [shifts] = await connection.query('SELECT COUNT(*) as total FROM study_shifts');
        if (shifts[0].total === 0) {
            console.log('[*] Đang nạp dữ liệu mẫu các ca học chuẩn...');
            const sampleShifts = [
                { code: 'CA1', name: 'Ca 1 (Sáng)', start: '07:00:00', end: '09:15:00', p_start: 1, p_end: 3, type: 'morning' },
                { code: 'CA2', name: 'Ca 2 (Sáng)', start: '09:30:00', end: '11:45:00', p_start: 4, p_end: 6, type: 'morning' },
                { code: 'CA3', name: 'Ca 3 (Chiều)', start: '13:00:00', end: '15:15:00', p_start: 7, p_end: 9, type: 'afternoon' },
                { code: 'CA4', name: 'Ca 4 (Chiều)', start: '15:30:00', end: '17:45:00', p_start: 10, p_end: 12, type: 'afternoon' },
                { code: 'CA5', name: 'Ca 5 (Tối)', start: '18:00:00', end: '20:15:00', p_start: 13, p_end: 15, type: 'evening' }
            ];
            for (const s of sampleShifts) {
                await connection.execute(
                    'INSERT INTO study_shifts (shift_code, shift_name, start_time, end_time, period_start, period_end, shift_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [s.code, s.name, s.start, s.end, s.p_start, s.p_end, s.type]
                );
            }
            console.log('[+] Đã nạp thành công 5 ca học mẫu.');
        }
    } catch (e) {
        console.warn('[!] Cảnh báo seed study_shifts:', e.message);
    }
}

async function initializeDatabase() {
    const host = process.env.DB_HOST || '127.0.0.1';
    const port = Number(process.env.DB_PORT) || 3306;
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
    const dbName = process.env.DB_NAME || 'face_attendance_db';

    console.log('=====================================================');
    console.log('       KHOI TAO & KIEM TRA DATABASE MYSQL');
    console.log('=====================================================');
    console.log(`[*] Dang ket noi MySQL Host: ${host}:${port}, User: ${user}...`);

    let connection;
    try {
        // Step 1: Connect to MySQL server (without specific DB)
        connection = await mysql.createConnection({
            host,
            port,
            user,
            password,
            multipleStatements: true
        });
        console.log('[+] Ket noi toi MySQL Server thanh cong!');

        // Step 2: Create database if not exists
        console.log(`[*] Tao Database \`${dbName}\` neu chua ton tai...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await connection.query(`USE \`${dbName}\`;`);
        console.log(`[+] Da chon Database \`${dbName}\`.`);

        // Step 3: Read and execute init.sql
        const possibleSqlPaths = [
            path.join(__dirname, '..', 'database', 'init.sql'),
            path.join(__dirname, 'database', 'init.sql'),
            path.join(__dirname, 'init.sql')
        ];

        let sqlPath = possibleSqlPaths.find(p => fs.existsSync(p));
        if (sqlPath) {
            console.log(`[*] Dang thuc thi file khoi tao: ${sqlPath}`);
            const sqlContent = fs.readFileSync(sqlPath, 'utf8');
            
            // Execute SQL script
            await connection.query(sqlContent);
            console.log('[+] Da nap schema cac bang trong database thanh cong!');
        } else {
            console.log('[!] Khong tim thay file init.sql, bo qua buoc nap schema.');
        }

        // Ensure columns in existing tables are up to date
        await ensureTableColumns(connection);

        // Seed initial data
        await seedInitialData(connection);

        // Step 4: Verify tables
        const [tables] = await connection.query('SHOW TABLES;');
        console.log(`\n[+] Danh sach cac bang hien co (${tables.length} bang):`);
        tables.forEach(t => {
            const tableName = Object.values(t)[0];
            console.log(`    - ${tableName}`);
        });

        console.log('\n[*] Kiem tra & khoi tao tai khoan Super Admin...');
        const adminEmail = 'admin@system.com';
        const adminUsername = 'admin';
        const adminPassword = 'admin';
        const adminFullName = 'Super Admin';

        const [existingAdmins] = await connection.execute(
            'SELECT id, email, username, role, is_email_verified FROM administrators WHERE email = ? OR username = ?',
            [adminEmail, adminUsername]
        );

        const passwordHash = await bcrypt.hash(adminPassword, 12);

        if (existingAdmins.length > 0) {
            await connection.execute(
                `UPDATE administrators SET username = ?, email = ?, password = ?, role = 'admin', is_email_verified = 1 WHERE id = ?`,
                [adminUsername, adminEmail, passwordHash, existingAdmins[0].id]
            );
            console.log('[+] Tai khoan Admin da ton tai -> Da cap nhat mat khau va quyen admin thanh cong!');
        } else {
            await connection.execute(
                `INSERT INTO administrators (username, full_name, email, password, role, is_email_verified) 
                 VALUES (?, ?, ?, ?, 'admin', 1)`,
                [adminUsername, adminFullName, adminEmail, passwordHash]
            );
            console.log('[+] Da tao moi tai khoan Super Admin thanh cong!');
        }

        console.log('\n=====================================================');
        console.log('       THONG TIN DANG NHAP HE THONG');
        console.log('=====================================================');
        console.log(`URL Web:        http://localhost:5173`);
        console.log(`Email Admin:    ${adminEmail}`);
        console.log(`Password Admin: ${adminPassword}`);
        console.log('=====================================================\n');

    } catch (error) {
        console.error('\n[X] LOI KHI KHOI TAO DATABASE:');
        if (error.code === 'ECONNREFUSED') {
            console.error(`- Khong the ket noi toi MySQL tai ${host}:${port}.`);
            console.error('- Vui long dam bao dich vu MySQL (hoac XAMPP/Laragon) dang chay!');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error(`- Sai User hoac Password MySQL (User: ${user}).`);
            console.error('- Vui long kiem tra file .env');
        } else {
            console.error('-', error.message);
        }
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

initializeDatabase();
