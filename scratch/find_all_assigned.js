const db = require('../db');

async function findAllAssigned() {
  try {
    const [v2] = await db.query(
      "SELECT id, serviceName, partnerName, partnerPhone, status, bookingStatus FROM node_orders_v2 WHERE partnerName IS NOT NULL AND partnerName != ''"
    );
    console.log(`node_orders_v2 assigned count: ${v2.length}`);
    console.log(v2);

    const [admin] = await db.query(
      "SELECT id, serviceName, vendorName, vendorMobile, status FROM orders WHERE vendorName IS NOT NULL AND vendorName != '' AND vendorName != '-'"
    );
    console.log(`orders assigned count: ${admin.length}`);
    console.log(admin);

    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    const [lar] = await db.query(
      `SELECT oi.id, oi.vendor_id, oi.status, u.name AS vendor_name, u.mobile_number AS vendor_mobile
       FROM \`${dbName}\`.\`order_items\` oi
       LEFT JOIN \`${dbName}\`.\`users\` u ON oi.vendor_id = u.id
       WHERE oi.vendor_id IS NOT NULL AND oi.vendor_id != 0
       ORDER BY oi.id DESC LIMIT 10`
    );
    console.log(`order_items assigned count: ${lar.length}`);
    console.log(lar);

  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

findAllAssigned();
