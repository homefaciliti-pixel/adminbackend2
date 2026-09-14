const express = require('express');
const router = express.Router();
const db = require('../db');

function resolveDocUrl(url, req, type = 'document') {
  const currentBase = `${req.protocol}://${req.get('host')}`;
  if (!url || url.trim() === '') {
    return `${currentBase}/uploads/default-${type}.png`;
  }
  if (url.includes('cloudinary.com')) {
    return url;
  }
  try {
    if (url.startsWith('http')) {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith('/uploads/')) {
        return `${currentBase}${parsed.pathname}`;
      }
      return url;
    }
  } catch (e) {
    // Fallback if URL parsing fails
  }
  return url;
}

// Find partner by mobile number in both node_partners and Laravel users
async function findPartnerByMobile(mobile) {
  if (!mobile) return null;
  const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
  
  // 1. Try to fetch from node_partners
  const [nodeRows] = await db.query('SELECT * FROM partners WHERE mobile = ? LIMIT 1', [mobile]);
  if (nodeRows.length > 0) {
    return { ...nodeRows[0], source: 'Admin Partner (MySQL)' };
  }
  
  // 2. Try to fetch from Laravel users (role_id = 2)
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
    WHERE u.role_id = 2 AND u.mobile_number = ? LIMIT 1
  `, [mobile]);

  if (laravelRows.length > 0) {
    const r = laravelRows[0];
    return {
      ...r,
      id: r.id + 10000000,
      policeVerificationImage: '',
      aadhaarImage: r.aadharFront || '',
      panImage: r.panImage || '',
      password: '',
      aadharFront: r.aadharFront || '',
      aadharBack: r.aadharBack || '',
      hasVehicle: (r.hasVehicle === 1 || r.hasVehicle === '1') ? 'Yes' : 'No',
      isPaid: (r.isPaid === 1 || r.isPaid === '1') ? 1 : 0,
      createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '',
      documents: [r.aadharFront, r.aadharBack, r.panImage].filter(Boolean).join(','),
      source: 'App Partner (Laravel)'
    };
  }
  
  return null;
}

// Map partner details with resolved fallback images/documents
function mapPartnerDetails(partner, req) {
  if (!partner) return null;
  const resolvedAadharFront = resolveDocUrl(partner.aadharFront || partner.aadhaarImage, req, 'document');
  const resolvedAadharBack = resolveDocUrl(partner.aadharBack, req, 'document');
  const resolvedPanImage = resolveDocUrl(partner.panImage, req, 'document');
  const resolvedPoliceImage = resolveDocUrl(partner.policeVerificationImage, req, 'document');
  const resolvedImage = resolveDocUrl(partner.image, req, 'profile');
  
  const documentsArray = [resolvedAadharFront, resolvedAadharBack, resolvedPanImage, resolvedPoliceImage].filter(Boolean);

  return {
    id: partner.id,
    name: partner.name,
    email: partner.email,
    mobile: partner.mobile,
    image: resolvedImage,
    documents: documentsArray,
    aadharFront: resolvedAadharFront,
    aadharBack: resolvedAadharBack,
    panImage: resolvedPanImage,
    policeVerificationImage: resolvedPoliceImage,
    source: partner.source
  };
}

// GET all support tickets (with optional search)
router.get('/', async (req, res) => {
  try {
    const { query: searchQuery, status } = req.query;
    let sqlStr = 'SELECT * FROM support_tickets WHERE 1=1';
    const params = [];

    if (searchQuery) {
      sqlStr += ' AND (userName LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)';
      params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
    }
    if (status) {
      sqlStr += ' AND status = ?';
      params.push(status);
    }

    sqlStr += ' ORDER BY id DESC';
        const [rows] = await db.query(sqlStr, params);

    const mappedTickets = await Promise.all(rows.map(async (ticket) => {
      const partner = await findPartnerByMobile(ticket.mobile);
      const mappedPartner = mapPartnerDetails(partner, req);
      return {
        ...ticket,
        partnerId: ticket.partnerId || (mappedPartner ? mappedPartner.id : null),
        partnerImage: mappedPartner ? mappedPartner.image : resolveDocUrl('', req, 'profile'),
        partnerDocuments: mappedPartner ? mappedPartner.documents : [],
        partner: mappedPartner
      };
    }));

    res.json({
      success: true,
      data: mappedTickets
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch support tickets', error: error.message });
  }
});

// GET single support ticket details
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM support_tickets WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
        const ticket = rows[0];
    const partner = await findPartnerByMobile(ticket.mobile);
    const mappedPartner = mapPartnerDetails(partner, req);
    res.json({
      success: true,
      data: {
        ...ticket,
        partnerId: ticket.partnerId || (mappedPartner ? mappedPartner.id : null),
        partnerImage: mappedPartner ? mappedPartner.image : resolveDocUrl('', req, 'profile'),
        partnerDocuments: mappedPartner ? mappedPartner.documents : [],
        partner: mappedPartner
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch ticket details', error: error.message });
  }
});

// POST add support ticket
router.post('/', async (req, res) => {
  const { userName, email, mobile, subject, message, partnerId } = req.body;
  if (!userName || !email || !mobile || !subject || !message) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }

  const partner = await findPartnerByMobile(mobile);
  const mappedPartner = mapPartnerDetails(partner, req);
  const resolvedPartnerId = partnerId || (mappedPartner ? mappedPartner.id : null);

  const createdAtStr = new Date().toLocaleDateString('en-IN');
  try {
    const [result] = await db.query(
      'INSERT INTO support_tickets (userName, email, mobile, subject, message, status, createdAt, partnerId) VALUES (?, ?, ?, ?, ?, "Open", ?, ?)',
      [userName, email, mobile, subject, message, createdAtStr, resolvedPartnerId]
    );

    res.status(201).json({
      success: true,
      message: 'Support ticket logged successfully',
      data: {
        id: result.insertId,
        userName,
        email,
        mobile,
        subject,
        message,
        status: 'Open',
        createdAt: createdAtStr,
        partnerId: resolvedPartnerId,
        partnerImage: mappedPartner ? mappedPartner.image : resolveDocUrl('', req, 'profile'),
        partnerDocuments: mappedPartner ? mappedPartner.documents : [],
        partner: mappedPartner
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create support ticket', error: error.message });
  }
});

// PUT update support ticket details (e.g. update status/resolve)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { userName, email, mobile, subject, message, status, partnerId } = req.body;

  try {
    const fields = [];
    const values = [];

    if (userName !== undefined) { fields.push('`userName` = ?'); values.push(userName); }
    if (email !== undefined) { fields.push('`email` = ?'); values.push(email); }
    if (mobile !== undefined) { fields.push('`mobile` = ?'); values.push(mobile); }
    if (subject !== undefined) { fields.push('`subject` = ?'); values.push(subject); }
    if (message !== undefined) { fields.push('`message` = ?'); values.push(message); }
    if (status !== undefined) { fields.push('`status` = ?'); values.push(status); }
    if (partnerId !== undefined) { fields.push('`partnerId` = ?'); values.push(partnerId); }

    if (fields.length === 0) {
      const [rows] = await db.query('SELECT * FROM support_tickets WHERE id = ?', [id]);
      const ticket = rows[0];
      const partner = await findPartnerByMobile(ticket.mobile);
      const mappedPartner = mapPartnerDetails(partner, req);
      return res.json({
        success: true,
        message: 'Update successful (no changes made)',
        data: {
          ...ticket,
          partnerDocuments: mappedPartner ? mappedPartner.documents : '',
          partnerDetails: mappedPartner
        }
      });
    }

    values.push(id);
    const query = `UPDATE support_tickets SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const [rows] = await db.query('SELECT * FROM support_tickets WHERE id = ?', [id]);
    const ticket = rows[0];
    const partner = await findPartnerByMobile(ticket.mobile);
    const mappedPartner = mapPartnerDetails(partner, req);

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: {
        ...ticket,
        partnerId: ticket.partnerId || (mappedPartner ? mappedPartner.id : null),
        partnerImage: mappedPartner ? mappedPartner.image : resolveDocUrl('', req, 'profile'),
        partnerDocuments: mappedPartner ? mappedPartner.documents : [],
        partner: mappedPartner
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update ticket', error: error.message });
  }
});

// DELETE support ticket
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM support_tickets WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    res.json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete ticket', error: error.message });
  }
});

module.exports = router;
