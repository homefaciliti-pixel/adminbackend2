const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  const newPhone = '9116919356';
  const newPhoneWithoutPrefix = '9116919356';

  try {
    // 1. Find new partner in node_partners
    const [partners] = await connection.query(
      "SELECT id, name, mobile, referredBy, isApproved, isPaid, createdAt FROM node_partners WHERE mobile LIKE ?",
      [`%${newPhone}%`]
    );
    console.log('New partner(s) found in node_partners:', partners);

    if (partners.length > 0) {
      const newPartner = partners[0];
      const newPartnerId = newPartner.id;

      // 2. Check node_referrals
      const [referrals] = await connection.query(
        "SELECT * FROM node_referrals WHERE referred_id = ?",
        [newPartnerId]
      );
      console.log('node_referrals entry:', referrals);

      // 3. Check node_referral_earnings
      const [earnings] = await connection.query(
        "SELECT * FROM node_referral_earnings WHERE from_partner_id = ?",
        [newPartnerId]
      );
      console.log('node_referral_earnings entry:', earnings);

      // 4. Check referrer details
      if (newPartner.referredBy) {
        const [referrer] = await connection.query(
          "SELECT id, name, referral_code, isApproved, lockedWallet, availableWallet FROM node_partners WHERE id = ?",
          [newPartner.referredBy]
        );
        console.log('Referrer details:', referrer);
      }
    } else {
      console.log('No partner found with mobile 9116919356 in node_partners.');
      
      // Let's search legacy users table
      const [users] = await connection.query(
        "SELECT id, name, mobile_number, status, payment_status, is_approval FROM users WHERE mobile_number LIKE ?",
        [`%${newPhone}%`]
      );
      console.log('Users found in legacy users table:', users);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
