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
    // Find all Anil named partners in node_users_v2
    console.log('All users with name Anil in node_users_v2:');
    const [users] = await connection.query(`SELECT * FROM node_users_v2 WHERE name LIKE '%Anil%'`);
    users.forEach(u => console.log(`- Name: ${u.name}, Phone: ${u.phone}`));

    // Search in node_partners table
    console.log('\nSearching node_partners for Anil (83698943)...');
    try {
      const [partners] = await connection.query(`
        SELECT * FROM node_partners WHERE phone LIKE '%83698943%' OR name LIKE '%Anil%'
      `);
      partners.forEach(p => console.log(`- ID: ${p.id}, Name: ${p.name}, Phone: ${p.phone}`));
    } catch(e) {
      console.log('node_partners table not found:', e.message);
    }

    // Search in partners (Laravel) table
    console.log('\nSearching partners (Laravel) for Anil (83698943)...');
    try {
      const [partners2] = await connection.query(`
        SELECT id, name, mobile_number FROM partners WHERE mobile_number LIKE '%83698943%' OR name LIKE '%Anil%'
      `);
      partners2.forEach(p => console.log(`- ID: ${p.id}, Name: ${p.name}, Phone: ${p.mobile_number}`));
    } catch(e) {
      console.log('partners table error:', e.message);
    }

    // Now restore order 595 with Anil as vendor
    console.log('\nRestoring order 595 to Assigned with vendor Anil...');
    const vendorName = 'Anil';
    const vendorPhone = '8369894300'; // cleaned from 83698943 (need full 10 digit)

    const [res] = await connection.query(`
      UPDATE node_orders_v2 
      SET status = 'Assigned', 
          bookingStatus = 'assigned',
          cancelReason = NULL,
          partnerName = ?,
          partnerPhone = ?
      WHERE id = 595
    `, [vendorName, '83698943']);

    console.log(`Affected rows: ${res.affectedRows}`);

    // Verify
    const [row] = await connection.query('SELECT id, serviceName, status, partnerName, partnerPhone, cancelReason FROM node_orders_v2 WHERE id = 595');
    console.log('\nOrder 595 after restore:', row[0]);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
