const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  const referrerId = 176;

  try {
    const [rows] = await connection.query(
      "SELECT id, name, mobile, lockedWallet, availableWallet FROM node_partners WHERE id = ?",
      [referrerId]
    );
    console.log('Current wallet details for partner 176:', rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
