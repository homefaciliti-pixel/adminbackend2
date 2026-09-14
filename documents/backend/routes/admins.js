const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper: Generate dynamic password (e.g. HF@839201)
function generatePassword() {
  const randNum = Math.floor(100000 + Math.random() * 900000);
  return `HF@${randNum}`;
}

// Helper: Generate username (admin_ + prefix)
function generateUsername(email) {
  const prefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  return `admin_${prefix}`;
}

// Helper: Refresh admin password if older than 24 hours
async function refreshAdminAccount(account) {
  const lastGenerated = new Date(account.lastGeneratedAt).getTime();
  const now = Date.now();
  const ageMs = now - lastGenerated;
  const expiryMs = 24 * 60 * 60 * 1000;

  if (ageMs >= expiryMs) {
    const newPassword = generatePassword();
    // Update password and reset generation time
    await db.query(
      'UPDATE admin_accounts SET password = ?, lastGeneratedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [newPassword, account.id]
    );
    console.log(`[Expiry Refresh] Admin password rotated for ${account.email}`);
    account.password = newPassword;
    account.lastGeneratedAt = new Date();
  }
  return account;
}

// GET /api/admins - Fetch all admins (will auto-refresh expired passwords)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM admin_accounts');
    const list = [];

    for (let account of rows) {
      account = await refreshAdminAccount(account);
      
      const lastGenerated = new Date(account.lastGeneratedAt).getTime();
      const ageMs = Date.now() - lastGenerated;
      const expiryMs = 24 * 60 * 60 * 1000;
      const msRemaining = Math.max(0, expiryMs - ageMs);
      const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
      const minsRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

      list.push({
        id: account.id,
        email: account.email,
        username: account.username,
        password: account.password,
        lastGeneratedAt: account.lastGeneratedAt,
        timeRemaining: `${hoursRemaining}h ${minsRemaining}m`
      });
    }

    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Error fetching admin accounts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin accounts', error: error.message });
  }
});

// POST /api/admins - Register new admin email
router.post('/', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Valid email is required' });
  }

  try {
    const username = generateUsername(email);
    const password = generatePassword();

    // Check if email already exists
    const [existing] = await db.query('SELECT id FROM admin_accounts WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Admin account with this email already exists' });
    }

    await db.query(
      'INSERT INTO admin_accounts (email, username, password, lastGeneratedAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [email, username, password]
    );

    res.status(201).json({
      success: true,
      message: 'Admin account registered successfully',
      data: { email, username, password }
    });
  } catch (error) {
    console.error('Error registering admin:', error);
    res.status(500).json({ success: false, message: 'Failed to register admin account', error: error.message });
  }
});

// DELETE /api/admins/:id - Delete admin account
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM admin_accounts WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }
    res.json({ success: true, message: 'Admin account deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin account:', error);
    res.status(500).json({ success: false, message: 'Failed to delete admin account', error: error.message });
  }
});

// POST /api/admins/login - Normal admin login verification
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM admin_accounts WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    let account = rows[0];
    
    // Check if the current password is expired (older than 24 hours)
    const lastGenerated = new Date(account.lastGeneratedAt).getTime();
    const ageMs = Date.now() - lastGenerated;
    const expiryMs = 24 * 60 * 60 * 1000;

    if (ageMs >= expiryMs) {
      // Rotate password immediately so Super Admin gets the new one
      await refreshAdminAccount(account);
      return res.status(401).json({
        success: false,
        message: 'Your daily password has expired. Please obtain the new password from the Super Admin.'
      });
    }

    if (account.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: account.id,
        email: account.email,
        username: account.username,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Error authenticating admin:', error);
    res.status(500).json({ success: false, message: 'Internal server error during authentication', error: error.message });
  }
});

module.exports = router;
