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
    const [columns] = await connection.query("SHOW COLUMNS FROM users");
    console.log('Columns in users table:');
    columns.forEach(c => console.log(`- ${c.Field} (${c.Type})`));
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
