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
    // Search in node_partners
    const [node] = await connection.query("SELECT id, name, mobile, category, state, city, locality FROM node_partners WHERE mobile LIKE '%9310%' OR mobile LIKE '%93107%'");
    console.log('Search in node_partners:');
    node.forEach(r => console.log(r));

    // Search in users (Laravel)
    const [laravel] = await connection.query("SELECT id, name, mobile_number, category_id, state_id, city_id, locality_id FROM users WHERE mobile_number LIKE '%9310%' OR mobile_number LIKE '%93107%'");
    console.log('\nSearch in users (Laravel):');
    laravel.forEach(r => console.log(r));

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
