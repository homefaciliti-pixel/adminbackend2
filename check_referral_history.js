const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'backend/.env' });

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: false }
  });

  console.log('=== REFERRALS TABLE ===');
  const [refs] = await db.query(`
    SELECT r.*, 
      p1.name AS referrer_name, p1.phone AS referrer_phone, p1.email AS referrer_email,
      p2.name AS referred_name, p2.phone AS referred_phone
    FROM node_referrals r
    JOIN node_partners p1 ON r.referrer_id = p1.id
    JOIN node_partners p2 ON r.referred_id = p2.id
    LIMIT 20
  `);
  
  if (refs.length === 0) {
    console.log('No referrals found in node_referrals table.');
  } else {
    refs.forEach(r => {
      console.log(`\nReferral ID: ${r.id}`);
      console.log(`  Referrer: ${r.referrer_name} | Phone: ${r.referrer_phone} | Email: ${r.referrer_email} | Partner ID: ${r.referrer_id}`);
      console.log(`  Referred: ${r.referred_name} | Phone: ${r.referred_phone} | Partner ID: ${r.referred_id}`);
      console.log(`  Code: ${r.referral_code} | Status: ${r.status} | Orders Done: ${r.orders_done} | Locked: ₹${r.locked_reward}`);
    });
  }

  console.log('\n=== REFERRAL EARNINGS TABLE ===');
  const [earnings] = await db.query(`
    SELECT re.*, p.name, p.phone
    FROM node_referral_earnings re
    JOIN node_partners p ON re.partner_id = p.id
    LIMIT 20
  `);
  
  if (earnings.length === 0) {
    console.log('No referral earnings found.');
  } else {
    earnings.forEach(e => {
      console.log(`  Partner: ${e.name} | Phone: ${e.phone} | Amount: ₹${e.amount} | Type: ${e.type} | Status: ${e.status}`);
    });
  }

  await db.end();
}

main().catch(console.error);
