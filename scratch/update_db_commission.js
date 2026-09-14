const db = require('../db');

async function main() {
  try {
    console.log('🔄 Updating commission_rate setting to 25 in settings_config table...');
    await db.query(
      "INSERT INTO settings_config (`key`, `value`) VALUES ('commission_rate', '25') ON DUPLICATE KEY UPDATE `value` = '25'"
    );
    console.log('✅ Commission rate updated successfully to 25%!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating database:', error);
    process.exit(1);
  }
}

main();
