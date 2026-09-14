const mysql = require('mysql2/promise');

async function run() {
  const pool = await mysql.createPool({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  try {
    const [rows] = await pool.query(
      "SELECT id, name, mobile, cancelledBookings, totalBookings FROM node_partners WHERE name LIKE ?",
      ['%Birmaram%']
    );
    console.log('Partners matched Birmaram:', rows);
  } finally {
    await pool.end();
  }
}

run().catch(console.error);
