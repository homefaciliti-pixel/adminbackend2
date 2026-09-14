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
    console.log('Searching for Order ID 595 in node_orders_v2...');
    const [rowsV2] = await connection.query('SELECT * FROM node_orders_v2 WHERE id = ?', [595]);
    if (rowsV2.length > 0) {
      console.log('Found order details:', rowsV2[0]);
    } else {
      console.log('Order ID 595 not found in node_orders_v2.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
