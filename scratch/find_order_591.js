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
    console.log('Searching for Order ID 591 in node_orders_v2...');
    const [rowsV2] = await connection.query('SELECT * FROM node_orders_v2 WHERE id = ?', [591]);
    if (rowsV2.length > 0) {
      console.log('Found in node_orders_v2:', rowsV2[0]);
    } else {
      console.log('Not found in node_orders_v2.');
    }

    console.log('Searching for Order ID 591 in node_orders...');
    const [rowsV1] = await connection.query('SELECT * FROM node_orders WHERE id = ?', [591]);
    if (rowsV1.length > 0) {
      console.log('Found in node_orders:', rowsV1[0]);
    } else {
      console.log('Not found in node_orders.');
    }

    console.log('Searching for Order ID 591 in orders...');
    try {
      const [rowsOrig] = await connection.query('SELECT * FROM orders WHERE id = ?', [591]);
      if (rowsOrig.length > 0) {
        console.log('Found in orders:', rowsOrig[0]);
      } else {
        console.log('Not found in orders.');
      }
    } catch (e) {
      console.log('orders table query failed:', e.message);
    }

  } catch (err) {
    console.error('Error running search:', err);
  } finally {
    await connection.end();
  }
}

run();
