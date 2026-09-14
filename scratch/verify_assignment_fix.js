const db = require('../db');

async function testAssignmentFix() {
  try {
    const [partners] = await db.query("SELECT * FROM partners WHERE mobile IN ('7626873570', '9653853414', '7892409858', '7597816095') OR name LIKE '%Pawan%'");
    console.log(`Testing ${partners.length} partners...`);

    for (const p of partners) {
      console.log(`\n--------------------------------------------`);
      console.log(`Partner: ID=${p.id}, Name="${p.name}", Mobile="${p.mobile}", isPaid=${p.isPaid}, isApproved=${p.isApproved}`);

      const pNameClean = (p.name || '').trim();
      const pMobileClean = (p.mobile || '').trim().replace(/\s+/g, '');
      const pMobileNoCode = pMobileClean.replace(/^\+?91/, '');
      const pMobileWithCode = pMobileClean.startsWith('+91') ? pMobileClean : (pMobileClean.startsWith('91') ? '+' + pMobileClean : '+91' + pMobileClean);

      const [v2A] = await db.query(
        `SELECT id, serviceName, partnerName, partnerPhone, status, bookingStatus FROM node_orders_v2 
         WHERE (partnerName IS NOT NULL AND TRIM(LOWER(partnerName)) = LOWER(?))
            OR (partnerPhone IS NOT NULL AND (partnerPhone = ? OR partnerPhone = ? OR partnerPhone = ? OR REPLACE(partnerPhone, '+91', '') = ?))
         ORDER BY id DESC`,
        [pNameClean, pMobileClean, pMobileWithCode, pMobileNoCode, pMobileNoCode]
      );
      console.log(`Assigned orders in v2: ${v2A.length}`);
      if (v2A.length > 0) {
        console.log('Sample:', v2A);
      }

      const [adA] = await db.query(
        `SELECT id, serviceName, vendorName, vendorMobile, status FROM orders 
         WHERE (vendorName IS NOT NULL AND TRIM(LOWER(vendorName)) = LOWER(?))
            OR (vendorMobile IS NOT NULL AND (vendorMobile = ? OR vendorMobile = ? OR vendorMobile = ? OR REPLACE(vendorMobile, '+91', '') = ?))
         ORDER BY id DESC`,
        [pNameClean, pMobileClean, pMobileWithCode, pMobileNoCode, pMobileNoCode]
      );
      console.log(`Assigned orders in admin orders: ${adA.length}`);
      if (adA.length > 0) {
        console.log('Sample:', adA);
      }

      const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
      let laravelPartnerId = p.id >= 10000000 ? (p.id - 10000000) : p.id;
      const [larA] = await db.query(
        `SELECT oi.id, oi.vendor_id, oi.status, s.title AS service_name
         FROM \`${dbName}\`.\`order_items\` oi
         LEFT JOIN \`${dbName}\`.\`services\` s ON oi.service_id = s.id
         WHERE oi.vendor_id = ? OR oi.vendor_id = ?
         ORDER BY oi.id DESC`,
        [p.id, laravelPartnerId]
      );
      console.log(`Assigned orders in Laravel order_items: ${larA.length}`);
      if (larA.length > 0) {
        console.log('Sample:', larA);
      }
    }
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

testAssignmentFix();
