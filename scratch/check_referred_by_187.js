const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  const referredId = 187;

  try {
    // 1. Check node_partners table referredBy column
    const [pRows] = await connection.query(
      "SELECT id, name, mobile, referredBy FROM node_partners WHERE id = ?",
      [referredId]
    );
    console.log('Partner referredBy value:', pRows[0]);

    // 2. Check node_referrals table
    const [refRows] = await connection.query(
      "SELECT * FROM node_referrals WHERE referred_id = ?",
      [referredId]
    );
    console.log('Referral link table entry:', refRows);

    // 3. Check node_referrer_clicks
    const [clickRows] = await connection.query(
      "SELECT * FROM node_referrer_clicks ORDER BY created_at DESC LIMIT 5"
    );
    console.log('Recent clicks in node_referrer_clicks:', clickRows);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
