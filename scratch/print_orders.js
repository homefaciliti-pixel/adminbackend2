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
    console.log('--- orders ---');
    const [orders] = await connection.query('SELECT * FROM orders ORDER BY id DESC LIMIT 50');
    console.log(orders);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
