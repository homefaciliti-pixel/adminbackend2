const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  console.log('Starting hotfix loop to keep android version at 1.0.8...');

  const interval = setInterval(async () => {
    try {
      await connection.query(
        "UPDATE node_settings_config SET value = '1.0.8' WHERE `key` = 'android_latest_version'"
      );
    } catch (err) {
      console.error('Update error in loop:', err.message);
    }
  }, 500);

  // Stop after 3 minutes (180000 ms)
  setTimeout(async () => {
    clearInterval(interval);
    await connection.end();
    console.log('Hotfix loop stopped.');
  }, 180000);
}

run();
