const express = require('express');
const router = express.Router();
const db = require('../db');

// ─────────────────────────────────────────────
// NOTE: db.js auto-prefixes table names with "node_"
// So writing 'orders'  → queries 'node_orders'  (admin panel orders)
//    writing 'partners' → queries 'node_partners' (but we use 'partners' table)
// node_orders schema: id, serviceRequestNumber, serviceName, serviceAmount,
//   slotTime, serviceDate, city, locality, status, vendorName, vendorMobile,
//   address, createdAt, paymentMethod, latitude, longitude
// ─────────────────────────────────────────────

// Helper: Haversine distance in km
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Helper: Resolve partner name from phone number
async function resolveVendorName(vendorName, vendorPhone, phone, mobile, vendorMobile) {
  let targetPhone = vendorPhone || phone || mobile || vendorMobile;
  let lookupName = vendorName || '';

  if (!targetPhone && lookupName && /^\+?\d{10,15}$/.test(String(lookupName).trim())) {
    targetPhone = String(lookupName).trim();
  }

  if (targetPhone) {
    let cleanedPhone = String(targetPhone).trim().replace(/\s+/g, '');
    if (cleanedPhone.startsWith('+91') && cleanedPhone.length === 13) {
      cleanedPhone = cleanedPhone.substring(3);
    } else if (cleanedPhone.startsWith('91') && cleanedPhone.length === 12) {
      cleanedPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.startsWith('+')) {
      cleanedPhone = cleanedPhone.replace('+', '');
    }

    let [partners] = await db.query(
      'SELECT name FROM partners WHERE mobile = ? OR mobile = ? OR CONCAT(countryCode, mobile) = ?',
      [cleanedPhone, targetPhone, targetPhone]
    );

    if (partners.length === 0) {
      const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
      const [laravelRows] = await db.query(
        `SELECT name FROM \`${dbName}\`.\`users\` WHERE role_id = 2 AND (mobile_number = ? OR mobile_number = ? OR mobile_number = ?)`,
        [cleanedPhone, targetPhone, `+91${cleanedPhone}`]
      );
      if (laravelRows.length > 0) {
        partners = laravelRows;
      }
    }

    if (partners.length === 0) {
      throw new Error(`No partner found with phone number: ${targetPhone}`);
    }
    return partners[0].name;
  }

  return (lookupName === '' || lookupName === '-') ? null : lookupName;
}


// Helper: Sequentially lookup an order ID to find which table it belongs to
async function findOrderSource(orderId) {
  const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
  
  // 1. Check node_orders_v2 (Flutter application bookings)
  const [v2Rows] = await db.query('SELECT id FROM node_orders_v2 WHERE id = ?', [orderId]);
  if (v2Rows.length > 0) {
    return { source: 'v2', id: orderId };
  }

  // 2. Check orders (node_orders - Admin panel bookings)
  const [nodeRows] = await db.query('SELECT id FROM orders WHERE id = ?', [orderId]);
  if (nodeRows.length > 0) {
    return { source: 'admin', id: orderId };
  }

  // 3. Check Laravel order_items
  const [laravelRows] = await db.query(`SELECT id FROM \`${dbName}\`.\`order_items\` WHERE id = ?`, [orderId]);
  if (laravelRows.length > 0) {
    return { source: 'laravel', id: orderId };
  }

  return null;
}

// Helper: Get all orders from admin, v2 (live app), and Laravel tables
async function getAllOrders(req) {
  const dbName = process.env.DB_NAME || 'homef4fw_homefaci';

  // Fetch all orders, partners, and users maps in parallel to reduce sequential database network roundtrip times
  const [
    [partners = []],
    [laravelPartners = []],
    [v2Users = []],
    [nodeOrders = []],
    [nodeV2Orders = []],
    [laravelOrders = []]
  ] = await Promise.all([
    db.query('SELECT id, name, mobile FROM partners').catch(err => { console.warn('Order fetch partners error:', err.message); return [[]]; }),
    db.query(`SELECT id, name, mobile_number FROM \`${dbName}\`.\`users\` WHERE role_id = 2`).catch(err => { console.warn('Order fetch laravel partners error:', err.message); return [[]]; }),
    db.query("SELECT phone, name FROM node_users_v2 WHERE phone IS NOT NULL AND phone != ''").catch(err => { console.warn('Order fetch v2Users error:', err.message); return [[]]; }),
    db.query('SELECT * FROM orders').catch(err => { console.warn('Order fetch orders error:', err.message); return [[]]; }),
    db.query('SELECT * FROM node_orders_v2').catch(err => { console.warn('Order fetch nodeV2Orders error:', err.message); return [[]]; }),
    db.query(`
      SELECT 
        oi.id, 
        oi.service_request_number, 
        oi.service_name, 
        oi.total_amount, 
        oi.time_slot, 
        oi.service_date, 
        oi.status, 
        oi.vendor_id, 
        oi.created_at, 
        o.address,
        o.payment_method,
        u.name AS customer_name,
        u.mobile_number AS customer_mobile
      FROM \`${dbName}\`.\`order_items\` oi
      LEFT JOIN \`${dbName}\`.\`orders\` o ON oi.order_id = o.id
      LEFT JOIN \`${dbName}\`.\`users\` u ON o.user_id = u.id
    `).catch(err => { console.warn('Order fetch laravelOrders error:', err.message); return [[]]; })
  ]);

  const partnerMobileMap = {};
  const partnerNameMap = {};
  partners.forEach(p => {
    partnerMobileMap[p.name] = p.mobile;
    partnerNameMap[p.id] = p.name;
  });

  const laravelPartnerMobileMap = {};
  const laravelPartnerNameMap = {};
  laravelPartners.forEach(p => {
    laravelPartnerMobileMap[p.id] = p.mobile_number;
    laravelPartnerNameMap[p.id] = p.name;
  });

  const v2UsersMap = {};
  v2Users.forEach(u => {
    v2UsersMap[u.phone] = u.name;
  });

  const list = [];

  // 1. Fetch from node_orders (Admin Panel manually created orders)
  nodeOrders.forEach(r => {
    const yearMatch = String(r.createdAt).match(/\b(20\d{2})\b/);
    const orderYear = yearMatch ? yearMatch[1] : new Date().getFullYear();
    const paddedId = String(r.id).padStart(4, '0');
    const reqNum = `#REQ ${orderYear}-${paddedId}`;

    const vMobile = r.vendorMobile || '';

    list.push({
      id: r.id,
      createdTimestamp: r.createdAt ? new Date(r.createdAt).getTime() : 0,
      serviceRequestNumber: reqNum,
      serviceName: r.serviceName || '',
      serviceAmount: parseFloat(r.serviceAmount || 0),
      slotTime: r.slotTime || '',
      serviceDate: r.serviceDate || '',
      city: r.city || '',
      locality: r.locality || '',
      status: r.status || 'Pending',
      vendorName: r.vendorName || '-',
      partnerName: r.vendorName || '-',
      vendorMobile: vMobile,
      partnerPhone: vMobile,
      partnerMobile: vMobile,
      vendorPhone: vMobile,
      address: r.address || '',
      createdAt: r.createdAt || '',
      paymentMethod: r.paymentMethod || 'COD',
      latitude: r.latitude,
      longitude: r.longitude,
      source: 'Admin Panel (MySQL)',
      customerName: '-',
      customerMobile: '-',
      customerPhone: '-',
      userPhone: '-',
      phone: '-',
      mobile: '-'
    });
  });

  // 2. Fetch from node_orders_v2 (Live orders from Flutter apps)
  nodeV2Orders.forEach(r => {
    let addrObj = {};
    try {
      addrObj = JSON.parse(r.address || '{}');
    } catch (e) {}

    let payObj = {};
    try {
      payObj = JSON.parse(r.payment || '{}');
    } catch (e) {}

    const fullAddr = addrObj.houseNo 
      ? `${addrObj.houseNo}, ${addrObj.society || ''}, ${addrObj.locality || ''}, ${addrObj.city || ''}`.replace(/,\s*,/g, ',').trim()
      : (r.address || '');

    const createdStr = r.createdAt 
      ? new Date(r.createdAt).toLocaleString('en-US') 
      : '';

    const orderYear = r.createdAt ? new Date(r.createdAt).getFullYear() : new Date().getFullYear();
    const paddedId = String(r.id).padStart(4, '0');
    const reqNum = `#REQ ${orderYear}-${paddedId}`;

    // Resolve customerName and customerMobile
    let customerName = addrObj.name || '';
    if (!customerName && r.userPhone) {
      customerName = v2UsersMap[r.userPhone] || '';
    }
    if (!customerName) {
      customerName = 'Guest User';
    }

    const customerMobile = addrObj.userPhone || r.userPhone || '-';
    const pPhone = r.partnerPhone || partnerMobileMap[r.partnerName] || '';

    list.push({
      id: r.id, // Raw database ID directly
      createdTimestamp: typeof r.createdAt === 'number' ? r.createdAt : (r.createdAt ? new Date(r.createdAt).getTime() : 0),
      serviceRequestNumber: reqNum,
      serviceName: r.serviceName || '',
      serviceAmount: parseFloat(r.price || 0),
      slotTime: r.timeSlot || '',
      serviceDate: r.date || '',
      city: addrObj.city || '',
      locality: addrObj.locality || '',
      status: r.status || 'Pending',
      vendorName: r.partnerName || '-',
      partnerName: r.partnerName || '-',
      vendorMobile: pPhone,
      partnerPhone: pPhone,
      partnerMobile: pPhone,
      vendorPhone: pPhone,
      address: fullAddr,
      createdAt: createdStr,
      paymentMethod: payObj.paymentMethod || 'COD',
      latitude: addrObj.latitude ? parseFloat(addrObj.latitude) : null,
      longitude: addrObj.longitude ? parseFloat(addrObj.longitude) : null,
      source: 'User App (MySQL v2)',
      customerName,
      customerMobile,
      customerPhone: customerMobile,
      userPhone: customerMobile,
      phone: customerMobile,
      mobile: customerMobile
    });
  });

  laravelOrders.forEach(r => {
    const createdStr = r.created_at 
      ? new Date(r.created_at).toLocaleString('en-US') 
      : '';
    
    let dateStr = '';
    let orderYear = 2025;
    if (r.service_date) {
      const d = new Date(r.service_date);
      dateStr = d.toLocaleDateString('en-IN');
      orderYear = d.getFullYear();
    } else if (r.created_at) {
      orderYear = new Date(r.created_at).getFullYear();
    }

    const paddedId = String(r.id).padStart(4, '0');
    const reqNum = `#REQ ${orderYear}-${paddedId}`;
    const cMobile = r.customer_mobile || '-';
    const pPhone = laravelPartnerMobileMap[r.vendor_id] || '';

    list.push({
      id: r.id, // Raw database ID directly
      createdTimestamp: r.created_at ? new Date(r.created_at).getTime() : 0,
      serviceRequestNumber: reqNum,
      serviceName: r.service_name || '',
      serviceAmount: parseFloat(r.total_amount || 0),
      slotTime: r.time_slot || '',
      serviceDate: dateStr,
      city: '',
      locality: '',
      status: r.status || 'Pending',
      vendorName: laravelPartnerNameMap[r.vendor_id] || '-',
      partnerName: laravelPartnerNameMap[r.vendor_id] || '-',
      vendorMobile: pPhone,
      partnerPhone: pPhone,
      partnerMobile: pPhone,
      vendorPhone: pPhone,
      address: r.address || '',
      createdAt: createdStr,
      paymentMethod: r.payment_method || 'COD',
      latitude: null,
      longitude: null,
      source: 'App User (Laravel)',
      customerName: r.customer_name || '-',
      customerMobile: cMobile,
      customerPhone: cMobile,
      userPhone: cMobile,
      phone: cMobile,
      mobile: cMobile
    });
  });


// Helper: Safely parse timestamp from order item for descending sort
function parseOrderTimestamp(item) {
  if (item.createdTimestamp) return item.createdTimestamp;
  if (typeof item.createdAt === 'number') return item.createdAt;
  if (item.createdAt) {
    const parsed = Date.parse(item.createdAt);
    if (!isNaN(parsed)) return parsed;
  }
  if (item.serviceDate) {
    const parsed = Date.parse(item.serviceDate);
    if (!isNaN(parsed)) return parsed;
  }
  return item.id || 0;
}

  // Sort by Creation Timestamp descending so newest orders always appear at the top
  list.sort((a, b) => {
    const timeA = parseOrderTimestamp(a);
    const timeB = parseOrderTimestamp(b);
    if (timeB !== timeA) return timeB - timeA;
    return b.id - a.id;
  });

  return list;
}

// ─────────────────────────────────────────────
// GET /api/orders  — List all orders (admin panel)
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  let retries = 2;
  while (retries >= 0) {
    try {
      const list = await getAllOrders(req);
      return res.json({ success: true, data: list });
    } catch (error) {
      if (retries > 0 && (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST')) {
        console.warn(`Orders fetch timeout, retrying... (${retries} retries left)`);
        retries--;
        await new Promise(r => setTimeout(r, 2000)); // wait 2s before retry
      } else {
        console.error('Error fetching orders:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
      }
    }
  }
});

// ─────────────────────────────────────────────
// GET /api/orders/:id  — Single order detail
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const rawId = parseInt(req.params.id);
  if (isNaN(rawId)) {
    return res.status(400).json({ success: false, message: 'Invalid Order ID format' });
  }

  try {
    const orderSource = await findOrderSource(rawId);
    if (!orderSource) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const list = await getAllOrders(req);
    const order = list.find(o => {
      if (orderSource.source === 'v2') return o.source === 'User App (MySQL v2)' && o.id === rawId;
      if (orderSource.source === 'admin') return o.source === 'Admin Panel (MySQL)' && o.id === rawId;
      if (orderSource.source === 'laravel') return o.source === 'App User (Laravel)' && o.id === rawId;
      return false;
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order details', error: error.message });
  }
});

// ─────────────────────────────────────────────
// PUT /api/orders/:id  — Update order fields
// ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const rawId = parseInt(req.params.id);
  if (isNaN(rawId)) {
    return res.status(400).json({ success: false, message: 'Invalid Order ID format' });
  }
  
  const { status, vendorName, vendorMobile, slotTime, serviceDate, city, locality, address } = req.body;
  const dbName = process.env.DB_NAME || 'homef4fw_homefaci';

  try {
    const orderSource = await findOrderSource(rawId);
    if (!orderSource) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let oldStatus = null;
    let currentOrder = null;
    if (orderSource.source === 'v2') {
      const [rows] = await db.query('SELECT * FROM node_orders_v2 WHERE id = ?', [rawId]);
      if (rows.length > 0) {
        currentOrder = rows[0];
        oldStatus = currentOrder.status;
      }
    } else if (orderSource.source === 'admin') {
      const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [rawId]);
      if (rows.length > 0) {
        currentOrder = rows[0];
        oldStatus = currentOrder.status;
      }
    }

    let resolvedName = null;
    let resolvedMobile = req.body.vendorPhone || req.body.phone || req.body.mobile || req.body.vendorMobile || null;
    const hasVendorUpdate = (vendorName !== undefined || req.body.vendorPhone !== undefined || req.body.phone !== undefined || req.body.mobile !== undefined || req.body.vendorMobile !== undefined);

    if (hasVendorUpdate) {
      try {
        resolvedName = await resolveVendorName(vendorName, req.body.vendorPhone, req.body.phone, req.body.mobile, req.body.vendorMobile);
        if (resolvedName && !resolvedMobile) {
          const [partners] = await db.query('SELECT mobile FROM partners WHERE name = ?', [resolvedName]);
          if (partners.length > 0) {
            resolvedMobile = partners[0].mobile;
          }
        }
      } catch (err) {
        return res.status(404).json({ success: false, message: err.message });
      }
    }

    if (resolvedMobile) {
      let cleaned = String(resolvedMobile).trim().replace(/\s+/g, '');
      if (cleaned.startsWith('+91') && cleaned.length === 13) {
        resolvedMobile = cleaned.substring(3);
      } else if (cleaned.startsWith('91') && cleaned.length === 12) {
        resolvedMobile = cleaned.substring(2);
      } else if (cleaned.startsWith('+')) {
        resolvedMobile = cleaned.replace('+', '');
      }
    }

    if (orderSource.source === 'v2') {
      // It is a node_orders_v2 order
      const fields = [];
      const values = [];

      if (status !== undefined) {
        fields.push('`status` = ?');
        values.push(status);
        
        fields.push('`bookingStatus` = ?');
        const bStatus = status.toLowerCase() === 'pending' ? 'searching' : status.toLowerCase();
        values.push(bStatus);
      }

      if (hasVendorUpdate) {
        fields.push('`partnerName` = ?');
        values.push(resolvedName);
      }

      if (slotTime !== undefined) { fields.push('`timeSlot` = ?'); values.push(slotTime); }
      if (serviceDate !== undefined) { fields.push('`date` = ?'); values.push(serviceDate); }
      if (address !== undefined) { fields.push('`address` = ?'); values.push(address); }

      if (fields.length === 0) {
        const list = await getAllOrders(req);
        const updatedOrder = list.find(o => {
          if (orderSource.source === 'v2') return o.source === 'User App (MySQL v2)' && o.id === rawId;
          if (orderSource.source === 'admin') return o.source === 'Admin Panel (MySQL)' && o.id === rawId;
          if (orderSource.source === 'laravel') return o.source === 'App User (Laravel)' && o.id === rawId;
          return false;
        });
        return res.json({
          success: true,
          message: 'Order updated successfully (no changes made)',
          data: updatedOrder
        });
      }

      values.push(rawId);
      await db.query('UPDATE node_orders_v2 SET ' + fields.join(', ') + ' WHERE id = ?', values);

    } else if (orderSource.source === 'laravel') {
      // It is a Laravel order (maps to order_items)
      const oiFields = [];
      const oiValues = [];

      if (status !== undefined) {
        oiFields.push('`status` = ?');
        oiValues.push(status);
      }

      if (hasVendorUpdate) {
        let laravelVendorId = null;
        if (resolvedName) {
          const [laravelRows] = await db.query(`SELECT id FROM \`${dbName}\`.\`users\` WHERE role_id = 2 AND name = ?`, [resolvedName]);
          if (laravelRows.length > 0) {
            laravelVendorId = laravelRows[0].id;
          }
        }
        oiFields.push('`vendor_id` = ?');
        oiValues.push(laravelVendorId);
      }

      if (slotTime !== undefined) { oiFields.push('`time_slot` = ?'); oiValues.push(slotTime); }
      if (serviceDate !== undefined) { oiFields.push('`service_date` = ?'); oiValues.push(serviceDate); }

      if (oiFields.length > 0) {
        oiValues.push(rawId);
        await db.query(`UPDATE \`${dbName}\`.\`order_items\` SET ${oiFields.join(', ')} WHERE id = ?`, oiValues);
      }

      if (address !== undefined) {
        const [oiRows] = await db.query(`SELECT order_id FROM \`${dbName}\`.\`order_items\` WHERE id = ?`, [rawId]);
        if (oiRows.length > 0 && oiRows[0].order_id) {
          await db.query(`UPDATE \`${dbName}\`.\`orders\` SET address = ? WHERE id = ?`, [address, oiRows[0].order_id]);
        }
      }

    } else {
      // It is a node_orders (original Admin panel order)
      const fields = [];
      const values = [];

      if (status !== undefined) { fields.push('`status` = ?'); values.push(status); }
      if (hasVendorUpdate) {
        fields.push('`vendorName` = ?');
        values.push(resolvedName);
        fields.push('`vendorMobile` = ?');
        values.push(resolvedMobile);
      }
      if (slotTime !== undefined) { fields.push('`slotTime` = ?'); values.push(slotTime); }
      if (serviceDate !== undefined) { fields.push('`serviceDate` = ?'); values.push(serviceDate); }
      if (city !== undefined) { fields.push('`city` = ?'); values.push(city); }
      if (locality !== undefined) { fields.push('`locality` = ?'); values.push(locality); }
      if (address !== undefined) { fields.push('`address` = ?'); values.push(address); }

      if (fields.length === 0) {
        const list = await getAllOrders(req);
        const updatedOrder = list.find(o => {
          if (orderSource.source === 'v2') return o.source === 'User App (MySQL v2)' && o.id === rawId;
          if (orderSource.source === 'admin') return o.source === 'Admin Panel (MySQL)' && o.id === rawId;
          if (orderSource.source === 'laravel') return o.source === 'App User (Laravel)' && o.id === rawId;
          return false;
        });
        return res.json({
          success: true,
          message: 'Order updated successfully (no changes made)',
          data: updatedOrder
        });
      }

      values.push(rawId);
      await db.query('UPDATE orders SET ' + fields.join(', ') + ' WHERE id = ?', values);
    }

    // If status updated to Completed, credit the partner's wallet/earnings dynamically
    if (status !== undefined && status === 'Completed' && oldStatus !== 'Completed') {
      const assignedName = resolvedName || (orderSource.source === 'v2' ? currentOrder.partnerName : currentOrder.vendorName);
      if (assignedName) {
        const [partners] = await db.query('SELECT * FROM partners WHERE name = ?', [assignedName]);
        if (partners.length > 0) {
          const partner = partners[0];
          const serviceAmount = parseFloat((orderSource.source === 'v2' ? currentOrder.price : currentOrder.serviceAmount) || 0);
          const commissionRate = 25;
          const commissionAmount = (serviceAmount * commissionRate) / 100;
          const partnerShare = serviceAmount - commissionAmount;

          let isCash = false;
          if (orderSource.source === 'v2') {
            try {
              const payObj = typeof currentOrder.payment === 'string' ? JSON.parse(currentOrder.payment) : (currentOrder.payment || {});
              isCash = (payObj.paymentMethod || '').toLowerCase() === 'cash';
            } catch (e) {}
          } else {
            isCash = (currentOrder.paymentMethod || '').toLowerCase() === 'cash';
          }

          const walletIncrement = isCash ? 0.00 : partnerShare;
          const payToCompanyIncrement = isCash ? commissionAmount : 0.00;

          // Update partner
          await db.query(
            `UPDATE partners 
             SET completedBookings = completedBookings + 1,
                 totalBookings = totalBookings + 1,
                 totalEarnings = totalEarnings + ?,
                 walletBalance = walletBalance + ?,
                 payToCompany = payToCompany + ?
             WHERE id = ?`,
            [partnerShare, walletIncrement, payToCompanyIncrement, partner.id]
          );

          // Log transaction in booking_earnings
          const transactionId = 'TXN-' + Date.now();
          const todayStr = new Date().toLocaleDateString('en-IN');
          const paymentMethodStr = isCash ? 'Cash' : 'Online';
          await db.query(
            `INSERT INTO booking_earnings (transactionId, serviceAmount, paymentMethod, extraServiceAmount, extraServicePaymentMethod, totalAmount, orderDate) 
             VALUES (?, ?, ?, 0.00, '-', ?, ?)`,
            [transactionId, serviceAmount, paymentMethodStr, serviceAmount, todayStr]
          );
          console.log(`[Admin Update] Successfully credited earnings to partner ${partner.name} for completed order ${rawId}`);
        }
      }
    }

    const list = await getAllOrders(req);
    const updatedOrder = list.find(o => {
      if (orderSource.source === 'v2') return o.source === 'User App (MySQL v2)' && o.id === rawId;
      if (orderSource.source === 'admin') return o.source === 'Admin Panel (MySQL)' && o.id === rawId;
      if (orderSource.source === 'laravel') return o.source === 'App User (Laravel)' && o.id === rawId;
      return false;
    });

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder
    });

  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ success: false, message: 'Failed to update order', error: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/orders/:id
// ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const rawId = parseInt(req.params.id);
  if (isNaN(rawId)) {
    return res.status(400).json({ success: false, message: 'Invalid Order ID format' });
  }
  const dbName = process.env.DB_NAME || 'homef4fw_homefaci';

  try {
    const orderSource = await findOrderSource(rawId);
    if (!orderSource) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let affected = 0;
    if (orderSource.source === 'v2') {
      const [result] = await db.query('DELETE FROM node_orders_v2 WHERE id = ?', [rawId]);
      affected = result.affectedRows;
    } else if (orderSource.source === 'laravel') {
      const [result] = await db.query(`DELETE FROM \`${dbName}\`.\`order_items\` WHERE id = ?`, [rawId]);
      affected = result.affectedRows;
    } else {
      const [result] = await db.query('DELETE FROM orders WHERE id = ?', [rawId]);
      affected = result.affectedRows;
    }

    if (affected === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, message: 'Failed to delete order', error: error.message });
  }
});

// ─────────────────────────────────────────────
// PUT /api/orders/:id/assign  — Admin assigns order to a partner
// Accepts: { vendorName } OR { vendorPhone / phone / mobile }
// ─────────────────────────────────────────────
router.put('/:id/assign', async (req, res) => {
  const rawId = parseInt(req.params.id);
  if (isNaN(rawId)) {
    return res.status(400).json({ success: false, message: 'Invalid Order ID format' });
  }
  const { vendorName, vendorPhone, phone, mobile, vendorMobile } = req.body;
  const dbName = process.env.DB_NAME || 'homef4fw_homefaci';

  try {
    const orderSource = await findOrderSource(rawId);
    if (!orderSource) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let resolvedName = null;
    try {
      resolvedName = await resolveVendorName(vendorName, vendorPhone, phone, mobile, vendorMobile);
    } catch (err) {
      return res.status(404).json({ success: false, message: err.message });
    }

    const newStatus = resolvedName === null ? 'Pending' : 'Assigned';

    let resolvedMobile = req.body.vendorPhone || req.body.phone || req.body.mobile || req.body.vendorMobile || null;

    // 1. If we have name but missing phone, lookup phone
    if (resolvedName && !resolvedMobile) {
      resolvedName = String(resolvedName).trim();
      const [partners] = await db.query(
        'SELECT name, mobile FROM partners WHERE TRIM(LOWER(name)) = TRIM(LOWER(?)) OR TRIM(LOWER(name)) LIKE CONCAT("%", TRIM(LOWER(?)), "%")',
        [resolvedName, resolvedName]
      );
      if (partners.length > 0) {
        resolvedMobile = partners[0].mobile;
        resolvedName = partners[0].name; // Use canonical name from DB
      } else {
        const [laravelRows] = await db.query(
          `SELECT name, mobile_number AS mobile FROM \`${dbName}\`.\`users\` WHERE role_id = 2 AND (TRIM(LOWER(name)) = TRIM(LOWER(?)) OR TRIM(LOWER(name)) LIKE CONCAT("%", TRIM(LOWER(?)), "%"))`,
          [resolvedName, resolvedName]
        );
        if (laravelRows.length > 0) {
          resolvedMobile = laravelRows[0].mobile;
          resolvedName = laravelRows[0].name;
        }
      }
    }

    // 2. If we have phone but missing name, lookup name
    if (resolvedMobile && !resolvedName) {
      let cleanedPhone = String(resolvedMobile).trim().replace(/\s+/g, '').replace(/^\+?91/, '');
      const [partners] = await db.query(
        'SELECT name, mobile FROM partners WHERE mobile = ? OR mobile = ? OR CONCAT(countryCode, mobile) = ?',
        [cleanedPhone, resolvedMobile, resolvedMobile]
      );
      if (partners.length > 0) {
        resolvedName = partners[0].name;
        resolvedMobile = partners[0].mobile;
      } else {
        const [laravelRows] = await db.query(
          `SELECT name, mobile_number AS mobile FROM \`${dbName}\`.\`users\` WHERE role_id = 2 AND (mobile_number = ? OR mobile_number = ? OR mobile_number = ?)`,
          [cleanedPhone, resolvedMobile, `+91${cleanedPhone}`]
        );
        if (laravelRows.length > 0) {
          resolvedName = laravelRows[0].name;
          resolvedMobile = laravelRows[0].mobile;
        }
      }
    }

    if (resolvedName) {
      resolvedName = String(resolvedName).trim();
    }

    if (resolvedMobile) {
      let cleaned = String(resolvedMobile).trim().replace(/\s+/g, '');
      if (cleaned.startsWith('+91') && cleaned.length === 13) {
        resolvedMobile = cleaned.substring(3);
      } else if (cleaned.startsWith('91') && cleaned.length === 12) {
        resolvedMobile = cleaned.substring(2);
      } else if (cleaned.startsWith('+')) {
        resolvedMobile = cleaned.replace('+', '');
      }
    }

    if (orderSource.source === 'v2') {
      const bStatus = newStatus === 'Pending' ? 'searching' : 'assigned';
      const [result] = await db.query(
        'UPDATE node_orders_v2 SET partnerName = ?, partnerPhone = ?, status = ?, bookingStatus = ? WHERE id = ?',
        [resolvedName, resolvedMobile, newStatus, bStatus, rawId]
      );
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Order not found' });

    } else if (orderSource.source === 'laravel') {
      let laravelVendorId = null;
      if (resolvedName) {
        const [laravelRows] = await db.query(
          `SELECT id FROM \`${dbName}\`.\`users\` WHERE role_id = 2 AND TRIM(LOWER(name)) = TRIM(LOWER(?))`,
          [resolvedName]
        );
        if (laravelRows.length > 0) {
          laravelVendorId = laravelRows[0].id;
        }
      }
      const [result] = await db.query(
        `UPDATE \`${dbName}\`.\`order_items\` SET vendor_id = ?, status = ? WHERE id = ?`,
        [laravelVendorId, newStatus, rawId]
      );
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Order not found' });

    } else {
      const [result] = await db.query(
        'UPDATE orders SET vendorName = ?, vendorMobile = ?, status = ? WHERE id = ?',
        [resolvedName, resolvedMobile, newStatus, rawId]
      );
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Order not found' });
    }


    const list = await getAllOrders(req);
    const updatedOrder = list.find(o => {
      if (orderSource.source === 'v2') return o.source === 'User App (MySQL v2)' && o.id === rawId;
      if (orderSource.source === 'admin') return o.source === 'Admin Panel (MySQL)' && o.id === rawId;
      if (orderSource.source === 'laravel') return o.source === 'App User (Laravel)' && o.id === rawId;
      return false;
    });

    res.json({
      success: true,
      message: resolvedName === null ? 'Order unassigned successfully' : `Order assigned to ${resolvedName} successfully`,
      data: updatedOrder
    });

  } catch (error) {
    console.error('Error assigning order:', error);
    res.status(500).json({ success: false, message: 'Failed to assign order', error: error.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/orders  — Create new order with optional auto-assign
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const todayStr = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const serviceName = req.body.serviceName || req.body.title || req.body.name || req.body.productId || 'Home Service';
  const serviceAmount = parseFloat(req.body.serviceAmount || req.body.price || req.body.amount || 0);
  const slotTime = req.body.slotTime || req.body.timeSlot || req.body.time || '10:00 AM - 12:00 PM';
  const serviceDate = req.body.serviceDate || req.body.date || todayStr;
  const city = req.body.city || 'Jaipur';
  const locality = req.body.locality || '';
  const status = req.body.status || 'Pending';
  const address = typeof req.body.address === 'object' ? JSON.stringify(req.body.address) : (req.body.address || '');
  const userPhone = req.body.userPhone || req.body.phone || req.body.mobile || req.body.customerMobile || '';
  const serviceRequestNumber = req.body.serviceRequestNumber || `#REQ ${year}-${Date.now().toString().slice(-6)}`;

  const rawVendorName = req.body.vendorName || req.body.partnerName || '-';
  let dbVendorName = rawVendorName === '-' ? null : rawVendorName;
  let dbVendorMobile = req.body.vendorMobile || req.body.vendorPhone || req.body.partnerPhone || null;
  let assignedStatus = status;

  const orderLat = parseFloat(req.body.latitude || req.body.lat);
  const orderLon = parseFloat(req.body.longitude || req.body.lon || req.body.lng);
  const hasCoordinates = !isNaN(orderLat) && !isNaN(orderLon);

  const cTime = req.body.createdAt || now.toLocaleString('en-US');
  const nowTs = Date.now();

  try {
    if (hasCoordinates && !dbVendorName) {
      const [partners] = await db.query(
        'SELECT id, name, mobile, services, category, latitude, longitude FROM partners WHERE status = 1 AND isApproved = 1 AND isPaid = 1'
      );

      const orderService = serviceName.toLowerCase().trim();
      const eligiblePartners = [];

      for (const partner of partners) {
        const partnerServices = (partner.services || '').toLowerCase().split(',').map(s => s.trim());
        const partnerCategory = (partner.category || '').toLowerCase().trim();
        const isQualified = partnerServices.includes(orderService) ||
                            partnerCategory === orderService ||
                            orderService.includes(partnerCategory) ||
                            partnerCategory.includes(orderService);

        if (isQualified && partner.latitude && partner.longitude) {
          const pLat = parseFloat(partner.latitude);
          const pLon = parseFloat(partner.longitude);
          if (!isNaN(pLat) && !isNaN(pLon)) {
            const distance = getDistance(orderLat, orderLon, pLat, pLon);
            eligiblePartners.push({ partner, distance });
          }
        }
      }

      if (eligiblePartners.length > 0) {
        let matches = eligiblePartners.filter(p => p.distance <= 5);
        if (matches.length === 0) matches = eligiblePartners.filter(p => p.distance <= 10);
        if (matches.length > 0) {
          matches.sort((a, b) => a.distance - b.distance);
          const assigned = matches[0].partner;
          dbVendorName = assigned.name;
          dbVendorMobile = assigned.mobile;
          assignedStatus = 'Assigned';
          console.log(`[Auto-Assign] Order ${serviceRequestNumber} → ${dbVendorName} at ${matches[0].distance.toFixed(2)} km`);
        }
      }
    }

    const [result] = await db.query(
      `INSERT INTO orders 
      (serviceRequestNumber, serviceName, serviceAmount, slotTime, serviceDate, city, locality, status, vendorName, vendorMobile, address, createdAt, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        serviceRequestNumber, serviceName, serviceAmount, slotTime, serviceDate,
        city, locality, assignedStatus, dbVendorName, dbVendorMobile,
        address, cTime,
        hasCoordinates ? orderLat.toString() : null,
        hasCoordinates ? orderLon.toString() : null
      ]
    );

    // Also insert into node_orders_v2 for real-time Flutter User App & Admin Panel synchronization
    await db.query(
      `INSERT INTO node_orders_v2 
      (userPhone, serviceName, price, date, status, bookingStatus, partnerName, partnerPhone, productId, description, timeSlot, address, payment, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userPhone,
        serviceName,
        serviceAmount.toFixed(2),
        serviceDate,
        assignedStatus,
        assignedStatus === 'Assigned' ? 'assigned' : 'searching',
        dbVendorName,
        dbVendorMobile,
        serviceName,
        req.body.description || '',
        slotTime,
        address,
        JSON.stringify({ paymentMethod: req.body.paymentMethod || 'COD', amountPaid: serviceAmount }),
        nowTs
      ]
    ).catch(err => console.warn('Failed to insert into node_orders_v2:', err.message));

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        id: result.insertId,
        serviceRequestNumber, serviceName,
        serviceAmount, slotTime, serviceDate,
        city, locality,
        status: assignedStatus,
        vendorName: dbVendorName || '-',
        vendorMobile: dbVendorMobile,
        address, createdAt: cTime,
        latitude: hasCoordinates ? orderLat.toString() : null,
        longitude: hasCoordinates ? orderLon.toString() : null
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
});

module.exports = router;
