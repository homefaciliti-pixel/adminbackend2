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
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(r => Object.values(r)[0]);

    console.log('Searching for ID 591 in all tables...');

    for (const table of tableNames) {
      try {
        // First check if column 'id' exists
        const [columns] = await connection.query(`DESCRIBE \`${table}\``);
        const hasId = columns.some(c => c.Field.toLowerCase() === 'id');
        
        if (hasId) {
          const [rows] = await connection.query(`SELECT * FROM \`${table}\` WHERE id = ?`, [591]);
          if (rows.length > 0) {
            console.log(`\n🎉 Found in table "${table}":`, rows[0]);
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }

    console.log('\nSearch complete.');
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
