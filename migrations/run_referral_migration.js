const db = require('./db');

(async () => {
  const stmts = [
    `ALTER TABLE node_partners
      ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS referredBy INT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS availableWallet DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS lockedWallet DECIMAL(10,2) NOT NULL DEFAULT 0.00`,

    `CREATE TABLE IF NOT EXISTS node_referrals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      referrer_id INT NOT NULL,
      referred_id INT NOT NULL,
      referral_code VARCHAR(20) NOT NULL,
      status ENUM('pending','unlocked','expired') NOT NULL DEFAULT 'pending',
      locked_reward DECIMAL(10,2) NOT NULL DEFAULT 500.00,
      orders_done INT NOT NULL DEFAULT 0,
      unlock_deadline DATETIME NOT NULL,
      unlocked_at DATETIME DEFAULT NULL,
      expired_at DATETIME DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_referral (referrer_id, referred_id),
      KEY idx_referred (referred_id),
      KEY idx_referrer (referrer_id)
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS node_referral_earnings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      partner_id INT NOT NULL,
      from_partner_id INT NOT NULL,
      type ENUM('referral_bonus','order_bonus') NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      status ENUM('locked','available','withdrawn') NOT NULL DEFAULT 'available',
      booking_id VARCHAR(50) DEFAULT NULL,
      booking_source ENUM('app','admin') DEFAULT NULL,
      referral_id INT DEFAULT NULL,
      level TINYINT NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_partner (partner_id)
    ) ENGINE=InnoDB`,

    `UPDATE node_partners SET referral_code = CONCAT('HF', LPAD(id, 6, '0')) WHERE referral_code IS NULL`
  ];

  for (const s of stmts) {
    try {
      const [r] = await db.query(s);
      console.log('OK:', s.substring(0, 70).replace(/\n/g, ' ').trim(), '| affected:', r.affectedRows || 0);
    } catch (e) {
      console.error('ERR:', e.message.substring(0, 100));
    }
  }

  // Verify
  const [cols] = await db.query("SHOW COLUMNS FROM node_partners LIKE 'referral_code'");
  console.log('referral_code column exists:', cols.length > 0);
  const [tables] = await db.query("SHOW TABLES LIKE 'node_referrals'");
  console.log('node_referrals table exists:', tables.length > 0);
  const [tables2] = await db.query("SHOW TABLES LIKE 'node_referral_earnings'");
  console.log('node_referral_earnings table exists:', tables2.length > 0);

  process.exit(0);
})();
