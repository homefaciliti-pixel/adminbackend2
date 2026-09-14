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
    const [node] = await connection.query("SELECT id, name, mobile, category FROM node_partners WHERE name LIKE '%carpenter%'");
    console.log('Search in node_partners:');
    node.forEach(r => console.log(r));

    const [laravel] = await connection.query("SELECT id, name, mobile_number, category_id FROM users WHERE name LIKE '%carpenter%'");
    console.log('\nSearch in users (Laravel):');
    laravel.forEach(r => console.log(r));

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
