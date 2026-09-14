const mysql = require('mysql2/promise');

async function run() {
  const phoneSuffix = '883';
  const partnerName = 'anup';

  const pool = await mysql.createPool({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  try {
    // 1. Search in node_orders
    const [orders1] = await pool.query(
      `SELECT id, serviceRequestNumber, serviceName, status, vendorName, vendorMobile, serviceDate, slotTime 
       FROM node_orders 
       WHERE vendorMobile LIKE ? OR vendorName LIKE ?`,
      [`%${phoneSuffix}%`, `%${partnerName}%`]
    );
    console.log('node_orders matches:', orders1.length);
    orders1.forEach(o => {
      console.log(`  [ID: ${o.id}] ReqNum: ${o.serviceRequestNumber} | Service: ${o.serviceName} | Status: ${o.status} | Vendor: ${o.vendorName} (${o.vendorMobile}) | Date: ${o.serviceDate} ${o.slotTime}`);
    });

    // 2. Search in node_orders_v2
    const [orders2] = await pool.query(
      `SELECT id, userPhone, serviceName, status, bookingStatus, partnerName, partnerPhone, date, timeSlot 
       FROM node_orders_v2 
       WHERE partnerPhone LIKE ? OR partnerName LIKE ?`,
      [`%${phoneSuffix}%`, `%${partnerName}%`]
    );
    console.log('\nnode_orders_v2 matches:', orders2.length);
    orders2.forEach(o => {
      console.log(`  [ID: ${o.id}] UserPhone: ${o.userPhone} | Service: ${o.serviceName} | Status: ${o.status} | BookingStatus: ${o.bookingStatus} | Partner: ${o.partnerName} (${o.partnerPhone}) | Date: ${o.date} ${o.timeSlot}`);
    });

  } finally {
    await pool.end();
  }
}

run().catch(console.error);
