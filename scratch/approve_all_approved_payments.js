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
    // 1. Check legacy users table
    const [legacyApproved] = await connection.query(
      "SELECT id FROM users WHERE role_id = 2 AND is_approval = '1' AND (payment_status = 0 OR payment_status IS NULL)"
    );
    console.log('Legacy approved partners currently unpaid:', legacyApproved.length);

    // 2. Check partners table
    const [partnersApproved] = await connection.query(
      "SELECT id FROM node_partners WHERE isApproved = 1 AND (isPaid = 0 OR isPaid IS NULL)"
    );
    console.log('New partners currently approved but unpaid:', partnersApproved.length);

    // 3. Perform Updates
    if (legacyApproved.length > 0) {
      const [upRes1] = await connection.query(
        "UPDATE users SET payment_status = 1, status = 1 WHERE role_id = 2 AND is_approval = '1'"
      );
      console.log(`Updated legacy users: ${upRes1.affectedRows} row(s) updated to paid.`);
    } else {
      console.log('No unpaid legacy approved partners found.');
    }

    if (partnersApproved.length > 0) {
      const [upRes2] = await connection.query(
        "UPDATE node_partners SET isPaid = 1, status = 1 WHERE isApproved = 1"
      );
      console.log(`Updated node_partners: ${upRes2.affectedRows} row(s) updated to paid.`);
    } else {
      console.log('No unpaid new approved partners found.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
