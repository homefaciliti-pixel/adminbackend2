const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper to convert date parameter (YYYY-MM-DD or DD-MM-YYYY) to standard YYYY-MM-DD
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

// Helper to parse multiple date formats in JavaScript
function parseToDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }
  
  // DD-MM-YYYY
  const match = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    return new Date(year, month, day);
  }
  
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// Helper to export dataset to CSV
function exportToCsv(res, filename, columns, data) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  
  // Write headers
  let csv = columns.map(c => `"${c.label}"`).join(',') + '\n';
  
  // Write rows
  data.forEach(row => {
    csv += columns.map(c => {
      let val = row[c.key];
      if (val === true) val = 'Yes';
      if (val === false) val = 'No';
      return `"${String(val !== undefined && val !== null ? val : '').replace(/"/g, '""')}"`;
    }).join(',') + '\n';
  });
  
  return res.send(csv);
}

// Helper to format partners mapping lists/doubles
function mapPartner(r) {
  return {
    ...r,
    status: r.status === 1,
    isApproved: r.isApproved === 1,
    services: r.services ? r.services.split(',').map(s => s.trim()).filter(Boolean) : [],
    documents: r.documents ? r.documents.split(',').map(d => d.trim()).filter(Boolean) : [],
    walletBalance: parseFloat(r.walletBalance || 0),
    totalEarnings: parseFloat(r.totalEarnings || 0),
    withdrawnAmount: parseFloat(r.withdrawnAmount || 0),
    totalBookings: parseInt(r.totalBookings || 0),
    completedBookings: parseInt(r.completedBookings || 0),
    cancelledBookings: parseInt(r.cancelledBookings || 0),
    pendingBookings: parseInt(r.pendingBookings || 0),
    rating: parseFloat(r.rating || 0),
    totalReviews: parseInt(r.totalReviews || 0)
  };
}

async function getAllUsers() {
  const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
  
  // 1. Fetch from node_users_v2
  const [nodeV2Rows] = await db.query("SELECT phone as mobile, name, email, CONCAT(locality, ' ', location) as address, gender, '01-01-2026' as createdAt FROM node_users_v2");
  
  // 2. Fetch from node_users (translated to node_users by prefixQuery)
  const [nodeRows] = await db.query("SELECT id, name, email, mobile, address, createdAt FROM users");
  
  // 3. Fetch from original users
  const [laravelRows] = await db.query(`SELECT id, name, email, mobile_number as mobile, gender, address, created_at as createdAt FROM \`${dbName}\`.\`users\` WHERE deleted_at IS NULL`);
  
  let allUsers = [];

  nodeV2Rows.forEach((r, idx) => {
    const numericPhone = parseInt(r.mobile);
    const finalId = isNaN(numericPhone) ? (2000000000 + idx) : numericPhone;
    allUsers.push({
      id: finalId,
      name: r.name || 'Guest User',
      email: r.email || '',
      mobile: r.mobile || '',
      address: r.address || '',
      gender: r.gender || '',
      createdAt: r.createdAt || '01-01-2026',
      source: 'User App (MySQL v2)'
    });
  });

  nodeRows.forEach(r => {
    allUsers.push({
      id: r.id,
      name: r.name || '',
      email: r.email || '',
      mobile: r.mobile || '',
      address: r.address || '',
      gender: '',
      createdAt: r.createdAt,
      source: 'Admin User (MySQL)'
    });
  });

  laravelRows.forEach(r => {
    let dateStr = '01-01-2026';
    if (r.createdAt) {
      const d = new Date(r.createdAt);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        dateStr = `${day}-${month}-${year}`;
      }
    }
    allUsers.push({
      id: r.id + 10000000,
      name: r.name || '',
      email: r.email || '',
      mobile: r.mobile || '',
      address: r.address || '',
      gender: r.gender || '',
      createdAt: dateStr,
      source: 'App User (Laravel)'
    });
  });

  return allUsers;
}

async function getAllPartners() {
  const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
  
  const [nodeRows] = await db.query('SELECT * FROM partners');
  
  const [laravelRows] = await db.query(`
    SELECT 
      u.id, 
      u.name, 
      u.email, 
      u.mobile_number AS mobile, 
      s.name AS state, 
      c.name AS city, 
      l.name AS locality,
      u.address, 
      u.image, 
      u.status, 
      u.is_approval AS isApproved, 
      u.gender, 
      u.experience, 
      u.service_id AS services, 
      u.aadhaar_number AS aadhaarNumber, 
      u.aadhaar_front_image AS aadharFront, 
      u.aadhaar_back_image AS aadharBack, 
      u.pan_number AS panNumber, 
      u.pan_image AS panImage, 
      u.bank_name AS bankName, 
      u.account_number AS accountNumber, 
      u.ifsc_code AS ifscCode, 
      u.created_at AS createdAt,
      u.do_you_have_vehicle AS hasVehicle,
      u.category_id,
      u.sub_category_id,
      u.account_holder_name AS accountHolder,
      u.payment_status AS isPaid
    FROM \`${dbName}\`.\`users\` u
    LEFT JOIN \`${dbName}\`.\`states\` s ON u.state_id = s.id
    LEFT JOIN \`${dbName}\`.\`cities\` c ON u.city_id = c.id
    LEFT JOIN \`${dbName}\`.\`localities\` l ON u.locality_id = l.id
    WHERE u.role_id = 2
  `);
  
  const all = [];
  
  nodeRows.forEach(r => {
    all.push({
      ...r,
      source: 'Admin Partner (MySQL)'
    });
  });
  
  laravelRows.forEach(r => {
    let dateStr = '01-01-2026';
    if (r.createdAt) {
      const d = new Date(r.createdAt);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        dateStr = `${day}-${month}-${year}`;
      }
    }
    all.push({
      ...r,
      id: r.id + 10000000,
      policeVerificationImage: '',
      aadhaarImage: r.aadharFront || '',
      panImage: r.panImage || '',
      password: '',
      aadharFront: r.aadharFront || '',
      aadharBack: r.aadharBack || '',
      hasVehicle: (r.hasVehicle === 1 || r.hasVehicle === '1') ? 'Yes' : 'No',
      category: '',
      subCategory: '',
      accountHolder: r.accountHolder || '',
      isPaid: (r.isPaid === 1 || r.isPaid === '1') ? 1 : 0,
      createdAt: dateStr,
      source: 'App Partner (Laravel)'
    });
  });
  
  return all;
}

// 1. Users Report
router.get('/users', async (req, res) => {
  try {
    const { startDate, endDate, query: searchQuery, export: exportType } = req.query;
    if (!startDate || !endDate || searchQuery === undefined || exportType === undefined) {
      return res.status(400).json({
        success: false,
        message: 'startDate, endDate, query, and export parameters are required'
      });
    }

    const start = parseToDate(startDate);
    const end = parseToDate(endDate);
    if (end) {
      end.setHours(23, 59, 59, 999);
    }

    let list = await getAllUsers();

    // Filter by dates
    if (start || end) {
      list = list.filter(u => {
        const uDate = parseToDate(u.createdAt);
        if (!uDate) return true;
        if (start && uDate < start) return false;
        if (end && uDate > end) return false;
        return true;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(u => 
        (u.name && u.name.toLowerCase().includes(q)) || 
        (u.email && u.email.toLowerCase().includes(q)) || 
        (u.mobile && u.mobile.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => b.id - a.id);

    if (exportType === 'csv') {
      const columns = [
        { label: 'User ID', key: 'id' },
        { label: 'Name', key: 'name' },
        { label: 'Email', key: 'email' },
        { label: 'Mobile', key: 'mobile' },
        { label: 'Address', key: 'address' },
        { label: 'Joined Date', key: 'createdAt' },
        { label: 'Source', key: 'source' }
      ];
      return exportToCsv(res, 'users_report.csv', columns, list);
    }

    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Error fetching users report:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users report', error: error.message });
  }
});

// 2. Partners Report
router.get('/partners', async (req, res) => {
  try {
    const { startDate, endDate, query: searchQuery, export: exportType } = req.query;
    if (!startDate || !endDate || searchQuery === undefined || exportType === undefined) {
      return res.status(400).json({
        success: false,
        message: 'startDate, endDate, query, and export parameters are required'
      });
    }

    const start = parseToDate(startDate);
    const end = parseToDate(endDate);
    if (end) {
      end.setHours(23, 59, 59, 999);
    }

    let list = await getAllPartners();

    // Filter by dates
    if (start || end) {
      list = list.filter(p => {
        const pDate = parseToDate(p.createdAt);
        if (!pDate) return true;
        if (start && pDate < start) return false;
        if (end && pDate > end) return false;
        return true;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.email && p.email.toLowerCase().includes(q)) || 
        (p.mobile && p.mobile.toLowerCase().includes(q)) || 
        (p.city && p.city.toLowerCase().includes(q)) || 
        (p.state && p.state.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => b.id - a.id);
    const mapped = list.map(mapPartner);

    if (exportType === 'csv') {
      const columns = [
        { label: 'Partner ID', key: 'id' },
        { label: 'Name', key: 'name' },
        { label: 'Email', key: 'email' },
        { label: 'Mobile', key: 'mobile' },
        { label: 'City', key: 'city' },
        { label: 'State', key: 'state' },
        { label: 'Status', key: 'status' },
        { label: 'Is Approved', key: 'isApproved' },
        { label: 'Experience', key: 'experience' },
        { label: 'Joined Date', key: 'createdAt' },
        { label: 'Source', key: 'source' }
      ];
      return exportToCsv(res, 'partners_report.csv', columns, mapped);
    }

    res.json({ success: true, data: mapped });
  } catch (error) {
    console.error('Error fetching partners report:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch partners report', error: error.message });
  }
});

// 3. Earnings (Bookings) Report
router.get('/earnings', async (req, res) => {
  try {
    const { startDate, endDate, query: searchQuery, export: exportType } = req.query;
    if (!startDate || !endDate || searchQuery === undefined || exportType === undefined) {
      return res.status(400).json({
        success: false,
        message: 'startDate, endDate, query, and export parameters are required'
      });
    }
    let sqlStr = 'SELECT * FROM booking_earnings WHERE 1=1';
    const params = [];

    const normalizedStart = normalizeDate(startDate);
    const normalizedEnd = normalizeDate(endDate);

    if (normalizedStart) {
      sqlStr += " AND STR_TO_DATE(orderDate, '%d-%m-%Y') >= STR_TO_DATE(?, '%Y-%m-%d')";
      params.push(normalizedStart);
    }
    if (normalizedEnd) {
      sqlStr += " AND STR_TO_DATE(orderDate, '%d-%m-%Y') <= STR_TO_DATE(?, '%Y-%m-%d')";
      params.push(normalizedEnd);
    }
    if (searchQuery) {
      sqlStr += ' AND (transactionId LIKE ? OR paymentMethod LIKE ?)';
      params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    sqlStr += ' ORDER BY id DESC';
    const [rows] = await db.query(sqlStr, params);
    const mapped = rows.map(r => ({
      ...r,
      serviceAmount: parseFloat(r.serviceAmount),
      extraServiceAmount: parseFloat(r.extraServiceAmount),
      totalAmount: parseFloat(r.totalAmount)
    }));

    if (exportType === 'csv') {
      const columns = [
        { label: 'Transaction ID', key: 'transactionId' },
        { label: 'Service Amount', key: 'serviceAmount' },
        { label: 'Payment Method', key: 'paymentMethod' },
        { label: 'Extra Service Amount', key: 'extraServiceAmount' },
        { label: 'Extra Payment Method', key: 'extraServicePaymentMethod' },
        { label: 'Total Amount', key: 'totalAmount' },
        { label: 'Date', key: 'orderDate' }
      ];
      return exportToCsv(res, 'bookings_earnings_report.csv', columns, mapped);
    }

    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch earnings report', error: error.message });
  }
});

// 4. Subscriptions Report
router.get('/subscriptions', async (req, res) => {
  try {
    const { startDate, endDate, query: searchQuery, export: exportType } = req.query;
    if (!startDate || !endDate || searchQuery === undefined || exportType === undefined) {
      return res.status(400).json({
        success: false,
        message: 'startDate, endDate, query, and export parameters are required'
      });
    }
    let sqlStr = 'SELECT * FROM subscription_earnings WHERE 1=1';
    const params = [];

    const normalizedStart = normalizeDate(startDate);
    const normalizedEnd = normalizeDate(endDate);

    if (normalizedStart) {
      sqlStr += " AND STR_TO_DATE(purchaseDate, '%d-%m-%Y') >= STR_TO_DATE(?, '%Y-%m-%d')";
      params.push(normalizedStart);
    }
    if (normalizedEnd) {
      sqlStr += " AND STR_TO_DATE(purchaseDate, '%d-%m-%Y') <= STR_TO_DATE(?, '%Y-%m-%d')";
      params.push(normalizedEnd);
    }
    if (searchQuery) {
      sqlStr += ' AND (partnerName LIKE ? OR paymentMethod LIKE ? OR status LIKE ?)';
      params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
    }

    sqlStr += ' ORDER BY id DESC';
    const [rows] = await db.query(sqlStr, params);
    const mapped = rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount)
    }));

    if (exportType === 'csv') {
      const columns = [
        { label: 'Earning ID', key: 'id' },
        { label: 'Partner Name', key: 'partnerName' },
        { label: 'Amount', key: 'amount' },
        { label: 'Payment Method', key: 'paymentMethod' },
        { label: 'Purchase Date', key: 'purchaseDate' },
        { label: 'Status', key: 'status' }
      ];
      return exportToCsv(res, 'subscriptions_report.csv', columns, mapped);
    }

    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch subscriptions report', error: error.message });
  }
});

module.exports = router;
