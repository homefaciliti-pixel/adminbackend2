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
    const targets = ['860487', '778857'];
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(r => Object.values(r)[0]);

    console.log('Searching for targets across all tables (excluding uploaded files)...');

    for (const table of tableNames) {
      if (table.includes('uploaded_files') || table.includes('cache')) {
        continue;
      }

      try {
        const [columns] = await connection.query(`DESCRIBE \`${table}\``);
        const hasId = columns.some(c => c.Field.toLowerCase() === 'id');
        const charCols = columns.filter(c => {
          const type = c.Type.toLowerCase();
          return (type.includes('char') || type.includes('text')) && !type.includes('long') && !type.includes('medium');
        }).map(c => c.Field);
        
        for (const target of targets) {
          if (hasId) {
            const [rows] = await connection.query(`SELECT * FROM \`${table}\` WHERE id = ?`, [target]);
            if (rows.length > 0) {
              console.log(`\n🎉 Found by ID = ${target} in table "${table}":`, rows[0]);
            }
          }

          if (charCols.length > 0) {
            let whereClauses = charCols.map(col => `\`${col}\` LIKE ?`).join(' OR ');
            let params = charCols.map(() => `%${target}%`);
            const [rows] = await connection.query(`SELECT * FROM \`${table}\` WHERE ${whereClauses} LIMIT 5`, params);
            if (rows.length > 0) {
              console.log(`\n🎉 Found by substring = ${target} in table "${table}":`, rows);
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
