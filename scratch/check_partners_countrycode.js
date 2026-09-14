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
    const [rows] = await connection.query("SELECT id, name, mobile, countryCode FROM node_partners WHERE countryCode IS NULL OR countryCode = '' OR countryCode = '91'");
    console.log('Partners with missing or invalid countryCode:', rows.length);
    console.log('Sample rows:', rows.slice(0, 10));
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
