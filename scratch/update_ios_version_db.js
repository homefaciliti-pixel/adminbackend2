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
    // Insert or update ios_latest_version
    const [res] = await connection.query(
      `INSERT INTO settings_config (\`key\`, \`value\`) 
       VALUES ('ios_latest_version', '1.0.6') 
       ON DUPLICATE KEY UPDATE \`value\` = '1.0.6'`
    );
    console.log('Result for ios_latest_version update:', res);

    const [rows] = await connection.query(
      "SELECT * FROM settings_config"
    );
    console.log('Updated Settings config:', rows);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
