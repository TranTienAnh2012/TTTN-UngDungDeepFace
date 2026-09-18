require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend-nodejs', '.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function ensureTableColumns(connection) {
    // 1. Check administrators table columns
    const [adminCols] = await connection.query("SHOW COLUMNS FROM administrators");
    const existingAdminColNames = adminCols.map(c => c.Field.toLowerCase());

    const neededAdminCols = [
        { name: 'email', def: "VARCHAR(255) NULL" },
        { name: 'role', def: "ENUM('user', 'admin', 'sales', 'teacher', 'manager', 'accountant') DEFAULT 'admin'" },
        { name: 'is_email_verified', def: "TINYINT(1) DEFAULT 0" },
        { name: 'email_verify_token', def: "VARCHAR(255) NULL" },
        { name: 'email_verify_expires', def: "DATETIME NULL" },
        { name: 'refresh_token_hash', def: "VARCHAR(255) NULL" },
        { name: 'password_reset_token_hash', def: "VARCHAR(255) NULL" },
        { name: 'password_reset_expires', def: "DATETIME NULL" },
        { name: 'last_login_at', def: "DATETIME NULL" },
        { name: 'updated_at', def: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" }
    ];

    for (const col of neededAdminCols) {
        if (!existingAdminColNames.includes(col.name.toLowerCase())) {
            console.log(`[*] Tu dong bo sung cot \`${col.name}\` cho bang \`administrators\`...`);
            try {
                await connection.query(`ALTER TABLE administrators ADD COLUMN ${col.name} ${col.def}`);
            } catch (err) {
                console.warn(`[!] Canh bao khi them cot ${col.name}:`, err.message);
            }
        }
    }

    // 2. Check class_attendance table columns for check-in & check-out support
    const [classAttCols] = await connection.query("SHOW COLUMNS FROM class_attendance");
    const existingClassAttColNames = classAttCols.map(c => c.Field.toLowerCase());

    const neededClassAttCols = [
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
    ];

    for (const col of neededClassAttCols) {
        if (!existingClassAttColNames.includes(col.name.toLowerCase())) {
            console.log(`[*] Tu dong bo sung cot \`${col.name}\` cho bang \`class_attendance\`...`);
            try {
                await connection.query(`ALTER TABLE class_attendance ADD COLUMN ${col.name} ${col.def}`);
            } catch (err) {
                console.warn(`[!] Canh bao khi them cot ${col.name} vao class_attendance:`, err.message);
            }
        }
    }
}

async function initializeDatabase() {
    const host = process.env.DB_HOST || '127.0.0.1';
    const port = Number(process.env.DB_PORT) || 3306;
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '123456';
    const dbName = process.env.DB_NAME || 'face_attendance_db';

    console.log('=====================================================');
    console.log('       KHOI TAO & KIEM TRA DATABASE MYSQL');
    console.log('=====================================================');
    console.log(`[*] Dang ket noi MySQL Host: ${host}:${port}, User: ${user}...`);

    let connection;
    try {
        connection = await mysql.createConnection({
            host,
            port,
            user,
            password,
            multipleStatements: true
        });
        console.log('[+] Ket noi toi MySQL Server thanh cong!');

        console.log(`[*] Tao Database \`${dbName}\` neu chua ton tai...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await connection.query(`USE \`${dbName}\`;`);
        console.log(`[+] Da chon Database \`${dbName}\`.`);

        const sqlPath = path.join(__dirname, 'init.sql');
        if (fs.existsSync(sqlPath)) {
            console.log(`[*] Dang thuc thi file khoi tao: ${sqlPath}`);
            const sqlContent = fs.readFileSync(sqlPath, 'utf8');
            await connection.query(sqlContent);
            console.log('[+] Da nap schema cac bang trong database thanh cong!');
        }

        await ensureTableColumns(connection);

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
