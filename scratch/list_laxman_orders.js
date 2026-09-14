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
    const phone = '9414343434';
    console.log(`Checking orders in node_orders_v2 for phone ${phone}...`);
    const [rows] = await connection.query('SELECT * FROM node_orders_v2 WHERE userPhone = ?', [phone]);
    console.log(rows);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
