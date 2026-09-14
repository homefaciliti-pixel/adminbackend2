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
    const deadline = new Date('9999-12-31T23:59:59Z');
    console.log('JS Date object:', deadline);
    console.log('JS Date string:', deadline.toISOString());

    // Try inserting into node_referrals
    const [res] = await connection.query(
      `INSERT INTO node_referrals
        (referrer_id, referred_id, referral_code, status, locked_reward, orders_done, unlock_deadline)
        VALUES (?, ?, ?, 'pending', 500.00, 0, ?)`,
      [1, 999, 'TESTCODE', deadline]
    );
    console.log('Insert Result:', res);
  } catch (err) {
    console.error('ERROR during insert:', err.message);
  } finally {
    await connection.end();
  }
}

run();
