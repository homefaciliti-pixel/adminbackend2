const db = require('../db');

async function checkAssignedOrders() {
  try {
    console.log('--- Checking node_orders_v2 ---');
    const [v2Rows] = await db.query(
      "SELECT id, serviceName, partnerName, partnerPhone, status, bookingStatus, date, timeSlot FROM node_orders_v2 WHERE partnerName IS NOT NULL AND partnerName != '' ORDER BY id DESC LIMIT 10"
    );
    console.log('node_orders_v2 assigned:', v2Rows);

    console.log('\n--- Checking orders (admin) ---');
    const [adminRows] = await db.query(
      "SELECT id, serviceName, vendorName, vendorMobile, status, serviceDate, slotTime FROM orders WHERE vendorName IS NOT NULL AND vendorName != '' AND vendorName != '-' ORDER BY id DESC LIMIT 10"
    );
    console.log('orders assigned:', adminRows);

    console.log('\n--- Checking order_items (laravel) ---');
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    const [laravelRows] = await db.query(
      `SELECT id, vendor_id, status FROM \`${dbName}\`.\`order_items\` WHERE vendor_id IS NOT NULL AND vendor_id != 0 ORDER BY id DESC LIMIT 10`
    );
    console.log('order_items assigned:', laravelRows);

  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

checkAssignedOrders();
