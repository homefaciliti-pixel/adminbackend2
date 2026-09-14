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
    // 1. Check partners table
    const [pRows] = await connection.query(
      "SELECT id, name, mobile, isApproved, isPaid, status FROM partners WHERE mobile = ? OR mobile LIKE ?",
      [mobile, `%${mobile}`]
    );
    console.log('Current partners table data:', pRows);

    if (pRows.length > 0) {
      const pId = pRows[0].id;
      const [pUpdateRes] = await connection.query(
        "UPDATE partners SET isPaid = 1, isApproved = 1, status = 1 WHERE id = ?",
        [pId]
      );
      console.log('partners table Update Result:', pUpdateRes);
    }

    // 2. Check node_partners table
    const [npRows] = await connection.query(
      "SELECT id, name, mobile, isApproved, isPaid, status FROM node_partners WHERE mobile = ? OR mobile LIKE ?",
      [mobile, `%${mobile}`]
    );
    console.log('Current node_partners table data:', npRows);

    if (npRows.length > 0) {
      const npId = npRows[0].id;
      const [npUpdateRes] = await connection.query(
        "UPDATE node_partners SET isPaid = 1, isApproved = 1, status = 1 WHERE id = ?",
        [npId]
      );
      console.log('node_partners table Update Result:', npUpdateRes);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
