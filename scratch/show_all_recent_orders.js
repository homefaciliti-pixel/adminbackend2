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
    // Find vendor Anil with phone 83698943 (may be partial number)
    console.log('Searching node_partners for mobile 83698943...');
    const [partners] = await connection.query(`SELECT id, name, mobile FROM node_partners WHERE mobile LIKE '%83698943%'`);
    console.log('Found:', partners.map(p => `ID: ${p.id}, Name: ${p.name}, Mobile: ${p.mobile}`));

    // Check order 595 in node_orders_v2 - maybe it was physically deleted
    console.log('\nChecking if 595 physically exists...');
    const [o595] = await connection.query('SELECT * FROM node_orders_v2 WHERE id = 595');
    console.log('Order 595 result:', o595.length > 0 ? o595[0] : 'NOT FOUND - physically deleted');

    // Show all orders from 580 onwards with their status
    console.log('\nAll orders from ID 580 onwards:');
    const [allOrders] = await connection.query(`
      SELECT id, userPhone, serviceName, price, status, cancelReason, date, timeSlot, partnerName, partnerPhone
      FROM node_orders_v2 
      WHERE id >= 580 
      ORDER BY id ASC
    `);
    allOrders.forEach(r => {
      console.log(`- ID: ${r.id}, Phone: ${r.userPhone}, Service: ${r.serviceName}, Price: ₹${r.price}, Status: ${r.status}, CancelReason: ${r.cancelReason || 'none'}, Partner: ${r.partnerName || 'none'} (${r.partnerPhone || '-'})`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
