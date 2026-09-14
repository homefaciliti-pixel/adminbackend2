const mysql = require('mysql2/promise');

async function run() {
  const target = '2026_0889';
  const alt1 = 'REQ-2026-0889';
  const alt2 = 'REQ_2026_0889';
  const alt3 = '0889';

  const pool = await mysql.createPool({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  try {
    const dbName = 'homef4fw_homefaci';

    // 1. Search in node_orders
    const [ordersNode] = await pool.query(
      `SELECT id, serviceRequestNumber, serviceName, status, vendorName, vendorMobile, serviceDate, slotTime 
       FROM node_orders 
       WHERE serviceRequestNumber LIKE ? OR serviceRequestNumber LIKE ? OR serviceRequestNumber LIKE ? OR serviceRequestNumber LIKE ?`,
      [`%${target}%`, `%${alt1}%`, `%${alt2}%`, `%${alt3}%`]
    );
    console.log('node_orders matches:', ordersNode.length);
    ordersNode.forEach(o => {
      console.log(`  [Node ID: ${o.id}] ReqNum: ${o.serviceRequestNumber} | Service: ${o.serviceName} | Status: ${o.status} | Vendor: ${o.vendorName} (${o.vendorMobile}) | Date: ${o.serviceDate} ${o.slotTime}`);
    });

    // 2. Search in node_orders_v2
    const [ordersV2] = await pool.query(
      `SELECT id, userPhone, serviceName, status, bookingStatus, partnerName, partnerPhone, date, timeSlot 
       FROM node_orders_v2 
       WHERE id = ? OR description LIKE ? OR userPhone LIKE ?`,
      [alt3, `%${target}%`, `%${alt3}%`]
    );
    console.log('\nnode_orders_v2 matches:', ordersV2.length);
    ordersV2.forEach(o => {
      console.log(`  [V2 ID: ${o.id}] UserPhone: ${o.userPhone} | Service: ${o.serviceName} | Status: ${o.status} | BookingStatus: ${o.bookingStatus} | Partner: ${o.partnerName} (${o.partnerPhone}) | Date: ${o.date} ${o.timeSlot}`);
    });

    // 3. Search in Laravel orders table
    const [laravelOrders] = await pool.query(
      `SELECT id, order_number, amount, status, created_at 
       FROM \`${dbName}\`.\`orders\` 
       WHERE order_number LIKE ? OR order_number LIKE ? OR order_number LIKE ? OR order_number LIKE ?`,
      [`%${target}%`, `%${alt1}%`, `%${alt2}%`, `%${alt3}%`]
    );
    console.log('\nLaravel orders matches:', laravelOrders.length);
    laravelOrders.forEach(o => {
      console.log(`  [Laravel ID: ${o.id}] OrderNum: ${o.order_number} | Amount: ${o.amount} | Status: ${o.status} | CreatedAt: ${o.created_at}`);
    });

  } finally {
    await pool.end();
  }
}

run().catch(console.error);
