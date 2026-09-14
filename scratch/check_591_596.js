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
    console.log('Checking node_orders_v2 for IDs 591-596...');
    const [rows] = await connection.query(`
      SELECT id, userPhone, serviceName, price, status, cancelReason, date, timeSlot, createdAt
      FROM node_orders_v2 
      WHERE id BETWEEN 591 AND 596
      ORDER BY id
    `);
    console.log(`Found ${rows.length} rows:`);
    rows.forEach(r => {
      const ts = new Date(parseInt(r.createdAt));
      console.log(`- ID: ${r.id}, Phone: ${r.userPhone}, Service: ${r.serviceName}, Price: ${r.price}, Status: ${r.status}, CancelReason: ${r.cancelReason}, Date: ${r.date}, CreatedAt: ${ts.toLocaleString('en-IN', {timeZone:'Asia/Kolkata'})}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
