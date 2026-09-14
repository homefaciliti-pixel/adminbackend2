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
    // Search for partner Anil with phone containing 83698943
    console.log('Searching for vendor Anil (83698943)...');
    const [partners] = await connection.query(`
      SELECT * FROM node_users_v2 
      WHERE phone LIKE '%83698943%' OR name LIKE '%Anil%'
    `);
    console.log('Found partners:', partners.map(p => `ID: ${p.id}, Name: ${p.name}, Phone: ${p.phone}`));

    // Also check node_users_v2 with role = 2 (partners)
    const [partners2] = await connection.query(`
      SELECT * FROM node_users_v2 
      WHERE (phone LIKE '%83698943%' OR name LIKE '%Anil%') AND role = 2
    `);
    console.log('Found partners (role=2):', partners2.map(p => `ID: ${p.id}, Name: ${p.name}, Phone: ${p.phone}`));

    // Check order 595 current status
    const [order595] = await connection.query('SELECT * FROM node_orders_v2 WHERE id = 595');
    console.log('\nOrder 595 current status:');
    console.log(order595[0]);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
