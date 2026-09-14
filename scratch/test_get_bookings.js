const db = require('../db');

async function testGetBookings() {
  try {
    // Fetch a partner that has assigned orders, e.g. Pawan Kumar or Akash or Khushbudin
    const [partners] = await db.query("SELECT * FROM partners WHERE mobile IN ('9653853414', '7626873570', '7892409858', '7597816095') OR name LIKE '%Pawan%'");
    console.log(`Found ${partners.length} partners to test.`);

    for (const p of partners) {
      console.log(`\n==============================================`);
      console.log(`Testing Partner: ID=${p.id}, Name="${p.name}", Mobile="${p.mobile}", isPaid=${p.isPaid}, isApproved=${p.isApproved}`);

      const partnerName = (p.name || '').trim();
      const partnerMobile = (p.mobile || '').trim();
      const partnerMobileWithCode = (p.countryCode || '+91') + partnerMobile;
      const partnerMobileNoCode = partnerMobile.replace(/^\+?91/, '');

      // 1. Check v2 assigned
      const [v2A] = await db.query(
        `SELECT id, serviceName, partnerName, partnerPhone, status, bookingStatus FROM node_orders_v2 
         WHERE partnerName = ? OR partnerPhone = ? OR partnerPhone = ? OR partnerPhone = ? OR TRIM(partnerName) = ? OR TRIM(partnerPhone) = ?`,
        [partnerName, partnerMobile, partnerMobileWithCode, partnerMobileNoCode, partnerName, partnerMobile]
      );
      console.log(`v2A count: ${v2A.length}`);
      if (v2A.length > 0) {
        console.log('v2A sample:', v2A);
      }

      // 2. Check admin assigned
      const [adA] = await db.query(
        `SELECT id, serviceName, vendorName, vendorMobile, status FROM orders 
         WHERE vendorName = ? OR vendorMobile = ? OR vendorMobile = ? OR vendorMobile = ? OR TRIM(vendorName) = ? OR TRIM(vendorMobile) = ?`,
        [partnerName, partnerMobile, partnerMobileWithCode, partnerMobileNoCode, partnerName, partnerMobile]
      );
      console.log(`adA count: ${adA.length}`);
      if (adA.length > 0) {
        console.log('adA sample:', adA);
      }

      // 3. Check laravel assigned
      const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
      let laravelId = p.id >= 10000000 ? (p.id - 10000000) : p.id;
      const [larA] = await db.query(
        `SELECT id, vendor_id, status FROM \`${dbName}\`.\`order_items\` WHERE vendor_id = ?`,
        [laravelId]
      );
      console.log(`Laravel assigned count (for vendor_id ${laravelId}): ${larA.length}`);
      if (larA.length > 0) {
        console.log('Laravel sample:', larA);
      }
    }

  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

testGetBookings();
