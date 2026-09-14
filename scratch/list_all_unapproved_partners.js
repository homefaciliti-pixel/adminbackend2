const db = require('../db');

async function main() {
  try {
    const [rows] = await db.query('SELECT id, name, mobile, isPaid, isApproved, status, createdAt FROM partners WHERE isPaid = 0 OR isApproved = 0 ORDER BY id DESC');
    console.log('All unapproved or unpaid partners (Total:', rows.length, '):');
    rows.forEach(p => {
      console.log(`ID: ${p.id} | Name: "${p.name}" | Mobile: "${p.mobile}" | isPaid: ${p.isPaid} | isApproved: ${p.isApproved} | status: ${p.status} | Registered: ${p.createdAt}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
