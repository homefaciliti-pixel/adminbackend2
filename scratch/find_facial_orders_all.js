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
    console.log('Searching in node_orders...');
    const [rows1] = await connection.query(`
      SELECT * FROM node_orders 
      WHERE serviceName LIKE '%Facial%' OR serviceName LIKE '%Grooming%' OR serviceName LIKE '%Face%'
    `);
    console.log(`Found ${rows1.length} rows in node_orders:`, rows1);

    console.log('\nSearching in orders...');
    const [rows2] = await connection.query(`
      SELECT * FROM orders 
      WHERE address LIKE '%Facial%' OR remark LIKE '%Facial%' OR order_number LIKE '%Facial%'
    `);
    console.log(`Found ${rows2.length} rows in orders (by columns):`, rows2);

    // Let's also check if there is any other column in orders that has facial or grooming
    const [allOrders] = await connection.query('SELECT * FROM orders LIMIT 200');
    console.log('\nScanning recent orders...');
    allOrders.forEach(o => {
      const address = o.address || '';
      const remark = o.remark || '';
      if (address.toLowerCase().includes('facial') || remark.toLowerCase().includes('facial') || address.toLowerCase().includes('face') || remark.toLowerCase().includes('face')) {
        console.log(`- ID: ${o.id}, Address: ${address}, Remark: ${remark}, Status: ${o.status}`);
      }
    });

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
