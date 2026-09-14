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
    console.log('Searching for Service ID 595 in node_services...');
    const [rowsV2] = await connection.query('SELECT * FROM node_services WHERE id = ?', [595]);
    if (rowsV2.length > 0) {
      console.log('Found in node_services:', rowsV2[0]);
    } else {
      console.log('Not found in node_services.');
    }

    console.log('Searching for Service ID 595 in services...');
    try {
      const [rowsOrig] = await connection.query('SELECT * FROM services WHERE id = ?', [595]);
      if (rowsOrig.length > 0) {
        console.log('Found in services:', rowsOrig[0]);
      } else {
        console.log('Not found in services.');
      }
    } catch (e) {
      console.log('services table query failed:', e.message);
    }
  } catch (err) {
    console.error('Error running search:', err);
  } finally {
    await connection.end();
  }
}

run();
