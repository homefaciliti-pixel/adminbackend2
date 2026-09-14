const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  try {
    // 1. Update in legacy users table
    const [userRes] = await connection.query(
      "UPDATE users SET payment_status = 1, is_approval = '1', status = 1 WHERE mobile_number = ? AND role_id = 2",
      ['9462015852']
    );
    console.log('Updated legacy users table status:', userRes.affectedRows, 'rows affected.');

    // 2. Check if they exist in node_partners table
    const [partners] = await connection.query(
      "SELECT id FROM partners WHERE mobile = ?",
      ['9462015852']
    );

    if (partners.length > 0) {
      // Update existing record
      const [partnerRes] = await connection.query(
        "UPDATE partners SET isPaid = 1, isApproved = 1, status = 1 WHERE mobile = ?",
        ['9462015852']
      );
      console.log('Updated partners table status:', partnerRes.affectedRows, 'rows affected.');
    } else {
      console.log('Partner not yet migrated to partners table. Will migrate automatically on their first login!');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
