-- ============================================================
-- REFER & EARN - Database Migration
-- Run once to create referral system tables
-- ============================================================

-- 1. Add referral_code column to partners table (unique short code)
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS referredBy INT DEFAULT NULL COMMENT 'Partner ID who referred this partner',
  ADD COLUMN IF NOT EXISTS availableWallet DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Directly withdrawable balance',
  ADD COLUMN IF NOT EXISTS lockedWallet DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Locked referral bonus, unlocks after referred partner completes 5 orders in 5 days';

-- 2. Referrals table - one row per referral relationship
CREATE TABLE IF NOT EXISTS referrals (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  referrer_id     INT NOT NULL COMMENT 'Partner A (who referred)',
  referred_id     INT NOT NULL COMMENT 'Partner B (who registered using referral)',
  referral_code   VARCHAR(20) NOT NULL,
  status          ENUM('pending','unlocked','expired') NOT NULL DEFAULT 'pending'
                    COMMENT 'pending=locked, unlocked=5 orders done in 5 days, expired=deadline missed',
  locked_reward   DECIMAL(10,2) NOT NULL DEFAULT 500.00 COMMENT 'Locked ₹500 bonus for referrer',
  orders_done     INT NOT NULL DEFAULT 0 COMMENT 'How many orders referred partner completed so far',
  unlock_deadline DATETIME NOT NULL COMMENT 'Deadline: referred partner must complete 5 orders by this date',
  unlocked_at     DATETIME DEFAULT NULL,
  expired_at      DATETIME DEFAULT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_referral (referrer_id, referred_id),
  KEY idx_referred (referred_id),
  KEY idx_referrer (referrer_id),
  KEY idx_status (status)
) ENGINE=InnoDB;

-- 3. Referral earnings log - every earning event
CREATE TABLE IF NOT EXISTS referral_earnings (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  partner_id      INT NOT NULL COMMENT 'Partner who EARNED this amount (referrer)',
  from_partner_id INT NOT NULL COMMENT 'Partner whose action triggered this earning',
  type            ENUM('referral_bonus','order_bonus') NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  status          ENUM('locked','available','withdrawn') NOT NULL DEFAULT 'available',
  booking_id      VARCHAR(50) DEFAULT NULL,
  booking_source  ENUM('app','admin') DEFAULT NULL,
  referral_id     INT DEFAULT NULL COMMENT 'FK to referrals.id',
  level           TINYINT NOT NULL DEFAULT 1 COMMENT '1=direct, 2=indirect level 2, etc.',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_partner (partner_id),
  KEY idx_from_partner (from_partner_id),
  KEY idx_type (type),
  KEY idx_status (status)
) ENGINE=InnoDB;

-- 4. Generate referral codes for all existing partners (run once)
-- Format: HF + partner_id padded to 6 digits (e.g. HF000042)
UPDATE partners
SET referral_code = CONCAT('HF', LPAD(id, 6, '0'))
WHERE referral_code IS NULL;
