const db = require('../db');

async function main() {
  try {
    console.log('🔄 Checking if payToCompany column already exists in partners table...');
    const [columns] = await db.query('DESCRIBE partners');
    const hasColumn = columns.some(col => col.Field === 'payToCompany');

    if (hasColumn) {
      console.log('✅ Column payToCompany already exists.');
    } else {
      console.log('➕ Adding payToCompany column to partners table...');
      await db.query('ALTER TABLE partners ADD COLUMN payToCompany DECIMAL(10, 2) NOT NULL DEFAULT 0.00');
      console.log('✅ Column payToCompany added successfully!');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Error executing migration:', error);
    process.exit(1);
  }
}

main();
