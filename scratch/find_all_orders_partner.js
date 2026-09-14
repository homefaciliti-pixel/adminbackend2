const db = require('../db');

async function main() {
  try {
    const [orders1] = await db.query("SELECT id, vendorName, vendorMobile, status, serviceAmount FROM orders");
    console.log('All orders in orders table:');
    orders1.forEach(o => {
      if (o.vendorName || o.vendorMobile || o.status === 'Completed') {
        console.log(`[orders] ID: ${o.id} | vendorName: "${o.vendorName}" | vendorMobile: "${o.vendorMobile}" | status: "${o.status}" | amount: ${o.serviceAmount}`);
      }
    });

    const [orders2] = await db.query("SELECT id, partnerName, userPhone, status, price FROM orders_v2");
    console.log('\nAll orders in orders_v2 table:');
    orders2.forEach(o => {
      if (o.partnerName || o.status === 'Completed') {
        console.log(`[orders_v2] ID: ${o.id} | partnerName: "${o.partnerName}" | userPhone: "${o.userPhone}" | status: "${o.status}" | price: ${o.price}`);
      }
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
