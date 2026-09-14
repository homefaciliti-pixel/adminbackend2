const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  const phone = '9799125006';
  const phoneWithPrefix1 = '+919799125006';
  const phoneWithPrefix2 = '919799125006';

  try {
    // 1. Check legacy users table
    const [users] = await connection.query(
      "SELECT id, name, mobile_number, status, payment_status, is_approval FROM users WHERE mobile_number IN (?, ?, ?)",
      [phone, phoneWithPrefix1, phoneWithPrefix2]
    );
    console.log('Legacy users found:', users);

    if (users.length > 0) {
      const user = users[0];
      const [upRes1] = await connection.query(
        "UPDATE users SET payment_status = 1, is_approval = '1', status = 1 WHERE id = ?",
        [user.id]
      );
      console.log(`Updated legacy users table: ${upRes1.affectedRows} row(s) updated.`);
    }

    // 2. Check partners table
    const [partners] = await connection.query(
      "SELECT id, name, mobile, isPaid, isApproved FROM node_partners WHERE mobile IN (?, ?, ?)",
      [phone, phoneWithPrefix1, phoneWithPrefix2]
    );
    console.log('Partners found in node_partners:', partners);

    if (partners.length > 0) {
      const partner = partners[0];
      const [upRes2] = await connection.query(
        "UPDATE node_partners SET isPaid = 1, isApproved = 1, status = 1 WHERE id = ?",
        [partner.id]
      );
      console.log(`Updated node_partners table: ${upRes2.affectedRows} row(s) updated.`);
    } else {
      console.log('Partner not in node_partners yet. They will be auto-migrated as paid and approved on their first login.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
