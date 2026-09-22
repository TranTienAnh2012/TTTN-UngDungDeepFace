const mysql = require('./backend-nodejs/node_modules/mysql2/promise');
const bcrypt = require('./backend-nodejs/node_modules/bcryptjs');

async function checkPass() {
    try {
        const conn = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3306,
            user: 'root',
            password: 'rootpassword',
            database: 'face_attendance_db'
        });

        const [users] = await conn.query("SELECT email, password FROM administrators WHERE email = 'yunno255@gmail.com'");
        if (users.length > 0) {
            const hash = users[0].password;
            const passes = ['123456', 'admin', 'password', '12345678', 'yunno255', 'rootpassword', '1234', '123456789'];
            for (const p of passes) {
                if (await bcrypt.compare(p, hash)) {
                    console.log('MATCH FOUND! Password for yunno255@gmail.com is:', p);
                    await conn.end();
                    return;
                }
            }
            console.log('None of the test passwords matched for yunno255@gmail.com. Setting password to "123456"...');
            const newHash = await bcrypt.hash('123456', 12);
            await conn.query("UPDATE administrators SET password = ? WHERE email = 'yunno255@gmail.com'", [newHash]);
            console.log("Password for yunno255@gmail.com updated to: 123456");
        }
        await conn.end();
    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkPass();
