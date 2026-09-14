const mysql = require('mysql2/promise');

async function run() {
  const mobile = '9694380887';
  const countryCodeVal = '+91';

  const pool = await mysql.createPool({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  try {
    const dbName = 'homef4fw_homefaci';

    // 1. Fetch legacy user from Laravel users table
    const [legacyUsers] = await pool.query(
      `SELECT * FROM \`${dbName}\`.\`users\` 
       WHERE (mobile_number LIKE ? OR RIGHT(mobile_number, 10) = RIGHT(?, 10)) 
         AND role_id = 2`,
      [`%${mobile}%`, mobile]
    );

    if (legacyUsers.length === 0) {
      console.log('❌ Legacy partner not found in users table.');
      return;
    }

    const user = legacyUsers[0];
    console.log(`Found legacy partner: [ID ${user.id}] ${user.name}`);

    // 2. Resolve city, state, locality names
    let cityName = '';
    let stateName = '';
    let localityName = '';

    if (user.city_id) {
      const [cityRows] = await pool.query(`SELECT name FROM \`${dbName}\`.\`cities\` WHERE id = ?`, [user.city_id]);
      if (cityRows.length > 0) cityName = cityRows[0].name;
    }
    if (user.state_id) {
      const [stateRows] = await pool.query(`SELECT name FROM \`${dbName}\`.\`states\` WHERE id = ?`, [user.state_id]);
      if (stateRows.length > 0) stateName = stateRows[0].name;
    }
    if (user.locality_id) {
      const [locRows] = await pool.query(`SELECT name FROM \`${dbName}\`.\`localities\` WHERE id = ?`, [user.locality_id]);
      if (locRows.length > 0) localityName = locRows[0].name;
    }

    // Resolve category/subcategory names
    let categoryName = '';
    let subCategoryName = '';
    if (user.category_id) {
      const [catRows] = await pool.query(`SELECT title FROM \`${dbName}\`.\`categories\` WHERE id = ?`, [user.category_id]);
      if (catRows.length > 0) categoryName = catRows[0].title;
    }
    if (user.sub_category_id) {
      const [subCatRows] = await pool.query(`SELECT title FROM \`${dbName}\`.\`categories\` WHERE id = ?`, [user.sub_category_id]);
      if (subCatRows.length > 0) subCategoryName = subCatRows[0].title;
    }

    // 3. Check if already exists in node_partners
    const [existing] = await pool.query(
      "SELECT id FROM node_partners WHERE mobile = ?",
      [mobile]
    );

    if (existing.length > 0) {
      console.log(`Partner already exists in node_partners (ID: ${existing[0].id}). Updating instead...`);
      const [updateRes] = await pool.query(
        `UPDATE node_partners SET 
          isApproved = 1, isPaid = 1, status = 1, password = ?
         WHERE mobile = ?`,
        [user.password, mobile]
      );
      console.log(`✅ node_partners updated: ${updateRes.affectedRows} row(s)`);
    } else {
      console.log('Migrating partner to node_partners...');
      const [insertRes] = await pool.query(
        `INSERT INTO node_partners (
          name, email, mobile, countryCode, password, city, state, locality, address,
          image, status, isApproved, isPaid, gender, experience, services,
          aadhaarNumber, aadharFront, aadharBack, panNumber, panImage,
          bankName, accountNumber, ifscCode, accountHolder, hasVehicle,
          walletBalance, totalEarnings, withdrawnAmount, createdAt, category, subCategory
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, 0.00, 0.00, NOW(), ?, ?)`,
        [
          user.name,
          user.email || '',
          mobile,
          countryCodeVal,
          user.password, // Preserve encrypted password
          cityName,
          stateName,
          localityName,
          user.address || '',
          user.image || '',
          user.gender || 'Male',
          user.experience ? user.experience.toString() : '0',
          user.service_id || '',
          user.aadhaar_number || '',
          user.aadhaar_front_image || '',
          user.aadhaar_back_image || '',
          user.pan_number || '',
          user.pan_image || '',
          user.bank_name || '',
          user.account_number || '',
          user.ifsc_code || '',
          user.account_holder_name || '',
          user.do_you_have_vehicle === 1 ? 'Yes' : 'No',
          categoryName,
          subCategoryName
        ]
      );
      console.log(`✅ node_partners inserted: ${insertRes.affectedRows} row(s)`);
    }

    // 4. Also update legacy users table status to approved & paid
    const [legacyRes] = await pool.query(
      `UPDATE \`${dbName}\`.\`users\` SET 
        is_approval = 1, payment_status = 1, status = 1 
       WHERE id = ?`,
      [user.id]
    );
    console.log(`✅ users (Laravel) updated: ${legacyRes.affectedRows} row(s)`);

    // Verification
    console.log('\n🔍 Verification after migration:');
    const [vNode] = await pool.query(
      "SELECT id, name, mobile, isApproved, isPaid, status FROM node_partners WHERE mobile = ?",
      [mobile]
    );
    const [vLaravel] = await pool.query(
      `SELECT id, name, mobile_number, is_approval, payment_status, status FROM \`${dbName}\`.\`users\` WHERE id = ?`,
      [user.id]
    );

    vNode.forEach(r => console.log(`  node_partners [ID ${r.id}] ${r.name} | mobile: ${r.mobile} | isApproved: ${r.isApproved} | isPaid: ${r.isPaid} | status: ${r.status}`));
    vLaravel.forEach(r => console.log(`  users [ID ${r.id}] ${r.name} | mobile: ${r.mobile_number} | isApproved: ${r.is_approval} | isPaid: ${r.payment_status} | status: ${r.status}`));

  } finally {
    await pool.end();
  }
}

run().catch(console.error);
