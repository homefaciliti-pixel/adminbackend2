const db = require('../db');
async function test() {
  try {
    // Check partner_dismissed_bookings table
    let dismissed = [];
    try {
      const [rows] = await db.query("SELECT * FROM partner_dismissed_bookings WHERE partnerId IN (SELECT id FROM partners WHERE mobile = '9928417201') ORDER BY id DESC LIMIT 20");
      dismissed = rows;
    } catch(e) {
      console.log('partner_dismissed_bookings query error:', e.message);
    }
    console.log('Dismissed bookings for 9928417201:', JSON.stringify(dismissed, null, 2));

    // Simulate the actual partner query
    const [partnerRows] = await db.query("SELECT * FROM partners WHERE mobile = '9928417201'");
    if (partnerRows.length === 0) {
      console.log('Partner not found!');
      process.exit(0);
    }
    const partner = partnerRows[0];
    console.log('Partner data:', JSON.stringify({ id: partner.id, name: partner.name, mobile: partner.mobile, isPaid: partner.isPaid, isApproved: partner.isApproved }, null, 2));

    const pNameClean = (partner.name || '').trim();
    const pMobileClean = (partner.mobile || '').trim().replace(/\s+/g, '');
    const pMobileNoCode = pMobileClean.replace(/^\+?91/, '');
    const pMobileWithCode = pMobileClean.startsWith('+91') ? pMobileClean : (pMobileClean.startsWith('91') ? '+' + pMobileClean : '+91' + pMobileClean);

    console.log('pNameClean:', JSON.stringify(pNameClean));
    console.log('pMobileClean:', pMobileClean);
    console.log('pMobileNoCode:', pMobileNoCode);
    console.log('pMobileWithCode:', pMobileWithCode);

    // Run the exact v2A query
    const [v2A] = await db.query(
      `SELECT id, status, bookingStatus, partnerName, partnerPhone, date FROM orders_v2 
       WHERE (partnerName IS NOT NULL AND partnerName != '' AND (
          TRIM(LOWER(partnerName)) = LOWER(?) OR
          LOWER(?) LIKE CONCAT('%', TRIM(LOWER(partnerName)), '%') OR
          TRIM(LOWER(partnerName)) LIKE CONCAT('%', LOWER(?), '%')
       ))
       OR (partnerPhone IS NOT NULL AND partnerPhone != '' AND (partnerPhone = ? OR partnerPhone = ? OR partnerPhone = ? OR REPLACE(partnerPhone, '+91', '') = ?))
       ORDER BY id DESC`,
      [pNameClean, pNameClean, pNameClean, pMobileClean, pMobileWithCode, pMobileNoCode, pMobileNoCode]
    );
    console.log('V2 assigned to this partner:', JSON.stringify(v2A, null, 2));

    // Run the adA query
    const [adA] = await db.query(
      `SELECT id, status, vendorName, vendorMobile, serviceDate FROM orders 
       WHERE (vendorName IS NOT NULL AND vendorName != '' AND vendorName != '-' AND (
          TRIM(LOWER(vendorName)) = LOWER(?) OR
          LOWER(?) LIKE CONCAT('%', TRIM(LOWER(vendorName)), '%') OR
          TRIM(LOWER(vendorName)) LIKE CONCAT('%', LOWER(?), '%')
       ))
       OR (vendorMobile IS NOT NULL AND vendorMobile != '' AND vendorMobile != '-' AND (vendorMobile = ? OR vendorMobile = ? OR vendorMobile = ? OR REPLACE(vendorMobile, '+91', '') = ?))
       ORDER BY id DESC`,
      [pNameClean, pNameClean, pNameClean, pMobileClean, pMobileWithCode, pMobileNoCode, pMobileNoCode]
    );
    console.log('Admin assigned to this partner:', JSON.stringify(adA, null, 2));

    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message, e.stack);
    process.exit(1);
  }
}
test();
