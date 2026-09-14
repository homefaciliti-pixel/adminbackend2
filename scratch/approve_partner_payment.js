const db = require('../db');

async function main() {
  try {
    const phone = '8450921692';
    // 1. Fetch partner details
    const [rows] = await db.query('SELECT id, name, mobile, isPaid, isApproved, status FROM partners WHERE mobile = ?', [phone]);
    if (rows.length === 0) {
      console.log(`No partner found with phone: ${phone}`);
      process.exit(1);
    }

    const partner = rows[0];
    console.log('Partner before approval:', partner);

    // 2. Approve payment (isPaid = 1, isApproved = 1, status = 1)
    await db.query('UPDATE partners SET isPaid = 1, isApproved = 1, status = 1 WHERE id = ?', [partner.id]);
    console.log('Update query executed successfully!');

    // 3. Fetch updated partner details
    const [updatedRows] = await db.query('SELECT id, name, mobile, isPaid, isApproved, status FROM partners WHERE id = ?', [partner.id]);
    console.log('Partner after approval:', updatedRows[0]);

    process.exit(0);
  } catch (err) {
    console.error('Error approving partner payment:', err);
    process.exit(1);
  }
}

main();
