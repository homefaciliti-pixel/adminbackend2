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
    const [rows] = await connection.query('SELECT DISTINCT is_approval, COUNT(*) as count FROM users WHERE role_id = 2 GROUP BY is_approval');
    console.log('Distinct is_approval values in users (Laravel):');
    rows.forEach(r => console.log(`- Value: ${r.is_approval} (Type: ${typeof r.is_approval}), Count: ${r.count}`));

    const [nodeRows] = await connection.query('SELECT DISTINCT isApproved, COUNT(*) as count FROM node_partners GROUP BY isApproved');
    console.log('\nDistinct isApproved values in node_partners:');
    nodeRows.forEach(r => console.log(`- Value: ${r.isApproved} (Type: ${typeof r.isApproved}), Count: ${r.count}`));
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
