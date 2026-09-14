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
    console.log('Searching for "591" in node_orders_v2...');
    const [orders] = await connection.query('SELECT * FROM node_orders_v2 LIMIT 1');
    if (orders.length === 0) {
      console.log('No orders found.');
      return;
    }

    const columns = Object.keys(orders[0]);
    let whereClauses = columns.map(col => `\`${col}\` LIKE ?`).join(' OR ');
    let params = columns.map(() => '%591%');

    const [matchingOrders] = await connection.query(`SELECT * FROM node_orders_v2 WHERE ${whereClauses}`, params);
    console.log(`Found ${matchingOrders.length} matching rows in node_orders_v2:`);
    matchingOrders.forEach(row => {
      console.log(row);
    });

    console.log('\nSearching for "591" in node_orders...');
    const [orders1] = await connection.query('SELECT * FROM node_orders LIMIT 1');
    if (orders1.length > 0) {
      const cols1 = Object.keys(orders1[0]);
      let where1 = cols1.map(col => `\`${col}\` LIKE ?`).join(' OR ');
      let params1 = cols1.map(() => '%591%');
      const [matchingOrders1] = await connection.query(`SELECT * FROM node_orders WHERE ${where1}`, params1);
      console.log(`Found ${matchingOrders1.length} matching rows in node_orders:`);
      matchingOrders1.forEach(row => {
        console.log(row);
      });
    }

  } catch (err) {
    console.error('Error running search:', err);
  } finally {
    await connection.end();
  }
}

run();
