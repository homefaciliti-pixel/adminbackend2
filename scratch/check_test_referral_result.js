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
    // 1. Check new partner referredBy and referral_code columns
    const [partners] = await connection.query(
      "SELECT id, name, referredBy, referral_code FROM node_partners WHERE id = 181"
    );
    console.log('--- Partner 181 ---');
    console.log(partners);

    // 2. Check node_referrals
    const [referrals] = await connection.query(
      "SELECT * FROM node_referrals WHERE referred_id = 181"
    );
    console.log('--- node_referrals ---');
    console.log(referrals);

    // 3. Check node_referral_earnings
    const [earnings] = await connection.query(
      "SELECT * FROM node_referral_earnings WHERE from_partner_id = 181"
    );
    console.log('--- node_referral_earnings ---');
    console.log(earnings);

    // 4. Check Govind's lockedWallet
    const [govind] = await connection.query(
      "SELECT id, name, lockedWallet FROM node_partners WHERE id = 171"
    );
    console.log('--- Govind (ID 171) wallet ---');
    console.log(govind);

    // Clean up test records
    await connection.query("DELETE FROM node_referral_earnings WHERE from_partner_id = 181");
    await connection.query("DELETE FROM node_referrals WHERE referred_id = 181");
    await connection.query("DELETE FROM node_partners WHERE id = 181");
    await connection.query("UPDATE node_partners SET lockedWallet = lockedWallet - 500.00 WHERE id = 171");
    console.log('Cleanup completed successfully.');

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
