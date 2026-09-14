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
    const [rows] = await connection.query("SELECT id, name, mobile, isPaid, isApproved FROM node_partners WHERE mobile = '8009073091'");
    console.log('Migrated partner in node_partners table:', rows);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
