const db = require('../db');

async function main() {
  try {
    // Check order 712 detail directly - simulate what GET /bookings/712 does
    const partnerName = 'Milan Ali '; // from partners table (with trailing space)
    
    const [rows] = await db.query('SELECT id, status, partnerName, partnerPhone, serviceName, date, timeSlot, address, price FROM orders_v2 WHERE id = 712');
    if (rows.length === 0) {
      console.log('Order 712 not found!');
      process.exit(0);
    }
    const order = rows[0];
    console.log('Order 712 raw data:', {
      id: order.id,
      status: order.status,
      partnerName: JSON.stringify(order.partnerName),
      partnerPhone: order.partnerPhone
    });
    
    // Simulate OLD check (without trim) - this is what was failing
    const isUnassigned = !order.partnerName || order.partnerName === '';
    const oldCheck = (order.partnerName || '').toLowerCase() !== (partnerName || '').toLowerCase() && !isUnassigned;
    console.log('\nOLD check (without trim) - would block?', oldCheck);
    console.log('  order.partnerName (lowered):', JSON.stringify((order.partnerName || '').toLowerCase()));
    console.log('  partnerName (lowered):', JSON.stringify((partnerName || '').toLowerCase()));
    
    // Simulate NEW check (with trim) - this is the fix
    const newCheck = (order.partnerName || '').trim().toLowerCase() !== (partnerName || '').trim().toLowerCase() && !isUnassigned;
    console.log('\nNEW check (with trim) - would block?', newCheck);
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}
main();
