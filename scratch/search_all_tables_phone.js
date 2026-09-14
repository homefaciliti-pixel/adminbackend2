const db = require('../db');

async function main() {
  try {
    const phone = '8450921692';
    const [tables] = await db.query('SHOW TABLES');
    
    for (const row of tables) {
      const tableName = Object.values(row)[0];
      try {
        const [cols] = await db.query(`SHOW COLUMNS FROM ${tableName}`);
        const textCols = cols.filter(c => c.Type.includes('char') || c.Type.includes('text') || c.Type.includes('varchar'));
        
        if (textCols.length > 0) {
          const conditions = textCols.map(c => `\`${c.Field}\` LIKE ?`).join(' OR ');
          const params = textCols.map(() => `%${phone}%`);
          const [matches] = await db.query(`SELECT * FROM ${tableName} WHERE ${conditions} LIMIT 5`, params);
          if (matches.length > 0) {
            console.log(`Table "${tableName}" has matches:`, matches);
          }
        }
      } catch (err) {
        // Skip tables that fail or don't match structure
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
