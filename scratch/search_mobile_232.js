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
    const [node] = await connection.query("SELECT id, name, mobile, category FROM node_partners WHERE mobile LIKE '%0232%' OR mobile LIKE '%232%'");
    console.log('Search in node_partners:');
    node.forEach(r => console.log(r));

    const [laravel] = await connection.query("SELECT id, name, mobile_number, category_id FROM users WHERE role_id = 2 AND (mobile_number LIKE '%0232%' OR mobile_number LIKE '%232%')");
    console.log('\nSearch in users (Laravel):');
    laravel.forEach(r => console.log(r));

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
