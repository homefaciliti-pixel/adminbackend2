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
    // Restore orders 587 and 588 which were Cancelled yesterday before 4PM
    const ids = [587, 588];
    console.log(`Restoring orders ${ids.join(', ')} to Pending status...`);

    const [res] = await connection.query(`
      UPDATE node_orders_v2 
      SET status = 'Pending', cancelReason = NULL 
      WHERE id IN (?, ?)
    `, ids);

    console.log(`Affected rows: ${res.affectedRows}`);
    if (res.affectedRows > 0) {
      console.log(`Successfully restored orders ${ids.join(', ')} to Pending.`);
    }

    // Verify
    const [rows] = await connection.query(`
      SELECT id, serviceName, status, cancelReason FROM node_orders_v2 WHERE id IN (?, ?)
    `, ids);
    console.log('\nVerification:');
    rows.forEach(r => console.log(`- ID: ${r.id}, Service: ${r.serviceName}, Status: ${r.status}, CancelReason: ${r.cancelReason}`));
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
