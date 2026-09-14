const db = require('../db');

async function main() {
  try {
    const [rows] = await db.query('SELECT * FROM orders');
    console.log(`Found ${rows.length} orders in the database:`);
    rows.forEach(r => {
      console.log(`ID: ${r.id} | ReqNo: ${r.serviceRequestNumber} | Service: ${r.serviceName} | Amount: ${r.serviceAmount} | Status: ${r.status} | Vendor: ${r.vendorName} | Date: ${r.serviceDate}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error fetching orders:', err);
    process.exit(1);
  }
}

main();
