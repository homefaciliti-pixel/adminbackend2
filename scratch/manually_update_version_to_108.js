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
    console.log('--- Manually Updating Android version in DB to 1.0.8 ---');

    const [updateRes] = await connection.query(
      "UPDATE settings_config SET value = '1.0.8' WHERE `key` = 'android_latest_version'"
    );
    console.log('Update result:', updateRes);

    const [rows] = await connection.query(
      "SELECT * FROM settings_config"
    );
    console.log('Updated settings_config table:', rows);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
