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
    console.log(`Checking orders in node_orders_v2 for IDs: ${ids.join(', ')}...`);
    const [rows] = await connection.query('SELECT * FROM node_orders_v2 WHERE id IN (?, ?, ?, ?, ?)', ids);
    console.log(`Found ${rows.length} rows:`);
    rows.forEach(r => {
      console.log(`- ID: ${r.id}, Service: ${r.serviceName}, Status: ${r.status}, CancelReason: ${r.cancelReason}, Phone: ${r.userPhone}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
