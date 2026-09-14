const db = require('../db');

// Simulate the admin assigning order to different partners and see what happens
async function testAssign(orderId, vendorMobile) {
  console.log(`\n=== Testing assign of order ${orderId} to ${vendorMobile} ===`);
  
  const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
  
  // Step 1: findOrderSource
  const [v2Rows] = await db.query('SELECT id, status, bookingStatus, partnerName, partnerPhone FROM node_orders_v2 WHERE id = ?', [orderId]);
  if (v2Rows.length > 0) {
    console.log('Order found in node_orders_v2:', v2Rows[0]);
  } else {
    const [adminRows] = await db.query('SELECT id, status, vendorName, vendorMobile FROM orders WHERE id = ?', [orderId]);
    if (adminRows.length > 0) {
      console.log('Order found in admin orders:', adminRows[0]);
    } else {
      console.log('Order NOT FOUND in any table!');
    }
  }
  
  // Step 2: Try to resolve partner name from phone
  let cleanedPhone = vendorMobile.trim().replace(/\s+/g, '');
  if (cleanedPhone.startsWith('+91') && cleanedPhone.length === 13) cleanedPhone = cleanedPhone.substring(3);
  else if (cleanedPhone.startsWith('91') && cleanedPhone.length === 12) cleanedPhone = cleanedPhone.substring(2);

  const [partners] = await db.query(
    'SELECT name, mobile FROM partners WHERE mobile = ? OR mobile = ? OR CONCAT(countryCode, mobile) = ?',
    [cleanedPhone, vendorMobile, vendorMobile]
  );
  if (partners.length > 0) {
    console.log('Partner found:', partners[0]);
  } else {
    console.log('Partner NOT found in partners table for phone:', vendorMobile);
  }
}

async function listAllOrders() {
  const [orders] = await db.query('SELECT id, status, bookingStatus, partnerName, partnerPhone, date FROM node_orders_v2 ORDER BY id DESC LIMIT 10');
  console.log('\nLatest 10 orders in node_orders_v2:');
  orders.forEach(o => console.log(`  ID=${o.id} status=${o.status} partnerPhone=${o.partnerPhone} date=${o.date}`));
}

async function main() {
  try {
    await listAllOrders();
    // Test with a specific new order
    await testAssign(686, '7250642635');
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();
