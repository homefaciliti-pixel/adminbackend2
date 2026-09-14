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
    const [services] = await connection.query('SELECT * FROM node_services');
    console.log('Kitchen related services:');
    services.forEach(s => {
      const title = s.title || '';
      if (title.toLowerCase().includes('kitchen')) {
        console.log(`- ID: ${s.id}, Name: ${s.title}, Price: ${s.price}, Description: ${s.description ? s.description.substring(0, 50) + '...' : 'none'}`);
      }
    });
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
