const db = require('../backend-nodejs/src/config/db');
const bcrypt = require('../backend-nodejs/node_modules/bcryptjs');

async function update() {
    const hash = await bcrypt.hash('123456', 12);
    await db.execute("UPDATE administrators SET password = ? WHERE email = 'yunno255@gmail.com'", [hash]);
    console.log("SUCCESSFULLY UPDATED YUNNO255 PASSWORD TO 123456");
    process.exit(0);
}
update().catch(console.error);
