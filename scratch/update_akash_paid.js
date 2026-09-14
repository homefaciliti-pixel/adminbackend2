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
    // 1. Update Hira isPaid to 1 in node_partners
    const [resNode] = await connection.query("UPDATE node_partners SET isPaid = 1 WHERE mobile = '7597816095'");
    console.log('node_partners Hira update rows affected:', resNode.affectedRows);

    // 2. Also check if there is an entry in users (Laravel) for this mobile
    const [resLaravel] = await connection.query("UPDATE users SET payment_status = '1' WHERE mobile_number = '7597816095' AND role_id = 2");
    console.log('users (Laravel) Hira update rows affected:', resLaravel.affectedRows);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
