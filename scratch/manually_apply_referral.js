const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  const referrerId = 176; // Active Partner (HF000176)
  const referredId = 184; // Rahul Choudhary (9116919356)
  const refCode = 'HF000176';

  try {
    console.log(`Manually applying referral: Referrer ${referrerId} -> Referred ${referredId}`);

    // 1. Update referred partner's referredBy field
    const [upPartner] = await connection.query(
      "UPDATE node_partners SET referredBy = ? WHERE id = ?",
      [referrerId, referredId]
    );
    console.log('Updated node_partners referredBy:', upPartner.affectedRows);

    // 2. Insert into node_referrals
    const deadline = new Date('9999-12-31T23:59:59Z');
    const [insReferral] = await connection.query(
      `INSERT INTO node_referrals
        (referrer_id, referred_id, referral_code, status, locked_reward, orders_done, unlock_deadline)
        VALUES (?, ?, ?, 'pending', 500.00, 0, ?)`,
      [referrerId, referredId, refCode, deadline]
    );
    console.log('Inserted node_referrals row:', insReferral.insertId);

    // 3. Insert into node_referral_earnings
    const [insEarnings] = await connection.query(
      `INSERT INTO node_referral_earnings
        (partner_id, from_partner_id, type, amount, status, referral_id, level)
        VALUES (?, ?, 'referral_bonus', 500.00, 'locked', ?, 1)`,
      [referrerId, referredId, insReferral.insertId]
    );
    console.log('Inserted node_referral_earnings row:', insEarnings.insertId);

    // 4. Update referrer's lockedWallet
    const [upReferrer] = await connection.query(
      "UPDATE node_partners SET lockedWallet = lockedWallet + 500.00 WHERE id = ?",
      [referrerId]
    );
    console.log("Updated referrer's lockedWallet:", upReferrer.affectedRows);

    // 5. Verify referrer's wallet balances
    const [refDetails] = await connection.query(
      "SELECT id, name, lockedWallet, availableWallet FROM node_partners WHERE id = ?",
      [referrerId]
    );
    console.log('Updated Referrer Wallet Details:', refDetails);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
