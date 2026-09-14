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
    const [rows] = await connection.query("SELECT isPaid, COUNT(*) as count FROM node_partners GROUP BY isPaid");
    console.log('Partners by isPaid in node_partners:');
    rows.forEach(r => console.log(r));

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
