const db = require('../db');

async function checkOrder681() {
  try {
    const [rows] = await db.query('SELECT * FROM node_orders_v2 WHERE id = 681');
    console.log('Order 681 details:', rows[0]);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

checkOrder681();
