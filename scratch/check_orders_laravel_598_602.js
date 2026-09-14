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
    const ids = [598, 599, 600, 601, 602];
    console.log(`Checking orders (Laravel) table for IDs: ${ids.join(', ')}...`);
    const [rows] = await connection.query('SELECT * FROM orders WHERE id IN (?, ?, ?, ?, ?)', ids);
    console.log(`Found ${rows.length} rows in orders:`);
    rows.forEach(r => {
      console.log(`- ID: ${r.id}, Order Number: ${r.order_number}, Amount: ${r.amount}, Status: ${r.status}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
