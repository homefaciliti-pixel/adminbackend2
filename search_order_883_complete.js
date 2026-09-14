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
    // 1. Search in node_orders_v2
    const [rowsV2] = await pool.query(
      `SELECT id, userPhone, serviceName, price, date, status, bookingStatus, partnerName, partnerPhone, createdAt 
       FROM node_orders_v2 
       WHERE id = ? OR userPhone LIKE ? OR partnerPhone LIKE ? OR partnerName LIKE ?`,
      [queryVal, `%${queryVal}%`, `%${queryVal}%`, `%${queryVal}%`]
    );
    console.log('node_orders_v2 matches:', rowsV2.length);
    rowsV2.forEach(o => {
      console.log(`  [V2 ID: ${o.id}] UserPhone: ${o.userPhone} | Service: ${o.serviceName} | Price: ${o.price} | Status: ${o.status} | BookingStatus: ${o.bookingStatus} | Partner: ${o.partnerName} (${o.partnerPhone}) | CreatedAt: ${o.createdAt}`);
    });

    // 2. Search in node_orders
    const [rowsNode] = await pool.query(
      `SELECT id, serviceRequestNumber, serviceName, serviceAmount, status, vendorName, vendorMobile, serviceDate, slotTime 
       FROM node_orders 
       WHERE id = ? OR serviceRequestNumber LIKE ? OR vendorMobile LIKE ? OR vendorName LIKE ?`,
      [queryVal, `%${queryVal}%`, `%${queryVal}%`, `%${queryVal}%`]
    );
    console.log('\nnode_orders matches:', rowsNode.length);
    rowsNode.forEach(o => {
      console.log(`  [Node ID: ${o.id}] ReqNum: ${o.serviceRequestNumber} | Service: ${o.serviceName} | Amount: ${o.serviceAmount} | Status: ${o.status} | Vendor: ${o.vendorName} (${o.vendorMobile}) | Date: ${o.serviceDate} ${o.slotTime}`);
    });

    // 3. Search in Laravel orders table (using user_id,txn_id, order_number, etc.)
    const dbName = 'homef4fw_homefaci';
    const [rowsLaravel] = await pool.query(
      `SELECT id, order_number, amount, status, created_at 
       FROM \`${dbName}\`.\`orders\` 
       WHERE id = ? OR order_number LIKE ?`,
      [queryVal, `%${queryVal}%`]
    );
    console.log('\nLaravel orders matches:', rowsLaravel.length);
    rowsLaravel.forEach(o => {
      console.log(`  [Laravel ID: ${o.id}] OrderNum: ${o.order_number} | Amount: ${o.amount} | Status: ${o.status} | CreatedAt: ${o.created_at}`);
    });

  } finally {
    await pool.end();
  }
}

run().catch(console.error);
