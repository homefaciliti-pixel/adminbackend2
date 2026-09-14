const mysql = require('mysql2/promise');

async function run() {
  const orderId = 883;
  const partnerId = 202;
  const cancelReason = "Phone don't pickup";

  const pool = await mysql.createPool({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  try {
    // 1. Fetch current order state
    const [ordersBefore] = await pool.query(
      "SELECT id, userPhone, serviceName, status, bookingStatus, partnerName, partnerPhone FROM node_orders_v2 WHERE id = ?",
      [orderId]
    );

    if (ordersBefore.length === 0) {
      console.log(`❌ Order with ID ${orderId} not found.`);
      return;
    }

    const order = ordersBefore[0];
    console.log('Order details BEFORE cancellation:');
    console.log(`  [ID: ${order.id}] Customer: ${order.userPhone} | Service: ${order.serviceName} | Status: ${order.status} | BookingStatus: ${order.bookingStatus} | Partner: ${order.partnerName}`);

    if (order.status === 'Cancelled') {
      console.log('⚠️ Order is already Cancelled.');
      return;
    }

    // 2. Update order status in node_orders_v2
    const [updateOrderRes] = await pool.query(
      "UPDATE node_orders_v2 SET status = 'Cancelled', bookingStatus = 'cancelled', cancelReason = ? WHERE id = ?",
      [cancelReason, orderId]
    );
    console.log(`\n✅ node_orders_v2 updated: ${updateOrderRes.affectedRows} row(s)`);

    // 3. Update partner cancellation stats in node_partners
    const [updatePartnerRes] = await pool.query(
      `UPDATE node_partners 
       SET cancelledBookings = cancelledBookings + 1,
           totalBookings = totalBookings + 1
       WHERE id = ?`,
      [partnerId]
    );
    console.log(`✅ node_partners updated: ${updatePartnerRes.affectedRows} row(s)`);

    // 4. Verification
    console.log('\n🔍 Verification after update:');
    const [vOrder] = await pool.query(
      "SELECT id, status, bookingStatus, cancelReason FROM node_orders_v2 WHERE id = ?",
      [orderId]
    );
    const [vPartner] = await pool.query(
      "SELECT id, name, cancelledBookings, totalBookings FROM node_partners WHERE id = ?",
      [partnerId]
    );

    vOrder.forEach(o => console.log(`  node_orders_v2 [ID ${o.id}] status: ${o.status} | bookingStatus: ${o.bookingStatus} | cancelReason: "${o.cancelReason}"`));
    vPartner.forEach(p => console.log(`  node_partners [ID ${p.id}] ${p.name} | cancelledBookings: ${p.cancelledBookings} | totalBookings: ${p.totalBookings}`));

    console.log('\n✅ Done!');
  } finally {
    await pool.end();
  }
}

run().catch(console.error);
