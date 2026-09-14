const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  const partialPhone = '7250642635';

  try {
    // 1. Search legacy users table
    const [users] = await connection.query(
      "SELECT id, name, mobile_number, status, payment_status, is_approval FROM users WHERE mobile_number LIKE ?",
      [`%${partialPhone}%`]
    );
    console.log('Legacy users found matching 7250642635:', users);

    if (users.length > 0) {
      const user = users[0];
      const [upRes1] = await connection.query(
        "UPDATE users SET mobile_number = ?, payment_status = 1, is_approval = '1', status = 1 WHERE id = ?",
        [`+91${partialPhone}`, user.id]
      );
      console.log(`Updated legacy users table: changed phone to +91${partialPhone}, status to paid & approved. (${upRes1.affectedRows} row affected)`);
    }

    // 2. Search partners table
    const [partners] = await connection.query(
      "SELECT id, name, mobile, countryCode, isPaid, isApproved FROM node_partners WHERE mobile LIKE ?",
      [`%${partialPhone}%`]
    );
    console.log('Partners found in node_partners matching 7250642635:', partners);

    if (partners.length > 0) {
      const partner = partners[0];
      const [upRes2] = await connection.query(
        "UPDATE node_partners SET mobile = ?, countryCode = '+91', isPaid = 1, isApproved = 1, status = 1 WHERE id = ?",
        [partialPhone, partner.id]
      );
      console.log(`Updated node_partners table: changed phone to ${partialPhone}, countryCode to +91, status to paid & approved. (${upRes2.affectedRows} row affected)`);
    } else {
      console.log('No matching record in node_partners yet. They will be auto-migrated on their first login.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
