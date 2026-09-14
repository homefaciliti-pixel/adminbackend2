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
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS node_referrer_clicks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(100) NOT NULL,
        referral_code VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ip_created (ip_address, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    
    await connection.query(createTableQuery);
    console.log('Successfully verified/created node_referrer_clicks table.');
  } catch (err) {
    console.error('Error creating table:', err.message);
  } finally {
    await connection.end();
  }
}

run();
