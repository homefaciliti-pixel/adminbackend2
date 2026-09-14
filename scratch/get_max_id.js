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
    const [[res]] = await connection.query('SELECT MAX(id) as maxId FROM node_orders_v2');
    console.log('Max ID in node_orders_v2:', res.maxId);
    
    const [rows] = await connection.query('SELECT id FROM node_orders_v2 ORDER BY id DESC LIMIT 5');
    console.log('Recent IDs:', rows);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
