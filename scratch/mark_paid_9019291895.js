const db = require('../db');
async function main() {
  try {
    // Find partner
    const [rows] = await db.query("SELECT id, name, mobile, isPaid, isApproved FROM partners WHERE mobile = '9019291895' OR mobile LIKE '%9019291895%'");
    console.log('Found:', JSON.stringify(rows, null, 2));

    if (rows.length === 0) {
      console.log('Partner not found!');
      process.exit(0);
    }

    // Update isPaid = 1
    const [result] = await db.query("UPDATE partners SET isPaid = 1 WHERE mobile = '9019291895'");
    console.log('Updated rows:', result.affectedRows);

    // Verify
    const [verify] = await db.query("SELECT id, name, mobile, isPaid, isApproved FROM partners WHERE mobile = '9019291895'");
    console.log('After update:', JSON.stringify(verify, null, 2));

    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}
main();
