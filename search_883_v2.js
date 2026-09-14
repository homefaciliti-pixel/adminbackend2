const mysql = require('mysql2/promise');

async function run() {
  const queryVal = '883';

  const pool = await mysql.createPool({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  try {
    // 1. Search node_orders_v2
    try {
      const [ordersV2] = await pool.query(
        `SELECT id, booking_id, customer_name, customer_phone, partner_name, partner_phone, status 
         FROM node_orders_v2 
         WHERE id = ? OR booking_id LIKE ? OR customer_phone LIKE ? OR partner_phone LIKE ?`,
        [queryVal, `%${queryVal}%`, `%${queryVal}%`, `%${queryVal}%`]
      );
      console.log('Orders found in node_orders_v2:', ordersV2.length);
      ordersV2.forEach(o => {
        console.log(`  [V2 ID: ${o.id}] BookingID: ${o.booking_id} | Customer: ${o.customer_name} (${o.customer_phone}) | Partner: ${o.partner_name} (${o.partner_phone}) | Status: ${o.status}`);
      });
    } catch (err) {
      console.error('Error querying node_orders_v2:', err.message);
    }

    // 2. Search legacy Laravel orders (table: `orders` without prefix, or with table prefix)
    const dbName = 'homef4fw_homefaci';
    try {
      const [laravelOrders] = await pool.query(
        `SELECT o.id, o.order_id, o.customer_name, o.customer_mobile, o.status, o.booking_date 
         FROM \`${dbName}\`.\`orders\` o
         WHERE o.id = ? OR o.order_id LIKE ? OR o.customer_mobile LIKE ?`,
        [queryVal, `%${queryVal}%`, `%${queryVal}%`]
      );
      console.log('\nOrders found in Laravel orders table:', laravelOrders.length);
      laravelOrders.forEach(o => {
        console.log(`  [Laravel ID: ${o.id}] OrderID: ${o.order_id} | Customer: ${o.customer_name} (${o.customer_mobile}) | Status: ${o.status} | Date: ${o.booking_date}`);
      });
    } catch (err) {
      console.error('Error querying Laravel orders:', err.message);
    }

    // 3. Search node_partners
    try {
      const [partners] = await pool.query(
        "SELECT id, name, mobile, isApproved, isPaid FROM node_partners WHERE id = ? OR mobile LIKE ?",
        [queryVal, `%${queryVal}%`]
      );
      console.log('\nPartners found in node_partners:', partners.length);
      partners.forEach(p => {
        console.log(`  [Partner ID: ${p.id}] ${p.name} | Mobile: ${p.mobile} | Approved: ${p.isApproved} | Paid: ${p.isPaid}`);
      });
    } catch (err) {
      console.error('Error querying node_partners:', err.message);
    }

  } finally {
    await pool.end();
  }
}

run().catch(console.error);
