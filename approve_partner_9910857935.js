const mysql = require('mysql2/promise');

async function run() {
  const mobile = '9910857935';

  const pool = await mysql.createPool({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  try {
    // =====================
    // 1. Check node_partners
    // =====================
    const [nodeRows] = await pool.query(
      "SELECT id, name, email, mobile, isApproved, isPaid FROM node_partners WHERE mobile LIKE ?",
      [`%${mobile}%`]
    );
    console.log('node_partners found:', nodeRows.length);
    nodeRows.forEach(r => console.log(`  [ID ${r.id}] ${r.name} | isApproved: ${r.isApproved} | isPaid: ${r.isPaid}`));

    if (nodeRows.length > 0) {
      const [res] = await pool.query(
        "UPDATE node_partners SET isApproved = 1, isPaid = 1, status = 1 WHERE mobile LIKE ?",
        [`%${mobile}%`]
      );
      console.log(`✅ node_partners updated: ${res.affectedRows} row(s)`);
    }

    // =====================
    // 2. Check Laravel users
    // =====================
    const [laravelRows] = await pool.query(
      "SELECT id, name, email, mobile_number, is_approval, payment_status FROM homef4fw_homefaci.users WHERE mobile_number LIKE ? AND role_id = 2",
      [`%${mobile}%`]
    );
    console.log('\nusers (Laravel) found:', laravelRows.length);
    laravelRows.forEach(r => console.log(`  [ID ${r.id}] ${r.name} | is_approval: ${r.is_approval} | payment_status: ${r.payment_status}`));

    if (laravelRows.length > 0) {
      const [res] = await pool.query(
        "UPDATE homef4fw_homefaci.users SET is_approval = 1, payment_status = 1, status = 1 WHERE mobile_number LIKE ? AND role_id = 2",
        [`%${mobile}%`]
      );
      console.log(`✅ users (Laravel) updated: ${res.affectedRows} row(s)`);
    }

    if (nodeRows.length === 0 && laravelRows.length === 0) {
      console.log('❌ No partner found with mobile: ' + mobile);
    }

    // =====================
    // 3. Verify
    // =====================
    console.log('\n🔍 Verification:');
    const [vNode] = await pool.query(
      "SELECT id, name, mobile, isApproved, isPaid FROM node_partners WHERE mobile LIKE ?",
      [`%${mobile}%`]
    );
    const [vLaravel] = await pool.query(
      "SELECT id, name, mobile_number, is_approval, payment_status FROM homef4fw_homefaci.users WHERE mobile_number LIKE ? AND role_id = 2",
      [`%${mobile}%`]
    );
    vNode.forEach(r => console.log(`  node_partners [ID ${r.id}] ${r.name} | isApproved: ${r.isApproved} | isPaid: ${r.isPaid}`));
    vLaravel.forEach(r => console.log(`  users [ID ${r.id}] ${r.name} | is_approval: ${r.is_approval} | payment_status: ${r.payment_status}`));

    console.log('\n✅ Done!');
  } finally {
    await pool.end();
  }
}

run().catch(console.error);
