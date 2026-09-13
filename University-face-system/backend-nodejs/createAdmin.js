require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createAdmin() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'appuser',
        password: 'apppassword',
        database: 'face_attendance_db',
    });

    try {
        const email = 'admin@system.com';
        const password = 'admin'; // Password is 'admin'
        const full_name = 'Super Admin';

        // Check if exists
        const [existing] = await connection.execute('SELECT * FROM administrators WHERE email = ?', [email]);
        if (existing.length > 0) {
            console.log('Account already exists! Updating it to be verified admin...');
            const passwordHash = await bcrypt.hash(password, 12);
            await connection.execute(
                `UPDATE administrators SET password = ?, role = 'admin', is_email_verified = 1 WHERE email = ?`,
                [passwordHash, email]
            );
            console.log('Account updated successfully.');
        } else {
            console.log('Creating new admin account...');
            const passwordHash = await bcrypt.hash(password, 12);
            await connection.execute(
                `INSERT INTO administrators (full_name, email, password, role, is_email_verified) 
                 VALUES (?, ?, ?, 'admin', 1)`,
                [full_name, email, passwordHash]
            );
            console.log('Admin account created successfully.');
        }
        
        console.log(`\n--- CREDENTIALS ---`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`-------------------\n`);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

createAdmin();
