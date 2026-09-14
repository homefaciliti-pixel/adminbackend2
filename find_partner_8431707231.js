const mysql = require('mysql2/promise');

async function run() {
  const mobile = '8431707231';

  const pool = await mysql.createPool({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  try {
    const [nodeRows] = await pool.query(
      "SELECT id, name, email, mobile, isApproved, isPaid FROM node_partners WHERE mobile LIKE ?",
      [`%${mobile}%`]
    );
    console.log('node_partners found:', nodeRows.length);
    nodeRows.forEach(r => console.log(`  [ID ${r.id}] ${r.name} | mobile: ${r.mobile} | isApproved: ${r.isApproved} | isPaid: ${r.isPaid}`));

    const [laravelRows] = await pool.query(
      "SELECT id, name, email, mobile_number, is_approval, payment_status FROM homef4fw_homefaci.users WHERE mobile_number LIKE ? AND role_id = 2",
      [`%${mobile}%`]
    );
    console.log('\nusers (Laravel) found:', laravelRows.length);
    laravelRows.forEach(r => console.log(`  [ID ${r.id}] ${r.name} | mobile_number: ${r.mobile_number} | is_approval: ${r.is_approval} | payment_status: ${r.payment_status}`));

  } finally {
    await pool.end();
  }
}

run().catch(console.error);
