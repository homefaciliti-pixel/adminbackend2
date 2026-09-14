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
    const [orders] = await connection.query('SELECT * FROM orders WHERE id = 241');
    console.log('Order 241 details in orders table:', orders[0]);

    const [items] = await connection.query('SELECT * FROM order_items WHERE id = 299');
    console.log('Item 299 details in order_items table:', items[0]);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
