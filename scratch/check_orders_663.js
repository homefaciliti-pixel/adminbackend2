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
    const [rows] = await connection.query("SELECT id, name, mobile, status, isApproved, isPaid FROM node_partners WHERE name LIKE '%hira%' OR mobile = '7597816095'");
    console.log('Hira details:');
    rows.forEach(r => console.log(r));

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
