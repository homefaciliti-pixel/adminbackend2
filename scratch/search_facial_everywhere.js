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
    const targets = ['facial', 'grooming', 'men face'];
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(r => Object.values(r)[0]);

    console.log('Searching for "facial", "grooming", "men face" across all tables...');

    for (const table of tableNames) {
      if (table.includes('uploaded_files') || table.includes('cache') || table.includes('services')) {
        continue; // skip services list to only find bookings/orders/tickets
      }

      try {
        const [columns] = await connection.query(`DESCRIBE \`${table}\``);
        const charCols = columns.filter(c => {
          const type = c.Type.toLowerCase();
          return (type.includes('char') || type.includes('text')) && !type.includes('long') && !type.includes('medium');
        }).map(c => c.Field);
        
        if (charCols.length > 0) {
          for (const target of targets) {
            let whereClauses = charCols.map(col => `\`${col}\` LIKE ?`).join(' OR ');
            let params = charCols.map(() => `%${target}%`);
            const [rows] = await connection.query(`SELECT * FROM \`${table}\` WHERE ${whereClauses} LIMIT 5`, params);
            if (rows.length > 0) {
              console.log(`\n🎉 Found matching row for "${target}" in table "${table}":`, rows);
            }
          }
        }
      } catch (e) {
        // Ignore table errors
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
