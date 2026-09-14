const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  const referrerId = 176; // Swayam Rishabh
  const referredId = 187; // Vaibhav Sharma
  const refCode = 'HF000176';
  const deadline = new Date('9999-12-31T23:59:59Z');

  try {
    console.log('--- Manually Linking Referral ---');

    // 1. Update referredBy in node_partners
    const [updatePartner] = await connection.query(
      "UPDATE node_partners SET referredBy = ? WHERE id = ?",
      [referrerId, referredId]
    );
    console.log('Update referredBy result:', updatePartner);

    // 2. Insert into node_referrals
    const [insertReferral] = await connection.query(
      `INSERT IGNORE INTO node_referrals
        (referrer_id, referred_id, referral_code, status, locked_reward, orders_done, unlock_deadline)
        VALUES (?, ?, ?, 'pending', 500.00, 0, ?)`,
      [referrerId, referredId, refCode, deadline]
    );
    console.log('Insert node_referrals result:', insertReferral);

    // 3. Get the referral ID
    const [refRows] = await connection.query(
      "SELECT id FROM node_referrals WHERE referrer_id = ? AND referred_id = ? LIMIT 1",
      [referrerId, referredId]
    );
    const referralId = refRows[0].id;
    console.log('Referral ID:', referralId);

    // 4. Insert into node_referral_earnings
    const [insertEarning] = await connection.query(
      `INSERT INTO node_referral_earnings
        (partner_id, from_partner_id, type, amount, status, referral_id, level)
        VALUES (?, ?, 'referral_bonus', 500.00, 'locked', ?, 1)`,
      [referrerId, referredId, referralId]
    );
    console.log('Insert earning result:', insertEarning);

    // 5. Update referrer's lockedWallet
    const [updateWallet] = await connection.query(
      "UPDATE node_partners SET lockedWallet = lockedWallet + 500.00 WHERE id = ?",
      [referrerId]
    );
    console.log('Update referrer lockedWallet result:', updateWallet);

    // 6. Verify referrer wallet
    const [refWallet] = await connection.query(
      "SELECT id, name, lockedWallet FROM node_partners WHERE id = ?",
      [referrerId]
    );
    console.log('Updated Referrer Wallet:', refWallet[0]);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
