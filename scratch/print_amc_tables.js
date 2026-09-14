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
    console.log('--- node_amc_visits ---');
    const [visits] = await connection.query('SELECT * FROM node_amc_visits');
    console.log(visits);

    console.log('--- node_amc_partner_payments ---');
    const [payments] = await connection.query('SELECT * FROM node_amc_partner_payments');
    console.log(payments);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
