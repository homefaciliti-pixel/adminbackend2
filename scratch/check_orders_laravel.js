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
    const [laravelO] = await connection.query("SELECT * FROM orders WHERE id = 663");
    console.log('Laravel orders table row for ID 663:');
    console.log(laravelO[0]);

    const [maxId] = await connection.query("SELECT MAX(id) FROM orders");
    console.log('Max ID in Laravel orders table:', maxId[0]);

    // Let's search by user phone 9636744197 (from node_orders_v2 row 663) in Laravel orders table
    const [userOrders] = await connection.query("SELECT id, user_id, service_name, price, status, driver_id FROM orders WHERE user_id IN (SELECT id FROM users WHERE mobile_number LIKE '%9636744197%') LIMIT 5");
    console.log('\nLaravel orders matching user phone:');
    userOrders.forEach(o => console.log(o));

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
