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
    // 1. Search in node_orders (or orders)
    // Check order ID, request_id, partner_id, customer mobile, etc.
    const [ordersById] = await pool.query(
      "SELECT id, request_id, customer_name, customer_mobile, partner_id, partner_name, status, total_amount FROM node_orders WHERE id = ? OR request_id LIKE ? OR customer_mobile LIKE ? OR partner_mobile LIKE ?",
      [queryVal, `%${queryVal}%`, `%${queryVal}%`, `%${queryVal}%`]
    );
    console.log('Orders found in node_orders:', ordersById.length);
    ordersById.forEach(o => {
      console.log(`  [Order ID: ${o.id}] Req: ${o.request_id} | Customer: ${o.customer_name} (${o.customer_mobile}) | Partner: ${o.partner_name} (ID: ${o.partner_id}) | Status: ${o.status} | Amount: ${o.total_amount}`);
    });

    // 2. Search in node_orders_v2
    const [ordersV2] = await pool.query(
      "SELECT id, booking_id, customer_name, customer_phone, partner_name, status FROM node_orders_v2 WHERE id = ? OR booking_id LIKE ? OR customer_phone LIKE ? OR partner_phone LIKE ?",
      [queryVal, `%${queryVal}%`, `%${queryVal}%`, `%${queryVal}%`]
    );
    console.log('\nOrders found in node_orders_v2:', ordersV2.length);
    ordersV2.forEach(o => {
      console.log(`  [V2 ID: ${o.id}] BookingID: ${o.booking_id} | Customer: ${o.customer_name} (${o.customer_phone}) | Partner: ${o.partner_name} | Status: ${o.status}`);
    });

    // 3. Search in partners (node_partners)
    const [partners] = await pool.query(
      "SELECT id, name, mobile, isApproved, isPaid FROM node_partners WHERE id = ? OR mobile LIKE ?",
      [queryVal, `%${queryVal}%`]
    );
    console.log('\nPartners found in node_partners:', partners.length);
    partners.forEach(p => {
      console.log(`  [Partner ID: ${p.id}] ${p.name} | Mobile: ${p.mobile} | Approved: ${p.isApproved} | Paid: ${p.isPaid}`);
    });

  } finally {
    await pool.end();
  }
}

run().catch(console.error);
