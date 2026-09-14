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
      SELECT u.id, u.name, u.state_id, u.city_id, s.name as stateName, c.name as cityName
      FROM users u
      LEFT JOIN states s ON u.state_id = s.id
      LEFT JOIN cities c ON u.city_id = c.id
      WHERE u.role_id = 2 AND (c.name IS NULL OR s.name IS NULL)
      LIMIT 10
    `);
    console.log('Laravel partners with null state or city name:');
    rows.forEach(r => {
      console.log(`- ID: ${r.id}, Name: "${r.name}", StateID: ${r.state_id}, CityID: ${r.city_id}, StateName: "${r.stateName}", CityName: "${r.cityName}"`);
    });

    const [total] = await connection.query(`
      SELECT COUNT(*) as count
      FROM users u
      LEFT JOIN states s ON u.state_id = s.id
      LEFT JOIN cities c ON u.city_id = c.id
      WHERE u.role_id = 2 AND (c.name IS NULL OR s.name IS NULL)
    `);
    console.log(`Total Laravel partners with null state/city name: ${total[0].count}`);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
