const db = require('../db');

async function main() {
  try {
    const [rows] = await db.query('SELECT id, name, mobile, isPaid, isApproved, status FROM partners');
    console.log(`Found ${rows.length} partners in the database:`);
    rows.forEach(r => {
      console.log(`ID: ${r.id} | Name: ${r.name} | Phone: ${r.mobile} | isPaid: ${r.isPaid} | isApproved: ${r.isApproved} | status: ${r.status}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error fetching partners:', err);
    process.exit(1);
  }
}

main();
