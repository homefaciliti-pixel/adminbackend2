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
    // 1. Update node_partners
    const [nodeRes] = await pool.query(
      "UPDATE node_partners SET isPaid = 1, status = 1 WHERE mobile LIKE ?",
      [`%${mobile}%`]
    );
    console.log(`✅ node_partners updated: ${nodeRes.affectedRows} row(s)`);

    // 2. Update Laravel users table
    const [laravelRes] = await pool.query(
      "UPDATE homef4fw_homefaci.users SET payment_status = 1, status = 1 WHERE mobile_number LIKE ? AND role_id = 2",
      [`%${mobile}%`]
    );
    console.log(`✅ users (Laravel) updated: ${laravelRes.affectedRows} row(s)`);

    // 3. Verification
    console.log('\n🔍 Verification after update:');
    const [vNode] = await pool.query(
      "SELECT id, name, mobile, isApproved, isPaid, status FROM node_partners WHERE mobile LIKE ?",
      [`%${mobile}%`]
    );
    const [vLaravel] = await pool.query(
      "SELECT id, name, mobile_number, is_approval, payment_status, status FROM homef4fw_homefaci.users WHERE mobile_number LIKE ? AND role_id = 2",
      [`%${mobile}%`]
    );

    vNode.forEach(r => console.log(`  node_partners [ID ${r.id}] ${r.name} | mobile: ${r.mobile} | isApproved: ${r.isApproved} | isPaid: ${r.isPaid} | status: ${r.status}`));
    vLaravel.forEach(r => console.log(`  users [ID ${r.id}] ${r.name} | mobile: ${r.mobile_number} | isApproved: ${r.is_approval} | isPaid: ${r.payment_status} | status: ${r.status}`));

  } finally {
    await pool.end();
  }
}

run().catch(console.error);
