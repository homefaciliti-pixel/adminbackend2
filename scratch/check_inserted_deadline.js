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
      "SELECT id, unlock_deadline FROM node_referrals WHERE referred_id = 999"
    );
    console.log('Inserted rows:', rows);

    // Clean up
    await connection.query("DELETE FROM node_referrals WHERE referred_id = 999");
    console.log('Cleanup completed.');
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
