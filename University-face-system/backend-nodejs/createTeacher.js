require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createTeacher() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'db',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root',
        database: process.env.DB_NAME || 'face_attendance_db',
    });

    try {
        const email = 'teacher@system.com';
        const password = 'lvson2005';
        const full_name = 'Giảng Viên Nguyễn Văn A';
        const username = 'teacher';

        // Check if exists
        const [existing] = await connection.execute('SELECT * FROM administrators WHERE email = ? OR username = ?', [email, username]);
        if (existing.length > 0) {
            console.log('Account already exists! Updating it to be verified teacher...');
            const passwordHash = await bcrypt.hash(password, 12);
            await connection.execute(
                `UPDATE administrators SET username = ?, email = ?, password = ?, role = 'teacher', is_email_verified = 1 WHERE id = ?`,
                [username, email, passwordHash, existing[0].id]
            );
            console.log('Teacher account updated successfully.');
        } else {
            console.log('Creating new teacher account...');
            const passwordHash = await bcrypt.hash(password, 12);
            await connection.execute(
                `INSERT INTO administrators (username, full_name, email, password, role, is_email_verified) 
                 VALUES (?, ?, ?, ?, 'teacher', 1)`,
                [username, full_name, email, passwordHash]
            );
            console.log('Teacher account created successfully.');
        }
        
        console.log(`\n--- TEACHER CREDENTIALS ---`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Role: teacher`);
        console.log(`---------------------------\n`);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

createTeacher();
