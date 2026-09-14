const express = require('express');
const router = express.Router();
const db = require('../db');


// Helper: safely add a column if it doesn't already exist (for manual migrations only)
async function safeAddCol(table, column, definition) {
  try {
    await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  } catch (e) {
    if (!e.message.includes('1060') && !e.message.includes('Duplicate column')) {
      console.warn(`safeAddCol(${table}.${column}): ${e.message}`);
    }
  }
}

// Tables already exist in production — this is a permanent no-op.
// Do NOT add CREATE TABLE calls here; they cause 429 floods on BigRock's WAF.
// Run migrations manually via a one-time script if schema changes are needed.
const amcTablesReady = true;
async function ensureAmcTables() { /* no-op — tables exist */ }



// ======================================================================
// Helper Function: Populate Subscription Attributes
// ======================================================================
async function populateSubscriptionData(sub) {
  // 1. Fetch Customer Name
  let customerName = 'Unknown User';
  try {
    const [users] = await db.query('SELECT name FROM node_users_v2 WHERE phone = ? LIMIT 1', [sub.userPhone]);
    if (users.length > 0 && users[0].name) {
      customerName = users[0].name;
    }
  } catch (e) {}

  // 2. Fetch Completed & Total Visits
  let completedVisits = 0;
  let assignedPartner = 'Pending';
  let partnerPhone = '';
  try {
    const [[cRow]] = await db.query('SELECT COUNT(*) as cnt FROM node_amc_visits WHERE amcId = ? AND status = "completed"', [sub.amcId]);
    completedVisits = cRow ? cRow.cnt : 0;

    // Fetch latest assigned partner if any
    const [pRows] = await db.query('SELECT partnerName, partnerPhone FROM node_amc_visits WHERE amcId = ? AND partnerName IS NOT NULL AND partnerName != "" ORDER BY id DESC LIMIT 1', [sub.amcId]);
    if (pRows.length > 0 && pRows[0].partnerName) {
      assignedPartner = pRows[0].partnerName;
      partnerPhone = pRows[0].partnerPhone || '';
    }
  } catch (e) {}

  const totalVisits = sub.totalVisits || 12;
  const remainingVisits = Math.max(0, totalVisits - completedVisits);

  return {
    id: sub.amcId,
    amcId: sub.amcId,
    customerName,
    customerPhone: sub.userPhone,
    userPhone: sub.userPhone,
    category: sub.category,
    planName: sub.planName || 'Premium AMC',
    price: parseFloat(sub.price),
    areaSqFt: sub.areaSqFt,
    floors: sub.floors,
    houseType: sub.houseType || 'Villa',
    address: sub.address || 'Jaipur',
    status: sub.status,
    startDate: sub.startDate,
    endDate: sub.endDate,
    createdAt: sub.startDate,
    totalVisits,
    completedVisits,
    remainingVisits,
    assignedPartner,
    partnerPhone,
    photoUrl: sub.photoUrl || null,
    pdfUrl: sub.pdfUrl || null,
    fileUrl: sub.fileUrl || null
  };
}


// ======================================================================
// 1. DASHBOARD APIS
// ======================================================================

// GET /api/amc/dashboard - Summary stats
router.get('/dashboard', async (req, res) => {
  await ensureAmcTables();
  try {
    const [[subStats]] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' AND endDate >= NOW() THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'expired' OR endDate < NOW() THEN 1 ELSE 0 END) as expired,
        SUM(price) as totalRevenue
      FROM node_amc_subscriptions
    `);

    const [[visitStats]] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN DATE(scheduledDate) = CURDATE() THEN 1 ELSE 0 END) as today,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM node_amc_visits
    `);

    res.json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: {
        totalAmc: subStats.total || 0,
        activeAmc: subStats.active || 0,
        expiredAmc: subStats.expired || 0,
        totalVisits: visitStats.total || 0,
        todayVisits: visitStats.today || 0,
        pendingVisits: visitStats.pending || 0,
        revenue: parseFloat(subStats.totalRevenue || 0)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve dashboard stats', error: err.message });
  }
});

// GET /api/amc/dashboard/recent-orders
router.get('/dashboard/recent-orders', async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT * FROM node_orders_v2 
      WHERE amcId IS NOT NULL 
      ORDER BY id DESC LIMIT 5
    `);
    res.json({ success: true, message: 'Recent orders retrieved successfully', data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve recent orders', error: err.message });
  }
});

// GET /api/amc/dashboard/today-visits
router.get('/dashboard/today-visits', async (req, res) => {
  try {
    const [visits] = await db.query(`
      SELECT * FROM node_amc_visits 
      WHERE DATE(scheduledDate) = CURDATE() 
      ORDER BY id DESC
    `);
    res.json({ success: true, message: 'Today\'s visits retrieved successfully', data: visits });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve today\'s visits', error: err.message });
  }
});

// GET /api/amc/dashboard/renew-alerts
router.get('/dashboard/renew-alerts', async (req, res) => {
  try {
    const [alerts] = await db.query(`
      SELECT * FROM node_amc_subscriptions 
      WHERE status = 'active' AND endDate BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)
      ORDER BY endDate ASC
    `);
    res.json({ success: true, message: 'Renewal alerts retrieved successfully', data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve renewal alerts', error: err.message });
  }
});

// GET /api/amc/dashboard/recent-activities
router.get('/dashboard/recent-activities', async (req, res) => {
  try {
    const [subs] = await db.query('SELECT amcId, userPhone, startDate as timestamp, "subscription" as type FROM node_amc_subscriptions ORDER BY startDate DESC LIMIT 5');
    const [visits] = await db.query('SELECT id, amcId, serviceName, completedAt as timestamp, "visit_completed" as type FROM node_amc_visits WHERE status = "completed" ORDER BY completedAt DESC LIMIT 5');
    
    const activities = [...subs, ...visits]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);

    res.json({ success: true, message: 'Recent activities retrieved successfully', data: activities });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve recent activities', error: err.message });
  }
});


// ======================================================================
// 2. LIST SUBSCRIPTIONS (STATIC FIRST)
// ======================================================================

// Helper for filtering & sorting subscriptions
function buildSubscriptionQuery(baseWhere, queryParams) {
  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 10;
  const offset = (page - 1) * limit;
  const search = queryParams.search || queryParams.q || '';
  const category = queryParams.category || '';
  const statusFilter = queryParams.status || '';
  const dateFilter = queryParams.date || queryParams.startDate || '';
  
  // Sorting options: startDate, endDate, createdAt, price
  let sortBy = 'startDate';
  if (['endDate', 'createdAt', 'price', 'amcId'].includes(queryParams.sortBy)) {
    sortBy = queryParams.sortBy === 'createdAt' ? 'startDate' : queryParams.sortBy;
  }
  const sortOrder = (queryParams.sortOrder || queryParams.order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  let query = `SELECT * FROM node_amc_subscriptions WHERE ${baseWhere}`;
  const params = [];

  if (search) {
    query += ` AND (amcId LIKE ? OR userPhone LIKE ? OR category LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }
  if (statusFilter) {
    query += ` AND status = ?`;
    params.push(statusFilter);
  }
  if (dateFilter) {
    query += ` AND DATE(startDate) = DATE(?)`;
    params.push(dateFilter);
  }

  query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  return { query, params, page, limit };
}

// GET /api/amc/active - Paginated active contracts with filters & sorting
router.get('/active', async (req, res) => {
  try {
    const { query, params, page, limit } = buildSubscriptionQuery("status = 'active' AND endDate >= NOW()", req.query);

    const [rows] = await db.query(query, params);
    const populated = await Promise.all(rows.map(sub => populateSubscriptionData(sub)));

    res.json({
      success: true,
      message: 'Active subscriptions retrieved successfully',
      page,
      limit,
      count: populated.length,
      data: populated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve active subscriptions', error: err.message });
  }
});

// GET /api/amc/expired - Paginated expired contracts with filters & sorting
router.get('/expired', async (req, res) => {
  try {
    const { query, params, page, limit } = buildSubscriptionQuery("(status = 'expired' OR endDate < NOW())", req.query);

    const [rows] = await db.query(query, params);
    const populated = await Promise.all(rows.map(sub => populateSubscriptionData(sub)));

    res.json({
      success: true,
      message: 'Expired subscriptions retrieved successfully',
      page,
      limit,
      count: populated.length,
      data: populated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve expired subscriptions', error: err.message });
  }
});


// ======================================================================
// 3. SERVICE VISITS APIS
// ======================================================================

// GET /api/amc/visits - List all visits
router.get('/visits', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM node_amc_visits ORDER BY id DESC');
    res.json({ success: true, message: 'Visits retrieved successfully', data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve visits list', error: err.message });
  }
});

// GET /api/amc/visits/:visitId - Visit details
router.get('/visits/:visitId', async (req, res) => {
  try {
    const { visitId } = req.params;
    const [rows] = await db.query('SELECT * FROM node_amc_visits WHERE id = ?', [visitId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }
    res.json({ success: true, message: 'Visit details retrieved successfully', data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve visit details', error: err.message });
  }
});

// GET /api/amc/visits/:visitId/images - Visit images
router.get('/visits/:visitId/images', async (req, res) => {
  try {
    const { visitId } = req.params;
    const [rows] = await db.query('SELECT images FROM node_amc_visits WHERE id = ?', [visitId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }
    const imgStr = rows[0].images || '';
    const list = imgStr ? imgStr.split(',').map(s => s.trim()).filter(Boolean) : [];
    res.json({ success: true, message: 'Visit images retrieved successfully', data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve visit images', error: err.message });
  }
});


// ======================================================================
// 4. ORDERS INTEGRATION APIS
// ======================================================================

// Helper to enrich AMC order items with formatted phone numbers and customer details
async function formatAmcOrder(o) {
  let addrObj = {};
  try { addrObj = JSON.parse(o.address || '{}'); } catch (e) {}

  let payObj = {};
  try { payObj = JSON.parse(o.payment || '{}'); } catch (e) {}

  const cMobile = addrObj.userPhone || addrObj.mobile || o.userPhone || '-';
  
  let pPhone = o.partnerPhone || '';
  if (!pPhone && o.partnerName) {
    const [partners] = await db.query('SELECT mobile FROM partners WHERE name = ?', [o.partnerName]);
    if (partners.length > 0) pPhone = partners[0].mobile;
  }

  const fullAddr = addrObj.houseNo 
    ? `${addrObj.houseNo}, ${addrObj.society || ''}, ${addrObj.locality || ''}, ${addrObj.city || ''}`.replace(/,\s*,/g, ',').trim()
    : (o.address || '');

  return {
    ...o,
    id: o.id,
    amcId: o.amcId,
    serviceName: o.serviceName,
    price: parseFloat(o.price || 0),
    serviceAmount: parseFloat(o.price || 0),
    status: o.status,
    bookingStatus: o.bookingStatus,
    customerName: addrObj.name || 'Customer',
    customerMobile: cMobile,
    customerPhone: cMobile,
    userPhone: cMobile,
    phone: cMobile,
    mobile: cMobile,
    partnerName: o.partnerName || '-',
    partnerPhone: pPhone,
    partnerMobile: pPhone,
    vendorName: o.partnerName || '-',
    vendorMobile: pPhone,
    vendorPhone: pPhone,
    address: fullAddr,
    timeSlot: o.timeSlot,
    slotTime: o.timeSlot,
    date: o.date,
    serviceDate: o.date,
    createdAt: o.createdAt
  };
}

// GET /api/amc/orders - Fetch AMC orders
router.get('/orders', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM node_orders_v2 WHERE amcId IS NOT NULL ORDER BY id DESC');
    const formattedRows = await Promise.all(rows.map(o => formatAmcOrder(o)));
    res.json({ success: true, message: 'AMC orders retrieved successfully', data: formattedRows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve AMC orders', error: err.message });
  }
});

// POST /api/amc/orders/assign-partner - Assign partner
router.post('/orders/assign-partner', async (req, res) => {
  try {
    const { orderId, visitId, partnerPhone, partnerName } = req.body;
    
    if (!partnerPhone || !partnerName) {
      return res.status(400).json({ success: false, message: 'Partner details (name and phone) are required' });
    }

    if (visitId) {
      await db.query(`
        UPDATE node_amc_visits 
        SET partnerName = ?, partnerPhone = ?, status = 'assigned'
        WHERE id = ?
      `, [partnerName, partnerPhone, visitId]);
    }

    if (orderId) {
      await db.query(`
        UPDATE node_orders_v2 
        SET partnerName = ?, partnerPhone = ?, status = 'Assigned', bookingStatus = 'assigned'
        WHERE id = ?
      `, [partnerName, partnerPhone, orderId]);
    }

    res.json({ success: true, message: 'Partner assigned successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to assign partner', error: err.message });
  }
});

// GET /api/amc/orders/:orderId - AMC order details
router.get('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const [rows] = await db.query('SELECT * FROM node_orders_v2 WHERE id = ? AND amcId IS NOT NULL', [orderId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'AMC order not found' });
    }
    const formatted = await formatAmcOrder(rows[0]);
    res.json({ success: true, message: 'AMC order retrieved successfully', data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve AMC order details', error: err.message });
  }
});


// PUT /api/amc/orders/:orderId/change-partner
router.put('/orders/:orderId/change-partner', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { partnerPhone, partnerName } = req.body;

    if (!partnerPhone || !partnerName) {
      return res.status(400).json({ success: false, message: 'Partner details are required' });
    }

    await db.query(`
      UPDATE node_orders_v2 
      SET partnerName = ?, partnerPhone = ?, status = 'Assigned', bookingStatus = 'assigned'
      WHERE id = ?
    `, [partnerName, partnerPhone, orderId]);


    // Sync to visit too
    await db.query(`
      UPDATE node_amc_visits 
      SET partnerName = ?, partnerPhone = ?, status = 'assigned'
      WHERE amcId = (SELECT amcId FROM node_orders_v2 WHERE id = ? LIMIT 1) 
      AND (status = 'assigned' OR status = 'pending')
    `, [partnerName, partnerPhone, orderId]);

    res.json({ success: true, message: 'Partner changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to change partner', error: err.message });
  }
});

// PUT /api/amc/orders/:orderId/status
router.put('/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status field is required' });
    }

    await db.query('UPDATE node_orders_v2 SET status = ? WHERE id = ?', [status, orderId]);

    // Sync status to visit
    const [orders] = await db.query('SELECT amcId, partnerName, serviceName FROM node_orders_v2 WHERE id = ?', [orderId]);
    if (orders.length > 0) {
      const order = orders[0];
      const visitStatus = status.toLowerCase() === 'completed' ? 'completed' : 'assigned';
      
      const updateVisitSql = status.toLowerCase() === 'completed' 
        ? `UPDATE node_amc_visits SET status = ?, completedAt = NOW() WHERE amcId = ? AND serviceName = ?`
        : `UPDATE node_amc_visits SET status = ? WHERE amcId = ? AND serviceName = ?`;
      
      await db.query(updateVisitSql, [visitStatus, order.amcId, order.serviceName]);

      if (status.toLowerCase() === 'completed') {
        const [visits] = await db.query('SELECT id, partnerPhone, partnerName FROM node_amc_visits WHERE amcId = ? AND serviceName = ? ORDER BY id DESC LIMIT 1', [order.amcId, order.serviceName]);
        if (visits.length > 0 && visits[0].partnerPhone) {
          const visit = visits[0];
          
          // Fetch payment ids from subscription
          const [subs] = await db.query('SELECT razorpayPaymentId, razorpayOrderId FROM node_amc_subscriptions WHERE amcId = ?', [order.amcId]);
          const razorpayPaymentId = subs.length > 0 ? subs[0].razorpayPaymentId : null;
          const razorpayOrderId = subs.length > 0 ? subs[0].razorpayOrderId : null;

          await db.query(`
            INSERT INTO node_amc_partner_payments (visitId, amcId, partnerPhone, partnerName, amount, status, razorpayPaymentId, razorpayOrderId)
            VALUES (?, ?, ?, ?, 350.00, 'pending', ?, ?)
          `, [visit.id, order.amcId, visit.partnerPhone, visit.partnerName, razorpayPaymentId, razorpayOrderId]);
        }
      }
    }

    res.json({ success: true, message: 'Order status updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update status', error: err.message });
  }
});


// ======================================================================
// 5. PARTNER PAYMENTS APIS
// ======================================================================

// GET /api/amc/partner-payments - List partner payments
router.get('/partner-payments', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, 
             COALESCE(p.razorpayPaymentId, s.razorpayPaymentId) AS razorpayPaymentId,
             COALESCE(p.razorpayOrderId, s.razorpayOrderId) AS razorpayOrderId
      FROM node_amc_partner_payments p
      LEFT JOIN node_amc_subscriptions s ON p.amcId = s.amcId
      ORDER BY p.id DESC
    `);

    const data = rows.map(row => ({
      ...row,
      paymentId: row.id,
      payment_id: row.id,
      razorpayId: row.id,
      razorpay_id: row.id,
      rozerpay_id: row.id
    }));

    res.json({ success: true, message: 'Partner payments retrieved successfully', data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve partner payments', error: err.message });
  }
});

// POST /api/amc/partner-payments/release
router.post('/partner-payments/release', async (req, res) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'paymentId parameter is required' });
    }

    const [result] = await db.query(`
      UPDATE node_amc_partner_payments 
      SET status = 'released', releasedAt = NOW()
      WHERE id = ? AND status = 'pending'
    `, [paymentId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Pending payment record not found or already released' });
    }

    res.json({ success: true, message: 'Partner payment released successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to release partner payment', error: err.message });
  }
});

// GET /api/amc/partner-payments/:id - Details of a payment
router.get('/partner-payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT p.*, 
             COALESCE(p.razorpayPaymentId, s.razorpayPaymentId) AS razorpayPaymentId,
             COALESCE(p.razorpayOrderId, s.razorpayOrderId) AS razorpayOrderId
      FROM node_amc_partner_payments p
      LEFT JOIN node_amc_subscriptions s ON p.amcId = s.amcId
      WHERE p.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const row = rows[0];
    const data = {
      ...row,
      paymentId: row.id,
      payment_id: row.id,
      razorpayId: row.id,
      razorpay_id: row.id,
      rozerpay_id: row.id
    };

    res.json({ success: true, message: 'Payment record retrieved successfully', data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve payment record', error: err.message });
  }
});


// ======================================================================
// 6. REPORTS APIS
// ======================================================================

// GET /api/amc/reports
router.get('/reports', async (req, res) => {
  try {
    const { type } = req.query;

    if (type === 'revenue') {
      const [rows] = await db.query(`
        SELECT DATE_FORMAT(startDate, '%Y-%m') as month, SUM(price) as revenue, COUNT(*) as subscriptionsSold
        FROM node_amc_subscriptions GROUP BY month ORDER BY month DESC
      `);
      return res.json({ success: true, message: 'Revenue report generated', data: rows });
    }

    if (type === 'amc') {
      const [rows] = await db.query(`
        SELECT status, category, COUNT(*) as count FROM node_amc_subscriptions GROUP BY status, category
      `);
      return res.json({ success: true, message: 'AMC status report generated', data: rows });
    }

    if (type === 'orders') {
      const [rows] = await db.query(`
        SELECT status, COUNT(*) as count FROM node_orders_v2 WHERE amcId IS NOT NULL GROUP BY status
      `);
      return res.json({ success: true, message: 'AMC orders report generated', data: rows });
    }

    if (type === 'visits') {
      const [rows] = await db.query(`
        SELECT status, COUNT(*) as count FROM node_amc_visits GROUP BY status
      `);
      return res.json({ success: true, message: 'Visits status report generated', data: rows });
    }

    if (type === 'payments') {
      const [rows] = await db.query(`
        SELECT status, SUM(amount) as totalAmount, COUNT(*) as count FROM node_amc_partner_payments GROUP BY status
      `);
      return res.json({ success: true, message: 'Partner payments report generated', data: rows });
    }

    const [[subCount]] = await db.query('SELECT COUNT(*) as count, SUM(price) as revenue FROM node_amc_subscriptions');
    const [[visitCount]] = await db.query('SELECT COUNT(*) as count FROM node_amc_visits');
    const [[releasedPayouts]] = await db.query('SELECT SUM(amount) as total FROM node_amc_partner_payments WHERE status = "released"');

    res.json({
      success: true,
      message: 'AMC Reports summary overview retrieved',
      data: {
        totalSubscriptions: subCount.count || 0,
        totalRevenue: parseFloat(subCount.revenue || 0),
        totalVisits: visitCount.count || 0,
        totalPayoutsReleased: parseFloat(releasedPayouts.total || 0)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate report', error: err.message });
  }
});


// ======================================================================
// 7. NOTIFICATIONS APIS
// ======================================================================

// GET /api/amc/notifications
router.get('/notifications', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM node_notifications WHERE title LIKE "%AMC%" ORDER BY id DESC LIMIT 20');
    res.json({ success: true, message: 'AMC notifications retrieved successfully', data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications', error: err.message });
  }
});

// PUT /api/amc/notifications/mark-read
router.put('/notifications/mark-read', async (req, res) => {
  try {
    await db.query('UPDATE node_notifications SET isRead = 1 WHERE title LIKE "%AMC%" AND isRead = 0');
    res.json({ success: true, message: 'AMC notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark notifications as read', error: err.message });
  }
});


// ======================================================================
// 8. GLOBAL SEARCH API
// ======================================================================

// GET /api/amc/search
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query q parameter is required' });
    }

    const [subs] = await db.query('SELECT * FROM node_amc_subscriptions WHERE amcId LIKE ? OR userPhone LIKE ? OR category LIKE ? LIMIT 5', [`%${q}%`, `%${q}%`, `%${q}%`]);
    const [visits] = await db.query('SELECT * FROM node_amc_visits WHERE amcId LIKE ? OR serviceName LIKE ? OR partnerName LIKE ? LIMIT 5', [`%${q}%`, `%${q}%`, `%${q}%`]);
    const [orders] = await db.query('SELECT * FROM node_orders_v2 WHERE amcId LIKE ? OR serviceName LIKE ? LIMIT 5', [`%${q}%`, `%${q}%`]);

    const populatedSubs = await Promise.all(subs.map(sub => populateSubscriptionData(sub)));

    res.json({
      success: true,
      message: 'Global search executed successfully',
      data: {
        subscriptions: populatedSubs,
        visits: visits,
        orders: orders
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Global search failed', error: err.message });
  }
});


// ======================================================================
// 9. PARAMETERIZED AMC SUBSCRIPTION ROUTES (MUST BE AT THE END)
// ======================================================================

// GET /api/amc/:amcId - Single contract details (Tailored for Screens 2 & 3)
router.get('/:amcId', async (req, res) => {
  try {
    const { amcId } = req.params;
    const [rows] = await db.query('SELECT * FROM node_amc_subscriptions WHERE amcId = ?', [amcId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    
    const sub = rows[0];
    const populated = await populateSubscriptionData(sub);

    // Fetch Visits
    const [visits] = await db.query('SELECT * FROM node_amc_visits WHERE amcId = ? ORDER BY scheduledDate ASC, id ASC', [amcId]);
    
    // Format recent visits preview list for UI
    const recentVisits = visits.map((v, index) => ({
      id: v.id,
      visitId: v.id,
      bookingCode: v.bookingCode || `BK000${index + 1}`,
      visitNumber: `Visit #${index + 1}`,
      serviceName: v.serviceName,
      scheduledDate: v.scheduledDate,
      date: v.scheduledDate,
      timeSlot: v.timeSlot,
      partnerName: v.partnerName || 'Pending',
      partnerPhone: v.partnerPhone || '',
      status: v.status === 'completed' ? 'completed' : 'upcoming',
      notes: v.description || v.notes || ''
    }));

    let assignedPartner = {
      partnerName: 'Pending',
      partnerPhone: '',
      isVerified: true
    };
    const assignedVisit = visits.slice().reverse().find(v => v.partnerName && v.partnerName.trim() !== '');
    if (assignedVisit) {
      assignedPartner = {
        partnerName: assignedVisit.partnerName,
        partnerPhone: assignedVisit.partnerPhone || '',
        isVerified: true
      };
    }

    res.json({
      success: true,
      message: 'Subscription details retrieved successfully',
      data: {
        ...populated,
        customerInfo: {
          customerName: populated.customerName,
          amcId: sub.amcId,
          phone: sub.userPhone,
          customerPhone: sub.userPhone,
          address: sub.address || 'Jaipur',
          status: (sub.status || 'active').toUpperCase()
        },
        propertyDetails: {
          category: sub.category,
          areaSqFt: sub.areaSqFt,
          floors: sub.floors,
          houseType: sub.houseType || 'Villa',
          photoUrl: sub.photoUrl || null
        },
        subscriptionDetails: {
          plan: sub.planName || 'Premium AMC',
          planName: sub.planName || 'Premium AMC',
          amount: parseFloat(sub.price),
          price: parseFloat(sub.price),
          paymentStatus: 'Paid',
          startDate: sub.startDate,
          expiryDate: sub.endDate,
          endDate: sub.endDate,
          createdAt: sub.startDate
        },
        assignedPartner,
        serviceProgress: {
          completedVisits: populated.completedVisits,
          totalVisits: populated.totalVisits,
          remainingVisits: populated.remainingVisits
        },
        recentVisits
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve subscription details', error: err.message });
  }
});

// GET /api/amc/:amcId/service-history - Timeline for Screens 4 & 5
router.get('/:amcId/service-history', async (req, res) => {
  try {
    const { amcId } = req.params;
    
    const [subs] = await db.query('SELECT * FROM node_amc_subscriptions WHERE amcId = ?', [amcId]);
    if (subs.length === 0) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    const sub = subs[0];
    const populated = await populateSubscriptionData(sub);

    // Get ALL visits for timeline (completed, pending, assigned)
    const [visits] = await db.query(`
      SELECT * FROM node_amc_visits 
      WHERE amcId = ? 
      ORDER BY scheduledDate ASC, id ASC
    `, [amcId]);

    const visitsTimeline = visits.map((v, idx) => ({
      id: v.id,
      visitId: v.id,
      bookingCode: v.bookingCode || `BK000${idx + 1}`,
      serviceName: v.serviceName,
      partnerName: v.partnerName || 'Pending',
      partnerPhone: v.partnerPhone || '',
      date: v.scheduledDate,
      scheduledDate: v.scheduledDate,
      timeSlot: v.timeSlot,
      notes: v.description || v.notes || 'Routine service visit.',
      rating: v.rating || (v.status === 'completed' ? 5 : 0),
      status: v.status === 'completed' ? 'completed' : (v.status === 'assigned' ? 'assigned' : 'upcoming')
    }));

    res.json({
      success: true,
      message: 'Service history retrieved successfully',
      data: {
        customerInfo: {
          customerName: populated.customerName,
          phone: sub.userPhone,
          customerPhone: sub.userPhone,
          amcId: sub.amcId,
          category: sub.category,
          address: sub.address || 'Jaipur'
        },
        visitSummary: {
          totalVisits: populated.totalVisits,
          completedVisits: populated.completedVisits,
          remainingVisits: populated.remainingVisits,
          expiryDate: sub.endDate
        },
        visitsTimeline,
        rawVisits: visits
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve service history', error: err.message });
  }
});

// POST /api/amc/:amcId/renew - Renew AMC Subscription
router.post('/:amcId/renew', async (req, res) => {
  try {
    const { amcId } = req.params;
    const { planId, planName, note, price, durationMonths } = req.body;

    const [subs] = await db.query('SELECT * FROM node_amc_subscriptions WHERE amcId = ?', [amcId]);
    if (subs.length === 0) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const currentSub = subs[0];
    const months = parseInt(durationMonths) || 12;
    const renewPrice = parseFloat(price) || parseFloat(currentSub.price);

    // Calculate new end date based on current end date (if in future) or current date (if expired)
    let baseDate = new Date();
    if (currentSub.endDate && new Date(currentSub.endDate) > new Date()) {
      baseDate = new Date(currentSub.endDate);
    }
    baseDate.setMonth(baseDate.getMonth() + months);

    // Helper for formatting local MySQL DATETIME (YYYY-MM-DD HH:mm:ss)
    const pad = (n) => String(n).padStart(2, '0');
    const newEndDateStr = `${baseDate.getFullYear()}-${pad(baseDate.getMonth() + 1)}-${pad(baseDate.getDate())} ${pad(baseDate.getHours())}:${pad(baseDate.getMinutes())}:${pad(baseDate.getSeconds())}`;
    
    const nowObj = new Date();
    const nowStr = `${nowObj.getFullYear()}-${pad(nowObj.getMonth() + 1)}-${pad(nowObj.getDate())} ${pad(nowObj.getHours())}:${pad(nowObj.getMinutes())}:${pad(nowObj.getSeconds())}`;

    const updateNote = note ? `${currentSub.note || ''} [Renewed: ${note}]` : (currentSub.note || '');
    const newPlanName = planName || currentSub.planName || 'Premium AMC';

    await db.query(`
      UPDATE node_amc_subscriptions 
      SET status = 'active', price = ?, startDate = ?, endDate = ?, note = ?, planName = ?
      WHERE amcId = ?
    `, [renewPrice, nowStr, newEndDateStr, updateNote, newPlanName, amcId]);

    // Fetch updated record
    const [updatedSubs] = await db.query('SELECT * FROM node_amc_subscriptions WHERE amcId = ?', [amcId]);
    const populated = await populateSubscriptionData(updatedSubs[0]);

    res.json({
      success: true,
      message: 'AMC subscription renewed successfully and moved to active list',
      data: populated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to renew AMC subscription', error: err.message });
  }
});


// PUT /api/amc/:amcId/cancel - Cancel AMC Subscription
router.put('/:amcId/cancel', async (req, res) => {
  try {
    const { amcId } = req.params;
    const { reason } = req.body;

    const [subs] = await db.query('SELECT * FROM node_amc_subscriptions WHERE amcId = ?', [amcId]);
    if (subs.length === 0) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const noteAppend = reason ? ` [Cancelled: ${reason}]` : ' [Cancelled by Admin]';

    await db.query(`
      UPDATE node_amc_subscriptions 
      SET status = 'cancelled', note = CONCAT(COALESCE(note, ''), ?)
      WHERE amcId = ?
    `, [noteAppend, amcId]);

    res.json({
      success: true,
      message: 'AMC subscription cancelled successfully',
      data: {
        amcId,
        status: 'cancelled',
        reason: reason || 'No reason provided'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to cancel AMC subscription', error: err.message });
  }
});

// PUT /api/amc/:amcId/mark-paid - Mark AMC Subscription as Paid (Active)
router.put('/:amcId/mark-paid', async (req, res) => {
  try {
    const { amcId } = req.params;

    const [subs] = await db.query('SELECT * FROM node_amc_subscriptions WHERE amcId = ?', [amcId]);
    if (subs.length === 0) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const sub = subs[0];
    if (sub.status === 'active') {
      return res.status(400).json({ success: false, message: 'Subscription is already active' });
    }

    const noteAppend = ' [Paid Offline: Verified by Admin]';
    await db.query(`
      UPDATE node_amc_subscriptions 
      SET status = 'active', 
          note = CONCAT(COALESCE(note, ''), ?),
          razorpayPaymentId = COALESCE(razorpayPaymentId, 'OFFLINE_ADMIN')
      WHERE amcId = ?
    `, [noteAppend, amcId]);

    const [updatedSubs] = await db.query('SELECT * FROM node_amc_subscriptions WHERE amcId = ?', [amcId]);
    const populated = await populateSubscriptionData(updatedSubs[0]);

    res.json({
      success: true,
      message: 'AMC subscription marked as paid and activated successfully',
      data: populated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark AMC subscription as paid', error: err.message });
  }
});

// POST /api/amc/:amcId/book-service
router.post('/:amcId/book-service', async (req, res) => {
  try {
    const { amcId } = req.params;
    const { serviceName, scheduledDate, timeSlot, description } = req.body;

    if (!serviceName || !scheduledDate || !timeSlot) {
      return res.status(400).json({ success: false, message: 'Missing required booking parameters' });
    }

    const [subs] = await db.query('SELECT userPhone FROM node_amc_subscriptions WHERE amcId = ?', [amcId]);
    if (subs.length === 0) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const userPhone = subs[0].userPhone;
    const bookingCode = `BK${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Create a Visit record
    const [visitResult] = await db.query(`
      INSERT INTO node_amc_visits (amcId, bookingCode, userPhone, scheduledDate, timeSlot, serviceName, description, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [amcId, bookingCode, userPhone, scheduledDate, timeSlot, serviceName, description || '', description || '']);

    // 2. Insert into node_orders_v2 for app/dashboard order listing compatibility
    const initialAddress = JSON.stringify({
      id: 0,
      userPhone: userPhone,
      type: 'Home',
      houseNo: 'AMC Managed Site',
      society: 'AMC Contract Location',
      city: 'Jaipur',
      locality: 'AMC Locality',
      pincode: '302001',
      name: 'AMC Client'
    });

    const [orderResult] = await db.query(`
      INSERT INTO node_orders_v2 (userPhone, serviceName, price, date, status, bookingStatus, productId, description, timeSlot, address, payment, amcId, createdAt)
      VALUES (?, ?, 0.00, ?, 'Pending', 'searching', ?, ?, ?, ?, '{"paymentMethod":"AMC","amountPaid":0}', ?, ?)
    `, [userPhone, serviceName, scheduledDate, serviceName, description || '', timeSlot, initialAddress, amcId, Date.now()]);

    res.status(201).json({
      success: true,
      message: 'AMC Service visit booked successfully',
      data: {
        visitId: visitResult.insertId,
        bookingCode,
        orderId: orderResult.insertId,
        amcId,
        serviceName,
        scheduledDate,
        timeSlot
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to book service visit', error: err.message });
  }
});

module.exports = router;
