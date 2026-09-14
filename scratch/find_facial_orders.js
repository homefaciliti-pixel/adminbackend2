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
    console.log('Searching for facial or grooming orders in node_orders_v2...');
    const [rows] = await connection.query(`
      SELECT * FROM node_orders_v2 
      WHERE serviceName LIKE '%Facial%' OR serviceName LIKE '%Grooming%' OR serviceName LIKE '%Face%'
    `);
    
    console.log(`Found ${rows.length} rows:`);
    rows.forEach(r => {
      console.log(`- ID: ${r.id}, Phone: ${r.userPhone}, Service: ${r.serviceName}, Status: ${r.status}, Price: ${r.price}, Date: ${r.date}, CancelReason: ${r.cancelReason}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
