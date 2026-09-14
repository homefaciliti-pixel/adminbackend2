const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  const partnerId = 176;

  try {
    const [rows] = await connection.query(
      "SELECT id, name, mobile, email, category, city, state, isApproved, isPaid FROM node_partners WHERE id = ?",
      [partnerId]
    );
    console.log('Partner 176 Data:', rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
