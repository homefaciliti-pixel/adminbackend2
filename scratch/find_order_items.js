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
    const [cols] = await connection.query('DESCRIBE order_items');
    console.log('Columns in order_items:');
    cols.forEach(c => console.log(` - ${c.Field}`));

    console.log('\nSearching for facial or spa or grooming in order_items...');
    const [rows] = await connection.query('SELECT * FROM order_items');
    console.log(`Total rows in order_items: ${rows.length}`);
    rows.forEach(r => {
      const name = r.name || r.title || r.service_name || '';
      if (name.toLowerCase().includes('facial') || name.toLowerCase().includes('spa') || name.toLowerCase().includes('grooming')) {
        console.log(r);
      }
    });
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
