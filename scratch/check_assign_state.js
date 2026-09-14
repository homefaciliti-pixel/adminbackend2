const db = require('../db');
async function test() {
  try {
    // Check recent assignments in both tables
    const [v2] = await db.query("SELECT id, status, bookingStatus, partnerName, partnerPhone, date FROM orders_v2 WHERE partnerName IS NOT NULL AND partnerName != '' ORDER BY id DESC LIMIT 5");
    console.log('V2 assigned:', JSON.stringify(v2, null, 2));
    
    const [adm] = await db.query("SELECT id, status, vendorName, vendorMobile, serviceDate FROM orders WHERE vendorName IS NOT NULL AND vendorName != '' AND vendorName != '-' ORDER BY id DESC LIMIT 5");
    console.log('Admin assigned:', JSON.stringify(adm, null, 2));

    // Check if partner 9928417201 exists and their isPaid/isApproved
    const [partner] = await db.query("SELECT id, name, mobile, isPaid, isApproved FROM partners WHERE mobile = '9928417201' OR mobile LIKE '%9928417201%' LIMIT 3");
    console.log('Partner:', JSON.stringify(partner, null, 2));
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}
test();
