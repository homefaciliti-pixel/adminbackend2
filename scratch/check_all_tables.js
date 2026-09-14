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
    const [rows] = await connection.query('SHOW TABLES');
    console.log('Tables in database:');
    rows.forEach(r => {
      const name = Object.values(r)[0];
      if (name.startsWith('node_') || name === 'uploaded_files' || name === 'categories' || name === 'services') {
        console.log(`- ${name}`);
      }
    });

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
