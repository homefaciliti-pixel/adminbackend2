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
      SELECT u.id, u.name, u.mobile_number, u.category_id, u.state_id, u.city_id, u.locality_id
      FROM users u
      WHERE u.role_id = 2 AND u.is_approval = '0'
      LIMIT 10
    `);
    console.log('Sample Laravel pending partners:');
    rows.forEach(r => {
      console.log(`- ID: ${r.id}, Name: "${r.name}", Mobile: "${r.mobile_number}", CategoryID: ${r.category_id}, StateID: ${r.state_id}, CityID: ${r.city_id}, LocalityID: ${r.locality_id}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
