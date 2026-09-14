const db = require('../db');

const cols = [
  ['referral_code', 'VARCHAR(20) DEFAULT NULL'],
  ['referredBy', 'INT DEFAULT NULL'],
  ['availableWallet', 'DECIMAL(10,2) NOT NULL DEFAULT 0.00'],
  ['lockedWallet', 'DECIMAL(10,2) NOT NULL DEFAULT 0.00']
];

(async () => {
  // Add columns one by one (handle duplicates gracefully)
  for (const [col, def] of cols) {
    try {
      await db.query(`ALTER TABLE node_partners ADD COLUMN ${col} ${def}`);
      console.log('ADDED column:', col);
    } catch (e) {
      if (e.message.includes('Duplicate column') || e.message.includes('already exists')) {
        console.log('ALREADY EXISTS:', col);
      } else {
        console.log('ERR ' + col + ':', e.message.substring(0, 100));
      }
    }
  }

  // Add UNIQUE index on referral_code (ignore if exists)
  try {
    await db.query('ALTER TABLE node_partners ADD UNIQUE INDEX idx_referral_code (referral_code)');
    console.log('ADDED unique index on referral_code');
  } catch (e) {
    console.log('Index info:', e.message.substring(0, 80));
  }

  // Generate referral codes for all partners that don't have one yet
  const [upd] = await db.query(
    "UPDATE node_partners SET referral_code = CONCAT('HF', LPAD(id, 6, '0')) WHERE referral_code IS NULL"
  );
  console.log('Referral codes generated for', upd.affectedRows, 'partners');

  // Show sample
  const [rows] = await db.query('SELECT id, name, referral_code FROM node_partners LIMIT 5');
  rows.forEach(r => console.log(' -', r.id, r.name, '->', r.referral_code));

  // Verify all tables
  const [c] = await db.query("SHOW COLUMNS FROM node_partners LIKE 'referral_code'");
  const [t] = await db.query("SHOW TABLES LIKE 'node_referrals'");
  const [t2] = await db.query("SHOW TABLES LIKE 'node_referral_earnings'");
  console.log('\n=== VERIFICATION ===');
  console.log('referral_code column:', c.length > 0 ? 'EXISTS' : 'MISSING');
  console.log('node_referrals table:', t.length > 0 ? 'EXISTS' : 'MISSING');
  console.log('node_referral_earnings table:', t2.length > 0 ? 'EXISTS' : 'MISSING');

  process.exit(0);
})();
