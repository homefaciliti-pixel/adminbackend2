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
    const [services] = await connection.query(`
      SELECT * FROM node_services 
      WHERE serviceName LIKE '%RO%' OR serviceName LIKE '%Washing%' OR serviceName LIKE '%Machine%'
    `);
    console.log('Matching services:');
    services.forEach(s => {
      console.log(`- ID: ${s.id}, Name: ${s.serviceName}, Price: ${s.price || s.servicePrice}, Description: ${s.description ? s.description.substring(0, 60) + '...' : 'none'}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
