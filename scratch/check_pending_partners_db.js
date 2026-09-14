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
    // Check pending in node_partners
    const [nodeRows] = await connection.query('SELECT COUNT(*) AS count FROM node_partners WHERE isApproved = 0');
    console.log(`Pending partners in node_partners: ${nodeRows[0].count}`);

    // Check pending in users (Laravel)
    const [laravelRows] = await connection.query('SELECT COUNT(*) AS count FROM users WHERE role_id = 2 AND is_approval = 0');
    console.log(`Pending partners in users (Laravel): ${laravelRows[0].count}`);

    // Let's get the status of some deleted or inactive partners, or check if there was a soft delete
    const [nodeAll] = await connection.query('SELECT COUNT(*) AS count FROM node_partners');
    console.log(`Total partners in node_partners: ${nodeAll[0].count}`);

    const [laravelAll] = await connection.query('SELECT COUNT(*) AS count FROM users WHERE role_id = 2');
    console.log(`Total partners in users (Laravel): ${laravelAll[0].count}`);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
