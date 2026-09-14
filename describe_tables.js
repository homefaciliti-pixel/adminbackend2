const mysql = require('mysql2/promise');

async function run() {
  const pool = await mysql.createPool({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  try {
    const dbName = 'homef4fw_homefaci';

    // 1. Describe node_orders
    try {
      const [cols] = await pool.query("DESCRIBE node_orders");
      console.log('Columns of node_orders:', cols.map(c => c.Field).join(', '));
    } catch (err) {
      console.error('Error describing node_orders:', err.message);
    }

    // 2. Describe node_orders_v2
    try {
      const [cols] = await pool.query("DESCRIBE node_orders_v2");
      console.log('\nColumns of node_orders_v2:', cols.map(c => c.Field).join(', '));
    } catch (err) {
      console.error('Error describing node_orders_v2:', err.message);
    }

    // 3. Describe Laravel orders
    try {
      const [cols] = await pool.query(`DESCRIBE \`${dbName}\`.\`orders\``);
      console.log('\nColumns of Laravel orders:', cols.map(c => c.Field).join(', '));
    } catch (err) {
      console.error('Error describing Laravel orders:', err.message);
    }

    // 4. Search bookings assigned to partner "anup" (ID: 574) or mobile "9718833824"
    console.log('\nSearching for orders assigned to partner "anup" (ID: 574) or phone "9718833824":');

    // In node_orders_v2
    try {
      const [rows] = await pool.query(
        "SELECT * FROM node_orders_v2 WHERE partner_id = 574 OR partner_name LIKE '%anup%' OR partner_phone LIKE '%883%'"
      );
      console.log(`Found in node_orders_v2: ${rows.length}`);
      rows.forEach(r => console.log(r));
    } catch (err) {
      console.error('Error searching node_orders_v2 for partner:', err.message);
    }

    // In node_orders
    try {
      const [rows] = await pool.query(
        "SELECT * FROM node_orders WHERE partner_id = 574 OR partner_name LIKE '%anup%' OR partner_mobile LIKE '%883%'"
      );
      console.log(`Found in node_orders: ${rows.length}`);
      rows.forEach(r => console.log(r));
    } catch (err) {
      console.error('Error searching node_orders for partner:', err.message);
    }

    // In Laravel orders
    try {
      const [rows] = await pool.query(
        `SELECT * FROM \`${dbName}\`.\`orders\` WHERE partner_id = 574`
      );
      console.log(`Found in Laravel orders: ${rows.length}`);
      rows.forEach(r => console.log(r));
    } catch (err) {
      console.error('Error searching Laravel orders for partner:', err.message);
    }

  } finally {
    await pool.end();
  }
}

run().catch(console.error);
