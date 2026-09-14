const db = require('../db');

async function main() {
  try {
    const [rows] = await db.query('SELECT * FROM partners WHERE mobile = ?', ['9868605551']);
    if (rows.length === 0) {
      console.log('No partner found with phone 9868605551');
    } else {
      rows.forEach(r => {
        console.log(`ID: ${r.id} | Name: ${r.name} | Mobile: ${r.mobile} | Image: ${r.image} | isApproved: ${r.isApproved}`);
      });
    }
    process.exit(0);
  } catch (err) {
    console.error('Error fetching partner:', err);
    process.exit(1);
  }
}

main();
