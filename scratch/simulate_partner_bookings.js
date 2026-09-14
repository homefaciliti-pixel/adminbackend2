const db = require('../db');

async function simulateGetFilteredBookings(partnerMobile) {
  console.log(`\n=== Simulating getFilteredBookingsList for partner ${partnerMobile} ===`);
  
  const [partnerRows] = await db.query("SELECT * FROM partners WHERE mobile = ?", [partnerMobile]);
  if (partnerRows.length === 0) {
    console.log('Partner not found!');
    return;
  }
  const partner = partnerRows[0];
  console.log('Partner:', { id: partner.id, name: partner.name, mobile: partner.mobile, isPaid: partner.isPaid, isApproved: partner.isApproved, city: partner.city });

  const pNameClean = (partner.name || '').trim();
  const pMobileClean = (partner.mobile || '').trim().replace(/\s+/g, '');
  const pMobileNoCode = pMobileClean.replace(/^\+?91/, '');
  const pMobileWithCode = pMobileClean.startsWith('+91') ? pMobileClean : (pMobileClean.startsWith('91') ? '+' + pMobileClean : '+91' + pMobileClean);

  console.log('\nQuery params:', { pNameClean, pMobileClean, pMobileNoCode, pMobileWithCode });

  // V2 Assigned
  const [v2A] = await db.query(
    `SELECT id, status, bookingStatus, partnerName, partnerPhone, date, timeSlot FROM orders_v2 
     WHERE (partnerName IS NOT NULL AND partnerName != '' AND (
        TRIM(LOWER(partnerName)) = LOWER(?) OR
        LOWER(?) LIKE CONCAT('%', TRIM(LOWER(partnerName)), '%') OR
        TRIM(LOWER(partnerName)) LIKE CONCAT('%', LOWER(?), '%')
     ))
     OR (partnerPhone IS NOT NULL AND partnerPhone != '' AND (partnerPhone = ? OR partnerPhone = ? OR partnerPhone = ? OR REPLACE(partnerPhone, '+91', '') = ?))
     ORDER BY id DESC`,
    [pNameClean, pNameClean, pNameClean, pMobileClean, pMobileWithCode, pMobileNoCode, pMobileNoCode]
  );
  console.log('\nV2 assigned orders returned:', v2A.length);
  v2A.forEach(o => {
    // Simulate mapV2 status mapping
    const s = (o.status||'').toLowerCase();
    let st = s==='completed'?'completed':s==='cancelled'||s==='rejected'?'cancel':s==='in progress'||s==='in_progress'?'in_progress':s==='assigned'?'accepted':s==='amc'?'amc':'pending';
    console.log(`  ID=${o.id} dbStatus=${o.status} mappedStatus=${st} date=${o.date} timeSlot=${o.timeSlot}`);
  });

  // Admin Assigned
  const [adA] = await db.query(
    `SELECT id, status, vendorName, vendorMobile, serviceDate, slotTime FROM orders 
     WHERE (vendorName IS NOT NULL AND vendorName != '' AND vendorName != '-' AND (
        TRIM(LOWER(vendorName)) = LOWER(?) OR
        LOWER(?) LIKE CONCAT('%', TRIM(LOWER(vendorName)), '%') OR
        TRIM(LOWER(vendorName)) LIKE CONCAT('%', LOWER(?), '%')
     ))
     OR (vendorMobile IS NOT NULL AND vendorMobile != '' AND vendorMobile != '-' AND (vendorMobile = ? OR vendorMobile = ? OR vendorMobile = ? OR REPLACE(vendorMobile, '+91', '') = ?))
     ORDER BY id DESC`,
    [pNameClean, pNameClean, pNameClean, pMobileClean, pMobileWithCode, pMobileNoCode, pMobileNoCode]
  );
  console.log('\nAdmin assigned orders returned:', adA.length);
  adA.forEach(o => {
    const s = (o.status||'').toLowerCase();
    let st = s==='completed'?'completed':s==='cancelled'||s==='rejected'?'cancel':s==='in progress'||s==='in_progress'?'in_progress':s==='assigned'?'accepted':s==='amc'?'amc':'pending';
    console.log(`  ID=${o.id} dbStatus=${o.status} mappedStatus=${st} date=${o.serviceDate} time=${o.slotTime}`);
  });

  // Now check if eligible filter would block it
  if (partner.isPaid !== 1 || partner.isApproved !== 1) {
    console.log('\n⚠️  PARTNER IS NOT PAID/APPROVED — only accepted/in_progress/completed orders will show!');
  } else {
    console.log('\n✅ Partner isPaid=1 isApproved=1 — all statuses eligible');
  }
}

async function main() {
  try {
    await simulateGetFilteredBookings('7250642635');
    await simulateGetFilteredBookings('9928417201');
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message, e.stack);
    process.exit(1);
  }
}

main();
