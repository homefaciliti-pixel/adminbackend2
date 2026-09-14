const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  const mobile = '8003671335';

  try {
    const [rows] = await connection.query(
      "SELECT id, name, mobile, isApproved, isPaid, status FROM node_partners WHERE mobile = ? OR mobile LIKE ?",
      [mobile, `%${mobile}`]
    );
    console.log('Current Partner Data:', rows);

    if (rows.length > 0) {
      const partnerId = rows[0].id;
      // Update partner to be paid and approved
      const [updateRes] = await connection.query(
        "UPDATE node_partners SET isPaid = 1, isApproved = 1, status = 1 WHERE id = ?",
        [partnerId]
      );
      console.log('Update Result:', updateRes);

      // Verify again
      const [updatedRows] = await connection.query(
        "SELECT id, name, mobile, isApproved, isPaid, status FROM node_partners WHERE id = ?",
        [partnerId]
      );
      console.log('Updated Partner Data:', updatedRows);
    } else {
      console.log('No partner found with mobile:', mobile);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
