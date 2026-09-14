const db = require('../db');

async function main() {
  try {
    const [rows] = await db.query('SELECT name, mobile, aadharFront, aadharBack, policeVerificationImage, aadhaarImage, panImage FROM partners WHERE mobile = ?', ['9868605551']);
    if (rows.length === 0) {
      console.log('No partner found with phone 9868605551');
    } else {
      rows.forEach(r => {
        console.log(`Name: ${r.name}`);
        console.log(`Mobile: ${r.mobile}`);
        console.log(`AadharFront: ${r.aadharFront}`);
        console.log(`AadharBack: ${r.aadharBack}`);
        console.log(`PoliceVerificationImage: ${r.policeVerificationImage}`);
        console.log(`AadhaarImage: ${r.aadhaarImage}`);
        console.log(`PanImage: ${r.panImage}`);
      });
    }
    process.exit(0);
  } catch (err) {
    console.error('Error fetching partner:', err);
    process.exit(1);
  }
}

main();
