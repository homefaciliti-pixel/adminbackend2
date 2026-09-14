const db = require('../db');

async function testFlexibleMatching() {
  try {
    // Test partners: Khushbudin, SATBIR, akash, Pawan Kumar, Swayam Rishabh
    const [partners] = await db.query(
      "SELECT id, name, mobile FROM partners WHERE name LIKE '%Khushbudin%' OR name LIKE '%SATBIR%' OR name LIKE '%akash%' OR name LIKE '%Pawan%' OR name LIKE '%Swayam%'"
    );
    console.log('Testing partners found in DB:', partners);

    for (const p of partners) {
      console.log(`\n=================================================`);
      console.log(`Testing Partner: ID=${p.id}, Name="${p.name}", Mobile="${p.mobile}"`);

      const pNameClean = (p.name || '').trim().toLowerCase();
      const pMobileClean = (p.mobile || '').trim().replace(/\s+/g, '');
      const pMobileNoCode = pMobileClean.replace(/^\+?91/, '');

      // Query with flexible name and phone matching
      const [assigned] = await db.query(
        `SELECT id, serviceName, partnerName, partnerPhone, status FROM node_orders_v2 
         WHERE (partnerName IS NOT NULL AND (
            TRIM(LOWER(partnerName)) = ? OR 
            TRIM(LOWER(partnerName)) LIKE CONCAT('%', ?, '%') OR 
            ? LIKE CONCAT('%', TRIM(LOWER(partnerName)), '%')
         ))
         OR (partnerPhone IS NOT NULL AND (
            partnerPhone = ? OR 
            partnerPhone = ? OR 
            REPLACE(partnerPhone, '+91', '') = ?
         ))
         ORDER BY id DESC`,
        [pNameClean, pNameClean, pNameClean, pMobileClean, pMobileNoCode, pMobileNoCode]
      );

      console.log(`Assigned orders matched: ${assigned.length}`);
      if (assigned.length > 0) {
        console.log('Matched orders:', assigned);
      }
    }

  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

testFlexibleMatching();
