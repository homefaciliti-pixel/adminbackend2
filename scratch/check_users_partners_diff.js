const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  try {
    const [legacy] = await connection.query("SELECT id, name, mobile_number, email FROM users WHERE role_id = 2");
    console.log('Total legacy partners in users table:', legacy.length);

    let missing = [];
    for (const partner of legacy) {
      const [exists] = await connection.query("SELECT id FROM node_partners WHERE mobile = ? OR email = ?", [partner.mobile_number, partner.email]);
      if (exists.length === 0) {
        missing.push(partner);
      }
    }

    console.log('Legacy partners missing from node_partners table:', missing.length);
    console.log('First 10 missing legacy partners:', missing.slice(0, 10));
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
