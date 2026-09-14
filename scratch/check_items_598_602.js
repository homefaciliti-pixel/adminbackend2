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
    console.log(`Checking order_items table for IDs: ${ids.join(', ')}...`);
    const [rows] = await connection.query('SELECT * FROM order_items WHERE id IN (?, ?, ?, ?, ?)', ids);
    console.log(`Found ${rows.length} rows in order_items:`);
    rows.forEach(r => {
      console.log(`- ID: ${r.id}, Order ID: ${r.order_id}, Service: ${r.service_name}, Status: ${r.status}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
