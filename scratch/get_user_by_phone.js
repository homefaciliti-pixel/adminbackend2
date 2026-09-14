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
    const [rows1] = await connection.query("SELECT id, name, mobile_number, status, payment_status, is_approval FROM users WHERE mobile_number = '8009073091'");
    console.log('User 8009073091 details:', rows1);

    const [rows2] = await connection.query("SELECT id, name, mobile_number, status, payment_status, is_approval FROM users WHERE mobile_number = '9462015852'");
    console.log('User 9462015852 details:', rows2);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
