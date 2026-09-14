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
    // Check all IDs around 595-610 in node_orders_v2
    console.log('Checking node_orders_v2 for IDs 590-610...');
    const [rows1] = await connection.query('SELECT id, userPhone, serviceName, status, cancelReason FROM node_orders_v2 WHERE id BETWEEN 590 AND 610 ORDER BY id');
    console.log('node_orders_v2:', rows1);

    // Check order_items around 598-602
    console.log('\nChecking order_items for IDs 590-610...');
    const [rows2] = await connection.query('SELECT id, order_id, service_name, status FROM order_items WHERE id BETWEEN 590 AND 610');
    console.log('order_items:', rows2);

    // Check orders (Laravel) for IDs 590-610
    console.log('\nChecking orders (Laravel) for IDs 250-280...');
    const [rows3] = await connection.query('SELECT id, order_number, amount, status FROM orders WHERE id BETWEEN 250 AND 280 ORDER BY id');
    console.log('orders:', rows3);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
