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
      "SELECT id, name, referral_code FROM node_partners LIMIT 20"
    );
    console.log('Sample partners from database:');
    console.log(rows);

    const [nullRows] = await connection.query(
      "SELECT COUNT(*) AS count FROM node_partners WHERE referral_code IS NULL OR referral_code = ''"
    );
    console.log('Partners with null or empty referral_code:', nullRows[0].count);

    const [totalRows] = await connection.query(
      "SELECT COUNT(*) AS count FROM node_partners"
    );
    console.log('Total partners in database:', totalRows[0].count);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
