const db = require('../db');
async function main() {
  try {
    // Check order 724
    const [rows] = await db.query("SELECT id, status, date, timeSlot, serviceName, partnerName, partnerPhone FROM orders_v2 WHERE id = 724");
    console.log('Order 724 current:', JSON.stringify(rows[0], null, 2));

    if (rows.length === 0) {
      console.log('Not found in orders_v2, checking admin orders...');
      const [adm] = await db.query("SELECT id, status, serviceDate, slotTime, serviceName FROM orders WHERE id = 724");
      console.log('Admin orders 724:', JSON.stringify(adm, null, 2));
      process.exit(0);
    }

    // Update date and timeSlot
    const [result] = await db.query(
      "UPDATE orders_v2 SET date = '2026-08-09', timeSlot = '9:00 AM - 10:00 AM' WHERE id = 724"
    );
    console.log('Updated rows:', result.affectedRows);

    // Verify
    const [verify] = await db.query("SELECT id, status, date, timeSlot, serviceName, partnerName FROM orders_v2 WHERE id = 724");
    console.log('After update:', JSON.stringify(verify[0], null, 2));

    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}
main();
