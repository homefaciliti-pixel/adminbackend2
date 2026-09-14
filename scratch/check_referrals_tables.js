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
    const [cols1] = await connection.query("DESCRIBE node_referrals");
    console.log('--- node_referrals schema ---');
    console.log(cols1);

    const [cols2] = await connection.query("DESCRIBE node_referral_earnings");
    console.log('--- node_referral_earnings schema ---');
    console.log(cols2);

    const [referrals] = await connection.query("SELECT * FROM node_referrals ORDER BY id DESC LIMIT 5");
    console.log('--- node_referrals last 5 rows ---');
    console.log(referrals);

    const [earnings] = await connection.query("SELECT * FROM node_referral_earnings ORDER BY id DESC LIMIT 5");
    console.log('--- node_referral_earnings last 5 rows ---');
    console.log(earnings);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
