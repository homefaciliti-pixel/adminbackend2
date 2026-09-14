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
    const [rows] = await connection.query(`
      SELECT COUNT(*) as count FROM users 
      WHERE role_id = 2 AND (name IS NULL OR name = '')
    `);
    console.log(`Laravel partners with blank/null name: ${rows[0].count}`);

    const [sample] = await connection.query(`
      SELECT id, mobile_number FROM users 
      WHERE role_id = 2 AND (name IS NULL OR name = '')
      LIMIT 5
    `);
    console.log('Sample IDs with blank/null name:');
    sample.forEach(r => console.log(`- ID: ${r.id}, Mobile: ${r.mobile_number}`));

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
