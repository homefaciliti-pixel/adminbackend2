const db = require('../db');
const bcrypt = require('bcryptjs');

async function main() {
  try {
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);
    const testPartners = ['Govind', 'Mahesh Kumar', 'Amitkumar'];

    console.log('🔄 Setting password to "123456" for test partners:');
    for (const name of testPartners) {
      const [res] = await db.query(
        'UPDATE partners SET password = ? WHERE name = ?',
        [hashedPassword, name]
      );
      console.log(`Updated password for ${name}: ${res.affectedRows} row(s) updated.`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting passwords:', error);
    process.exit(1);
  }
}

main();
