const path = require('path');
require('dotenv').config({ path: [path.join(__dirname, '.env'), path.join(__dirname, '..', '.env')] });
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createAdmin() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '123456',
        database: process.env.DB_NAME || 'face_attendance_db',
    });

    try {
        const email = 'admin@system.com';
        const password = 'admin'; // Password is 'admin'
        const full_name = 'Super Admin';

        const username = 'admin';

        // Check if exists
        const [existing] = await connection.execute('SELECT * FROM administrators WHERE email = ? OR username = ?', [email, username]);
        if (existing.length > 0) {
            console.log('Account already exists! Updating it to be verified admin...');
            const passwordHash = await bcrypt.hash(password, 12);
            await connection.execute(
                `UPDATE administrators SET username = ?, email = ?, password = ?, role = 'admin', is_email_verified = 1 WHERE id = ?`,
                [username, email, passwordHash, existing[0].id]
            );
            console.log('Account updated successfully.');
        } else {
            console.log('Creating new admin account...');
            const passwordHash = await bcrypt.hash(password, 12);
            await connection.execute(
                `INSERT INTO administrators (username, full_name, email, password, role, is_email_verified) 
                 VALUES (?, ?, ?, ?, 'admin', 1)`,
                [username, full_name, email, passwordHash]
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
