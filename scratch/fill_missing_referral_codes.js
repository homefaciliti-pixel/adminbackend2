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
    const [nullRowsBefore] = await connection.query(
      "SELECT COUNT(*) AS count FROM node_partners WHERE referral_code IS NULL OR referral_code = ''"
    );
    console.log('Null or empty referral codes BEFORE update:', nullRowsBefore[0].count);

    const [upRes] = await connection.query(
      `UPDATE node_partners 
       SET referral_code = CONCAT('HF', LPAD(id, 6, '0')) 
       WHERE referral_code IS NULL OR referral_code = ''`
    );
    console.log(`Updated node_partners table: ${upRes.affectedRows} row(s) updated.`);

    const [nullRowsAfter] = await connection.query(
      "SELECT COUNT(*) AS count FROM node_partners WHERE referral_code IS NULL OR referral_code = ''"
    );
    console.log('Null or empty referral codes AFTER update:', nullRowsAfter[0].count);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
