const express = require('express');
const router = express.Router();
const db = require('../db');

function parseDateString(str) {
  if (!str) return null;
  const parts = str.split(/[\/\-]/);
  if (parts.length < 3) return null;
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const year = parseInt(parts[2]);
  return `${day}-${month}-${year}`;
}

function formatDateToCompare(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    const d = parseInt(parts[2]);
    return `${d}-${m}-${y}`;
  }
  return parseDateString(dateStr);
}

async function getUsersMap() {
  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';

    // 1. Fetch from node_users_v2
    const [nodeV2Rows] = await db.query("SELECT phone as mobile, name, email, CONCAT(locality, ' ', location) as address, gender, countryCode FROM node_users_v2");
    
    // 2. Fetch from node_users (translated to node_users by prefixQuery)
    const [nodeRows] = await db.query("SELECT id, name, email, mobile, address FROM users");
    
    // 3. Fetch from original users
    const [laravelRows] = await db.query(`SELECT id, name, email, mobile_number as mobile, gender, address FROM \`${dbName}\`.\`users\` WHERE deleted_at IS NULL`);

    const usersMap = new Map();

    // Map node_users_v2
    nodeV2Rows.forEach((r, idx) => {
      const numericPhone = parseInt(r.mobile);
      const finalId = isNaN(numericPhone) ? (2000000000 + idx) : numericPhone;
      usersMap.set(finalId, {
        id: finalId,
        name: r.name || 'Guest User',
        email: r.email || '',
        mobile: r.mobile || '',
        address: r.address || '',
        gender: r.gender || '',
        source: 'User App (MySQL v2)',
        countryCode: r.countryCode ? (r.countryCode.startsWith('+') ? r.countryCode : `+${r.countryCode}`) : '+91'
      });
    });

    // Map node_users
    nodeRows.forEach(r => {
      usersMap.set(r.id, {
        id: r.id,
        name: r.name || '',
        email: r.email || '',
        mobile: r.mobile || '',
        address: r.address || '',
        gender: '',
        source: 'Admin User (MySQL)',
        countryCode: '+91'
      });
    });

    // Map laravel users
    laravelRows.forEach(r => {
      const lId = r.id + 10000000;
      usersMap.set(lId, {
        id: lId,
        name: r.name || '',
        email: r.email || '',
        mobile: r.mobile || '',
        address: r.address || '',
        gender: r.gender || '',
        source: 'App User (Laravel)',
        countryCode: '+91'
      });
    });

    return usersMap;
  } catch (error) {
    console.error('Error in getUsersMap:', error);
    return new Map();
  }
}

// GET all booking earnings (with search & aggregates)
router.get('/bookings', async (req, res) => {
  try {
    const { query: searchQuery, transactionId, paymentMethod, orderDate, userId } = req.query;

    // 1. Overall stats
    const [overallRes] = await db.query('SELECT SUM(totalAmount) as totalAmount, COUNT(*) as totalCount FROM booking_earnings');
    const totalBookingEarnings = parseFloat(overallRes[0].totalAmount || 0);
    const totalTransactions = parseInt(overallRes[0].totalCount || 0);

    // 2. Build filtered query
    let queryStr = 'SELECT * FROM booking_earnings WHERE 1=1';
    const params = [];

    if (searchQuery) {
      queryStr += ' AND (transactionId LIKE ? OR paymentMethod LIKE ? OR extraServicePaymentMethod LIKE ? OR orderDate LIKE ?)';
      params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
    }
    if (transactionId) {
      queryStr += ' AND transactionId LIKE ?';
      params.push(`%${transactionId}%`);
    }
    if (paymentMethod) {
      queryStr += ' AND paymentMethod LIKE ?';
      params.push(`%${paymentMethod}%`);
    }
    if (orderDate) {
      queryStr += ' AND orderDate LIKE ?';
      params.push(`%${orderDate}%`);
    }
    if (userId) {
      queryStr += ' AND userId = ?';
      params.push(parseInt(userId));
    }

    queryStr += ' ORDER BY id DESC';
    const [rows] = await db.query(queryStr, params);

    // Fetch completed V2 orders to build a fallback matching map
    const [v2Orders] = await db.query("SELECT id, userPhone, price, date FROM node_orders_v2 WHERE status = 'Completed'");
    const ordersMap = new Map();
    v2Orders.forEach(o => {
      const formattedDate = formatDateToCompare(o.date);
      if (formattedDate) {
        const key = `${formattedDate}_${parseFloat(o.price)}`;
        if (!ordersMap.has(key)) {
          ordersMap.set(key, []);
        }
        ordersMap.get(key).push(o);
      }
    });

    // Fetch user details map
    const usersMap = await getUsersMap();

    // Mapped results
    const mapped = rows.map(r => {
      let uId = r.userId ? parseInt(r.userId) : null;
      
      // Fallback: If userId is null, try to match by date and amount with completed orders
      if (!uId && r.orderDate) {
        const formattedEarningDate = formatDateToCompare(r.orderDate);
        const key = `${formattedEarningDate}_${parseFloat(r.totalAmount)}`;
        const matches = ordersMap.get(key) || [];
        if (matches.length > 0 && matches[0].userPhone) {
          const parsed = parseInt(matches[0].userPhone);
          if (!isNaN(parsed)) {
            uId = parsed;
          }
        }
      }

      return {
        ...r,
        userId: uId,
        serviceAmount: parseFloat(r.serviceAmount),
        extraServiceAmount: parseFloat(r.extraServiceAmount),
        totalAmount: parseFloat(r.totalAmount),
        userDetails: uId ? (usersMap.get(uId) || null) : null
      };
    });

    // Filtered stats
    const filteredBookingEarnings = mapped.reduce((sum, r) => sum + r.totalAmount, 0);
    const filteredTransactions = mapped.length;

    res.json({
      success: true,
      totalBookingEarnings,
      totalTransactions,
      filteredBookingEarnings,
      filteredTransactions,
      data: mapped
    });
  } catch (error) {
    console.error('Error fetching booking earnings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch booking earnings', error: error.message });
  }
});

// POST add booking earning
router.post('/bookings', async (req, res) => {
  const { userId, transactionId, serviceAmount, paymentMethod, extraServiceAmount, extraServicePaymentMethod, totalAmount, orderDate } = req.body;
  
  if (!transactionId || serviceAmount === undefined || !paymentMethod || totalAmount === undefined || !orderDate) {
    return res.status(400).json({ success: false, message: 'Missing transaction details' });
  }

  const sAmt = parseFloat(serviceAmount);
  const eAmt = parseFloat(extraServiceAmount || 0);
  const tAmt = parseFloat(totalAmount);
  const ePayMethod = extraServicePaymentMethod || '-';
  const uId = userId ? parseInt(userId) : null;

  try {
    const [result] = await db.query(
      `INSERT INTO booking_earnings 
      (userId, transactionId, serviceAmount, paymentMethod, extraServiceAmount, extraServicePaymentMethod, totalAmount, orderDate) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [uId, transactionId, sAmt, paymentMethod, eAmt, ePayMethod, tAmt, orderDate]
    );

    res.status(201).json({
      success: true,
      message: 'Booking transaction logged successfully',
      data: {
        id: result.insertId,
        userId: uId,
        transactionId,
        serviceAmount: sAmt,
        paymentMethod,
        extraServiceAmount: eAmt,
        extraServicePaymentMethod: ePayMethod,
        totalAmount: tAmt,
        orderDate
      }
    });
  } catch (error) {
    console.error('Error logging booking earning:', error);
    res.status(500).json({ success: false, message: 'Failed to log booking transaction', error: error.message });
  }
});

async function getPartnersMap(req) {
  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // 1. Fetch Node partners
    const [nodeRows] = await db.query('SELECT id, name, email, mobile, city, state, image, status, isApproved FROM partners');
    
    // 2. Fetch Laravel partners
    const [laravelRows] = await db.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.mobile_number AS mobile, 
        s.name AS state, 
        c.name AS city, 
        u.image, 
        u.status, 
        u.is_approval AS isApproved,
        u.category_id
      FROM \`${dbName}\`.\`users\` u
      LEFT JOIN \`${dbName}\`.\`states\` s ON u.state_id = s.id
      LEFT JOIN \`${dbName}\`.\`cities\` c ON u.city_id = c.id
      WHERE u.role_id = 2
    `);

    // Fetch categories for title mapping
    const [catRows] = await db.query(`SELECT id, title FROM \`${dbName}\`.\`categories\``);
    const catMap = {};
    catRows.forEach(row => {
      catMap[row.id] = row.title;
    });

    const partnerMap = new Map();
    const partnerByNameMap = new Map();

    const addPartnerToMaps = (id, partnerDetails) => {
      partnerMap.set(id, partnerDetails);
      const nameKey = (partnerDetails.name || '').toLowerCase().trim();
      if (nameKey) {
        partnerByNameMap.set(nameKey, partnerDetails);
      }
    };

    nodeRows.forEach(r => {
      addPartnerToMaps(r.id, {
        id: r.id,
        name: r.name || '',
        email: r.email || '',
        mobile: r.mobile || '',
        city: r.city || '',
        state: r.state || '',
        category: '',
        image: r.image ? (r.image.startsWith('http') ? r.image : `${baseUrl}/uploads/${r.image}`) : '',
        status: r.status === 1 || r.status === true,
        isApproved: r.isApproved === 1 || r.isApproved === true,
        source: 'Admin Partner (MySQL)'
      });
    });

    laravelRows.forEach(r => {
      const lId = r.id + 10000000;
      addPartnerToMaps(lId, {
        id: lId,
        name: r.name || '',
        email: r.email || '',
        mobile: r.mobile || '',
        city: r.city || '',
        state: r.state || '',
        category: catMap[r.category_id] || '',
        image: r.image ? (r.image.startsWith('http') ? r.image : `${baseUrl}/uploads/${r.image}`) : '',
        status: r.status === 1 || r.status === true,
        isApproved: r.isApproved === 1 || r.isApproved === true,
        source: 'App Partner (Laravel)'
      });
    });

    return { partnerMap, partnerByNameMap };
  } catch (error) {
    console.error('Error in getPartnersMap:', error);
    return { partnerMap: new Map(), partnerByNameMap: new Map() };
  }
}

// GET all subscription earnings (with search & aggregates)
router.get('/subscriptions', async (req, res) => {
  try {
    const { query: searchQuery, partnerName, paymentMethod, status, purchaseDate, partnerId } = req.query;

    // 1. Overall stats
    const [overallRes] = await db.query('SELECT SUM(amount) as totalAmount, COUNT(*) as totalCount FROM subscription_earnings');
    const totalSubscriptionsEarnings = parseFloat(overallRes[0].totalAmount || 0);
    const totalPlans = parseInt(overallRes[0].totalCount || 0);

    // 2. Build filtered query
    let queryStr = 'SELECT * FROM subscription_earnings WHERE 1=1';
    const params = [];

    if (searchQuery) {
      queryStr += ' AND (partnerName LIKE ? OR paymentMethod LIKE ? OR status LIKE ? OR purchaseDate LIKE ?)';
      params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
    }
    if (partnerName) {
      queryStr += ' AND partnerName LIKE ?';
      params.push(`%${partnerName}%`);
    }
    if (paymentMethod) {
      queryStr += ' AND paymentMethod LIKE ?';
      params.push(`%${paymentMethod}%`);
    }
    if (status) {
      queryStr += ' AND status = ?';
      params.push(status);
    }
    if (purchaseDate) {
      queryStr += ' AND purchaseDate LIKE ?';
      params.push(`%${purchaseDate}%`);
    }
    if (partnerId) {
      queryStr += ' AND partnerId = ?';
      params.push(parseInt(partnerId));
    }

    queryStr += ' ORDER BY id DESC';
    const [rows] = await db.query(queryStr, params);

    // Fetch partner details map
    const { partnerMap, partnerByNameMap } = await getPartnersMap(req);

    // Mapped results
    const mapped = rows.map(r => {
      let pId = r.partnerId ? parseInt(r.partnerId) : null;
      let partnerDetails = pId ? (partnerMap.get(pId) || null) : null;
      
      // Fallback: If partnerId is null or not found, try to look up by name
      if (!partnerDetails && r.partnerName) {
        const nameKey = r.partnerName.toLowerCase().trim();
        partnerDetails = partnerByNameMap.get(nameKey) || null;
        if (partnerDetails) {
          pId = partnerDetails.id;
        }
      }

      return {
        ...r,
        partnerId: pId,
        amount: parseFloat(r.amount),
        partnerDetails
      };
    });

    // Filtered stats
    const filteredSubscriptionsEarnings = mapped.reduce((sum, r) => sum + r.amount, 0);
    const filteredPlans = mapped.length;

    res.json({
      success: true,
      totalSubscriptionsEarnings,
      totalPlans,
      filteredSubscriptionsEarnings,
      filteredPlans,
      data: mapped
    });
  } catch (error) {
    console.error('Error fetching subscription earnings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscription earnings', error: error.message });
  }
});

// POST add subscription earning
router.post('/subscriptions', async (req, res) => {
  const { partnerId, partnerName, amount, paymentMethod, purchaseDate, status } = req.body;
  
  if (!partnerName || amount === undefined || !paymentMethod || !purchaseDate || !status) {
    return res.status(400).json({ success: false, message: 'Missing subscription details' });
  }

  const amt = parseFloat(amount);
  const pId = partnerId ? parseInt(partnerId) : null;

  try {
    const [result] = await db.query(
      `INSERT INTO subscription_earnings 
      (partnerId, partnerName, amount, paymentMethod, purchaseDate, status) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [pId, partnerName, amt, paymentMethod, purchaseDate, status]
    );

    res.status(201).json({
      success: true,
      message: 'Subscription purchase logged successfully',
      data: {
        id: result.insertId,
        partnerId: pId,
        partnerName,
        amount: amt,
        paymentMethod,
        purchaseDate,
        status
      }
    });
  } catch (error) {
    console.error('Error logging subscription earning:', error);
    res.status(500).json({ success: false, message: 'Failed to log subscription transaction', error: error.message });
  }
});

module.exports = router;
