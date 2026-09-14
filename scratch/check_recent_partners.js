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
    const [rows] = await connection.query(
      "SELECT id, name, mobile, referredBy, referral_code, isApproved, createdAt FROM node_partners ORDER BY id DESC LIMIT 10"
    );
    console.log('Last 10 partners registered:');
    console.log(rows);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
