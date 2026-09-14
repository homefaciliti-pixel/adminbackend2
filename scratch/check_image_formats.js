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
    const [node] = await connection.query("SELECT id, name, image FROM node_partners WHERE image IS NOT NULL AND image != '' LIMIT 5");
    console.log('Images in node_partners:');
    node.forEach(r => console.log(r));

    const [laravel] = await connection.query("SELECT id, name, image FROM users WHERE role_id = 2 AND image IS NOT NULL AND image != '' LIMIT 5");
    console.log('\nImages in users (Laravel):');
    laravel.forEach(r => console.log(r));

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
