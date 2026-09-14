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
    // Check order_items for IDs 290-310
    console.log('Checking order_items for IDs 290-310...');
    const [rows] = await connection.query(`
      SELECT id, order_id, service_name, status, service_date, time_slot 
      FROM order_items 
      WHERE id BETWEEN 290 AND 310 
      ORDER BY id
    `);
    console.log('order_items (290-310):');
    rows.forEach(r => console.log(`- ID: ${r.id}, Order: ${r.order_id}, Service: ${r.service_name}, Status: ${r.status}`));

    // Also check order_items for IDs 595-605
    console.log('\nChecking order_items for IDs 595-605...');
    const [rows2] = await connection.query(`
      SELECT id, order_id, service_name, status 
      FROM order_items 
      WHERE id BETWEEN 595 AND 605 
      ORDER BY id
    `);
    console.log('order_items (595-605):');
    rows2.forEach(r => console.log(`- ID: ${r.id}, Order: ${r.order_id}, Service: ${r.service_name}, Status: ${r.status}`));
    if (rows2.length === 0) console.log('No records found in 595-605.');

    // Check all order_items with Men/Spa/Facial/Grooming
    console.log('\nAll order_items with Men/Facial/Spa services:');
    const [rows3] = await connection.query(`
      SELECT id, order_id, service_name, status, created_at 
      FROM order_items 
      WHERE service_name LIKE '%Men%' OR service_name LIKE '%Facial%' OR service_name LIKE '%Spa%'
      ORDER BY id
    `);
    rows3.forEach(r => console.log(`- ID: ${r.id}, Order: ${r.order_id}, Service: ${r.service_name}, Status: ${r.status}, Created: ${r.created_at}`));

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
