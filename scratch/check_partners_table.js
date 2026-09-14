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
    // First check actual column names in node_partners
    const [cols] = await connection.query('DESCRIBE node_partners');
    console.log('node_partners columns:', cols.map(c => c.Field));

    // Find Anil in node_partners
    console.log('\nAll partners named Anil:');
    const [partners] = await connection.query('SELECT * FROM node_partners WHERE name LIKE "%Anil%"');
    partners.forEach(p => console.log(p));

    // Check current status of order 595
    console.log('\nChecking order 595...');
    const [o] = await connection.query('SELECT id, serviceName, status, cancelReason FROM node_orders_v2 WHERE id = 595');
    console.log('Order 595:', o[0]);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
