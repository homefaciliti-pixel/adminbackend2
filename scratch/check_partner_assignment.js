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
    // 1. Search in node_orders by serviceRequestNumber
    const orderSearch = '%2026-0663%';
    const [nodeO] = await connection.query("SELECT * FROM node_orders WHERE serviceRequestNumber LIKE ?", [orderSearch]);
    console.log('node_orders matching #REQ 2026-0663:');
    nodeO.forEach(r => console.log(r));

    // 2. Search in node_orders_v2 by id or description or serviceName
    const [ordersV2] = await connection.query("SELECT * FROM node_orders_v2 WHERE id = 663 OR id LIKE ?", [orderSearch]);
    console.log('\nnode_orders_v2 matching 663 or search:');
    ordersV2.forEach(r => console.log(r));

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
