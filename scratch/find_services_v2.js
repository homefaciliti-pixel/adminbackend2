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
    const [cols] = await connection.query('DESCRIBE node_services');
    console.log('Columns:');
    cols.forEach(c => console.log(` - ${c.Field}`));

    const [services] = await connection.query('SELECT * FROM node_services LIMIT 100');
    console.log('\nSome services:');
    services.forEach(s => {
      // Find the name column. It might be 'name' or 'title' or 'service_name'
      const name = s.title || s.name || s.service_name || s.serviceName;
      if (name && (name.toLowerCase().includes('ro') || name.toLowerCase().includes('wash') || name.toLowerCase().includes('machine'))) {
        console.log(`- ID: ${s.id}, Name: ${name}, Price: ${s.price || s.servicePrice}, Description: ${s.description ? s.description.substring(0, 50) + '...' : 'none'}`);
      }
    });
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
