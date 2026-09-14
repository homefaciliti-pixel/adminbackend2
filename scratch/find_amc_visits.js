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
    const codes = ['860487', '778857'];
    
    for (const code of codes) {
      console.log(`\nSearching for code/ID: ${code}`);
      
      // Try search by ID
      const [byId] = await connection.query('SELECT * FROM node_amc_visits WHERE id = ?', [code]);
      console.log(`Search by id = ${code}:`, byId);

      // Try search by bookingCode
      const [byBookingCode] = await connection.query('SELECT * FROM node_amc_visits WHERE bookingCode = ? OR bookingCode LIKE ?', [code, `%${code}%`]);
      console.log(`Search by bookingCode = ${code}:`, byBookingCode);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
