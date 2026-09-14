const db = require('../db');
async function main() {
  try {
    // Check order 712 in all tables
    const [v2] = await db.query("SELECT id, status, bookingStatus, partnerName, partnerPhone, serviceName, date, timeSlot FROM orders_v2 WHERE id = 712");
    console.log('orders_v2 order 712:', JSON.stringify(v2, null, 2));

    const [adm] = await db.query("SELECT id, status, vendorName, vendorMobile, serviceName, serviceDate FROM orders WHERE id = 712");
    console.log('admin orders 712:', JSON.stringify(adm, null, 2));

    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}
main();
