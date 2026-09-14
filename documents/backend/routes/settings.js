const express = require('express');
const router = require('express').Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Jimp } = require('jimp');

// Multer setup for banner image uploads
const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/banners');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, unique);
  }
});

// Only allow image files for banner uploads (videos not supported - use git committed files)
const bannerFileFilter = (req, file, cb) => {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (videoExtensions.includes(ext)) {
    return cb(new Error('Video files cannot be uploaded via admin panel. Please commit video files to git (e.g. save.mp4) and use the filename directly in the DB.'), false);
  }
  cb(null, true);
};

const uploadBanner = multer({ storage: bannerStorage, fileFilter: bannerFileFilter });

async function cropToBannerRatio(filePath) {
  try {
    const image = await Jimp.read(filePath);
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    let targetWidth = width;
    let targetHeight = Math.round(width * 370 / 1000);
    
    if (targetHeight > height) {
      targetHeight = height;
      targetWidth = Math.round(height * 1000 / 370);
    }
    
    const x = Math.round((width - targetWidth) / 2);
    const y = Math.round((height - targetHeight) / 2);
    
    await image.crop({ x, y, w: targetWidth, h: targetHeight });
    await image.write(filePath);
    console.log(`Cropped image to banner aspect ratio (1000:370): ${targetWidth}x${targetHeight}`);
  } catch (err) {
    console.error('Failed to crop image to banner aspect ratio:', err);
  }
}

async function handleBannerUpload(file) {
  if (!file) return;
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v'];
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (videoExtensions.includes(ext)) {
    // Skip Jimp processing for video files
    return;
  }
  try {
    // 1. Crop to banner aspect ratio (1000:370)
    await cropToBannerRatio(file.path);
    
    // 2. Copy to uploads folder
    const destDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const destPath = path.join(destDir, file.filename);
    fs.copyFileSync(file.path, destPath);
    console.log(`Synced cropped banner image to ${destPath}`);

    // Save to Database for persistence
    const { saveFileToDb } = require('../filePersistence');
    // Save both the subpath and the root path copy
    await saveFileToDb('banners/' + file.filename, file.path, file.mimetype || 'image/png');
    await saveFileToDb(file.filename, destPath, file.mimetype || 'image/png');
  } catch (err) {
    console.error('Failed to handle banner upload:', err);
  }
}

// ==========================================
// 1. BANNERS API
// ==========================================

// Helper function to format image URLs consistently as full absolute URLs
function formatImageUrl(img, req) {
  if (!img) return '';
  const host = req.get('host');
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  
  if (img.startsWith('http://') || img.startsWith('https://')) {
    if (img.includes('localhost:') || img.includes('127.0.0.1')) {
      const filename = img.split('/uploads/').pop();
      return `${protocol}://${host}/uploads/${filename}`;
    }
    return img;
  }
  const cleanFilename = img.replace(/^uploads\//, '').replace(/^banners\//, '');
  return `${protocol}://${host}/uploads/${cleanFilename}`;
}

// GET all banners (supports /api/banners, /api/settings/banners, /api/user/banners)
router.get(['/', '/banners'], async (req, res) => {
  try {
    const { title } = req.query;
    let query = 'SELECT * FROM banners';
    const params = [];
    if (title) {
      query += ' WHERE title LIKE ?';
      params.push(`%${title}%`);
    }
    query += ' ORDER BY id DESC';
    const [rows] = await db.query(query, params);

    const formatted = rows.map(r => ({
      ...r,
      image: formatImageUrl(r.image, req),
      status: r.status === 1
    }));

    // Multi-key response to support all Flutter User App response models
    res.json({
      success: true,
      status: true,
      data: formatted,
      banners: formatted,
      result: formatted
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch banners', error: error.message });
  }
});

// POST add banner (multipart + JSON both supported)
router.post('/banners', uploadBanner.single('image'), async (req, res) => {
  const { title, status, category, badge, subtitle, buttonText } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }
  const statusInt = status === true || status === 1 || status === 'true' ? 1 : 0;

  let imageValue = req.body.image || '';
  if (req.file) {
    imageValue = req.file.filename;
    await handleBannerUpload(req.file);
  }

  if (!imageValue) {
    return res.status(400).json({ success: false, message: 'Image is required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO banners (title, image, status, category, badge, subtitle, buttonText) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title.trim(), imageValue, statusInt, category || '', badge || '', subtitle || '', buttonText || 'Book Now']
    );
    res.status(201).json({
      success: true,
      data: { id: result.insertId, title, image: imageValue, status: statusInt === 1, category: category || '', badge: badge || '', subtitle: subtitle || '', buttonText: buttonText || 'Book Now' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create banner', error: error.message });
  }
});

// PUT update banner (multipart + JSON both supported)
router.put('/banners/:id', uploadBanner.single('image'), async (req, res) => {
  const { id } = req.params;
  const { title, status, category, badge, subtitle, buttonText } = req.body;
  try {
    const fields = [];
    const values = [];

    if (title !== undefined && title !== '') { fields.push('`title` = ?'); values.push(title.trim()); }
    if (status !== undefined) { fields.push('`status` = ?'); values.push(status === true || status === 1 || status === 'true' ? 1 : 0); }
    if (category !== undefined) { fields.push('`category` = ?'); values.push(category); }
    if (badge !== undefined) { fields.push('`badge` = ?'); values.push(badge); }
    if (subtitle !== undefined) { fields.push('`subtitle` = ?'); values.push(subtitle); }
    if (buttonText !== undefined) { fields.push('`buttonText` = ?'); values.push(buttonText); }

    if (req.file) {
      fields.push('`image` = ?');
      values.push(req.file.filename);
      await handleBannerUpload(req.file);
    } else if (req.body.image !== undefined && req.body.image !== '') {
      fields.push('`image` = ?');
      values.push(req.body.image);
    }

    if (fields.length === 0) {
      const [rows] = await db.query('SELECT * FROM banners WHERE id = ?', [id]);
      return res.json({ success: true, data: { ...rows[0], status: rows[0].status === 1 } });
    }

    values.push(id);
    const [result] = await db.query(`UPDATE banners SET ${fields.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Banner not found' });

    const [rows] = await db.query('SELECT * FROM banners WHERE id = ?', [id]);
    res.json({ success: true, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update banner', error: error.message });
  }
});

// PATCH partial update / status toggle banner
router.patch('/banners/:id', async (req, res) => {
  const { id } = req.params;
  const { title, status, category, badge, subtitle, buttonText } = req.body;
  try {
    const fields = [];
    const values = [];

    if (title !== undefined && title !== '') { fields.push('`title` = ?'); values.push(title.trim()); }
    if (status !== undefined) { fields.push('`status` = ?'); values.push(status === true || status === 1 || status === 'true' ? 1 : 0); }
    if (category !== undefined) { fields.push('`category` = ?'); values.push(category); }
    if (badge !== undefined) { fields.push('`badge` = ?'); values.push(badge); }
    if (subtitle !== undefined) { fields.push('`subtitle` = ?'); values.push(subtitle); }
    if (buttonText !== undefined) { fields.push('`buttonText` = ?'); values.push(buttonText); }

    if (fields.length === 0) {
      const [rows] = await db.query('SELECT * FROM banners WHERE id = ?', [id]);
      return res.json({ success: true, data: { ...rows[0], status: rows[0].status === 1 } });
    }

    values.push(id);
    const [result] = await db.query(`UPDATE banners SET ${fields.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Banner not found' });

    const [rows] = await db.query('SELECT * FROM banners WHERE id = ?', [id]);
    res.json({ success: true, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update banner', error: error.message });
  }
});

// DELETE banner
router.delete('/banners/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM banners WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete banner', error: error.message });
  }
});


// ==========================================
// 2. STATES API
// ==========================================

// GET all states (with search)
router.get('/states', async (req, res) => {
  try {
    const { name } = req.query;
    let query = 'SELECT * FROM states';
    const params = [];
    if (name) {
      query += ' WHERE name LIKE ?';
      params.push(`%${name}%`);
    }
    query += ' ORDER BY name ASC';
    const [rows] = await db.query(query, params);
    res.json({
      success: true,
      data: rows.map(r => ({ ...r, status: r.status === 1 }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch states', error: error.message });
  }
});

// POST add state
router.post('/states', async (req, res) => {
  const { name, status } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'State name is required' });
  const statusInt = status === true || status === 1 || status === 'true' ? 1 : 0;
  try {
    const [result] = await db.query('INSERT INTO states (name, status) VALUES (?, ?)', [name, statusInt]);
    res.status(201).json({
      success: true,
      data: { id: result.insertId, name, status: statusInt === 1 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create state', error: error.message });
  }
});

// PUT update state
router.put('/states/:id', async (req, res) => {
  const { id } = req.params;
  const { name, status } = req.body;
  try {
    const fields = [];
    const values = [];
    if (name !== undefined) { fields.push('`name` = ?'); values.push(name); }
    if (status !== undefined) { fields.push('`status` = ?'); values.push(status === true || status === 1 || status === 'true' ? 1 : 0); }
    
    if (fields.length === 0) {
      const [rows] = await db.query('SELECT * FROM states WHERE id = ?', [id]);
      return res.json({ success: true, data: { ...rows[0], status: rows[0].status === 1 } });
    }
    values.push(id);
    
    const [result] = await db.query(`UPDATE states SET ${fields.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'State not found' });
    
    const [rows] = await db.query('SELECT * FROM states WHERE id = ?', [id]);
    res.json({ success: true, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update state', error: error.message });
  }
});

// DELETE state
router.delete('/states/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch state name to perform programmatic cascade delete of cities and localities
    const [rows] = await db.query('SELECT name FROM states WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'State not found' });
    const stateName = rows[0].name;

    // Delete all localities in this state
    await db.query('DELETE FROM localities WHERE stateName = ?', [stateName]);

    // Delete all cities in this state
    await db.query('DELETE FROM cities WHERE stateName = ?', [stateName]);

    // Delete state record
    await db.query('DELETE FROM states WHERE id = ?', [id]);

    res.json({ success: true, message: 'State and its cities and localities deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete state', error: error.message });
  }
});


// ==========================================
// 3. CITIES API
// ==========================================

// GET all cities (with search)
router.get('/cities', async (req, res) => {
  try {
    const { cityName, stateName } = req.query;
    let query = 'SELECT * FROM cities WHERE 1=1';
    const params = [];
    if (cityName) {
      query += ' AND cityName LIKE ?';
      params.push(`%${cityName}%`);
    }
    if (stateName) {
      query += ' AND stateName LIKE ?';
      params.push(`%${stateName}%`);
    }
    query += ' ORDER BY cityName ASC';
    const [rows] = await db.query(query, params);
    res.json({
      success: true,
      data: rows.map(r => ({ ...r, status: r.status === 1 }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch cities', error: error.message });
  }
});

// POST add city
router.post('/cities', async (req, res) => {
  const { cityName, stateName, status } = req.body;
  if (!cityName || !stateName) return res.status(400).json({ success: false, message: 'City name and State name are required' });
  const statusInt = status === true || status === 1 || status === 'true' ? 1 : 0;
  try {
    const [result] = await db.query(
      'INSERT INTO cities (cityName, stateName, status) VALUES (?, ?, ?)',
      [cityName, stateName, statusInt]
    );
    res.status(201).json({
      success: true,
      data: { id: result.insertId, cityName, stateName, status: statusInt === 1 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create city', error: error.message });
  }
});

// PUT update city
router.put('/cities/:id', async (req, res) => {
  const { id } = req.params;
  const { cityName, stateName, status } = req.body;
  try {
    const fields = [];
    const values = [];
    if (cityName !== undefined) { fields.push('`cityName` = ?'); values.push(cityName); }
    if (stateName !== undefined) { fields.push('`stateName` = ?'); values.push(stateName); }
    if (status !== undefined) { fields.push('`status` = ?'); values.push(status === true || status === 1 || status === 'true' ? 1 : 0); }
    
    if (fields.length === 0) {
      const [rows] = await db.query('SELECT * FROM cities WHERE id = ?', [id]);
      return res.json({ success: true, data: { ...rows[0], status: rows[0].status === 1 } });
    }
    values.push(id);
    
    const [result] = await db.query(`UPDATE cities SET ${fields.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'City not found' });
    
    const [rows] = await db.query('SELECT * FROM cities WHERE id = ?', [id]);
    res.json({ success: true, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update city', error: error.message });
  }
});

// DELETE city
router.delete('/cities/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch city name to perform programmatic cascade delete of localities
    const [rows] = await db.query('SELECT cityName FROM cities WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'City not found' });
    const cityName = rows[0].cityName;

    // Delete all localities in this city
    await db.query('DELETE FROM localities WHERE cityName = ?', [cityName]);

    // Delete city record
    await db.query('DELETE FROM cities WHERE id = ?', [id]);

    res.json({ success: true, message: 'City and its localities deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete city', error: error.message });
  }
});


// ==========================================
// 4. LOCALITIES API
// ==========================================

// GET all localities (with search)
router.get('/localities', async (req, res) => {
  try {
    const { localityName, cityName, stateName } = req.query;
    let query = 'SELECT * FROM localities WHERE 1=1';
    const params = [];
    if (localityName) {
      query += ' AND localityName LIKE ?';
      params.push(`%${localityName}%`);
    }
    if (cityName) {
      query += ' AND cityName LIKE ?';
      params.push(`%${cityName}%`);
    }
    if (stateName) {
      query += ' AND stateName LIKE ?';
      params.push(`%${stateName}%`);
    }
    query += ' ORDER BY localityName ASC';
    const [rows] = await db.query(query, params);
    res.json({
      success: true,
      data: rows.map(r => ({ ...r, status: r.status === 1 }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch localities', error: error.message });
  }
});

// POST add locality
router.post('/localities', async (req, res) => {
  const { localityName, cityName, stateName, status } = req.body;
  if (!localityName || !cityName || !stateName) {
    return res.status(400).json({ success: false, message: 'Locality name, City name, and State name are required' });
  }
  const statusInt = status === true || status === 1 || status === 'true' ? 1 : 0;
  try {
    const [result] = await db.query(
      'INSERT INTO localities (localityName, cityName, stateName, status) VALUES (?, ?, ?, ?)',
      [localityName, cityName, stateName, statusInt]
    );
    res.status(201).json({
      success: true,
      data: { id: result.insertId, localityName, cityName, stateName, status: statusInt === 1 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create locality', error: error.message });
  }
});

// PUT update locality
router.put('/localities/:id', async (req, res) => {
  const { id } = req.params;
  const { localityName, cityName, stateName, status } = req.body;
  try {
    const fields = [];
    const values = [];
    if (localityName !== undefined) { fields.push('`localityName` = ?'); values.push(localityName); }
    if (cityName !== undefined) { fields.push('`cityName` = ?'); values.push(cityName); }
    if (stateName !== undefined) { fields.push('`stateName` = ?'); values.push(stateName); }
    if (status !== undefined) { fields.push('`status` = ?'); values.push(status === true || status === 1 || status === 'true' ? 1 : 0); }
    
    if (fields.length === 0) {
      const [rows] = await db.query('SELECT * FROM localities WHERE id = ?', [id]);
      return res.json({ success: true, data: { ...rows[0], status: rows[0].status === 1 } });
    }
    values.push(id);
    
    const [result] = await db.query(`UPDATE localities SET ${fields.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Locality not found' });
    
    const [rows] = await db.query('SELECT * FROM localities WHERE id = ?', [id]);
    res.json({ success: true, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update locality', error: error.message });
  }
});

// DELETE locality
router.delete('/localities/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM localities WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Locality not found' });
    res.json({ success: true, message: 'Locality deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete locality', error: error.message });
  }
});


// ==========================================
// 5. REVIEWS API
// ==========================================

// GET all reviews
router.get('/reviews', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM reviews ORDER BY id DESC');
    res.json({
      success: true,
      data: rows.map(r => ({
        ...r,
        rating: parseFloat(r.rating),
        status: r.status === 1
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
  }
});

// POST add review
router.post('/reviews', async (req, res) => {
  const { userName, partnerName, serviceName, rating, reviewText, status } = req.body;
  if (!userName || !partnerName || !serviceName || rating === undefined) {
    return res.status(400).json({ success: false, message: 'User, Partner, Service, and Rating are required' });
  }
  const statusInt = status === true || status === 1 || status === 'true' ? 1 : 0;
  const ratVal = parseFloat(rating);
  const textVal = reviewText || '';

  try {
    const [result] = await db.query(
      'INSERT INTO reviews (userName, partnerName, serviceName, rating, reviewText, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userName, partnerName, serviceName, ratVal, textVal, statusInt]
    );
    res.status(201).json({
      success: true,
      data: { id: result.insertId, userName, partnerName, serviceName, rating: ratVal, reviewText: textVal, status: statusInt === 1 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create review', error: error.message });
  }
});

// PUT update review
router.put('/reviews/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ success: false, message: 'Status is required' });
  
  const statusInt = status === true || status === 1 || status === 'true' ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE reviews SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Review not found' });
    
    const [rows] = await db.query('SELECT * FROM reviews WHERE id = ?', [id]);
    res.json({ success: true, data: { ...rows[0], rating: parseFloat(rows[0].rating), status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update review', error: error.message });
  }
});

// DELETE review
router.delete('/reviews/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM reviews WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete review', error: error.message });
  }
});


// ==========================================
// 6. NOTIFICATIONS API
// ==========================================

// GET all notifications (with search)
router.get('/notifications', async (req, res) => {
  try {
    const { title, audience, status } = req.query;
    let query = 'SELECT * FROM notifications WHERE 1=1';
    const params = [];
    if (title) {
      query += ' AND title LIKE ?';
      params.push(`%${title}%`);
    }
    if (audience) {
      query += ' AND audience LIKE ?';
      params.push(`%${audience}%`);
    }
    if (status !== undefined) {
      const statusInt = status === 'true' || status === '1' ? 1 : 0;
      query += ' AND status = ?';
      params.push(statusInt);
    }
    query += ' ORDER BY id DESC';
    const [rows] = await db.query(query, params);
    res.json({
      success: true,
      data: rows.map(r => ({
        ...r,
        status: r.status === 1,
        isSent: r.isSent === 1
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
  }
});

// POST add notification
router.post('/notifications', async (req, res) => {
  const { title, message, audience, status } = req.body;
  if (!title || !message || !audience) {
    return res.status(400).json({ success: false, message: 'Title, Message, and Audience are required' });
  }
  const statusInt = status === true || status === 1 || status === 'true' ? 1 : 0;
  const createdAtStr = new Date().toLocaleString('en-IN');
  try {
    const [result] = await db.query(
      'INSERT INTO notifications (title, message, audience, createdAt, status, isSent, sentAt) VALUES (?, ?, ?, ?, ?, 0, "")',
      [title, message, audience, createdAtStr, statusInt]
    );
    res.status(201).json({
      success: true,
      data: { id: result.insertId, title, message, audience, createdAt: createdAtStr, status: statusInt === 1, isSent: false, sentAt: '' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create notification', error: error.message });
  }
});

// PUT update notification (e.g. toggle status, or send notification)
router.put('/notifications/:id', async (req, res) => {
  const { id } = req.params;
  const { status, isSent } = req.body;
  try {
    const fields = [];
    const values = [];
    if (status !== undefined) {
      fields.push('`status` = ?');
      values.push(status === true || status === 1 || status === 'true' ? 1 : 0);
    }
    if (isSent !== undefined) {
      fields.push('`isSent` = ?');
      values.push(isSent === true || isSent === 1 || isSent === 'true' ? 1 : 0);
      if (isSent === true || isSent === 1 || isSent === 'true') {
        fields.push('`sentAt` = ?');
        values.push(new Date().toLocaleString('en-IN'));
      }
    }
    
    if (fields.length === 0) {
      const [rows] = await db.query('SELECT * FROM notifications WHERE id = ?', [id]);
      return res.json({
        success: true,
        data: {
          ...rows[0],
          status: rows[0].status === 1,
          isSent: rows[0].isSent === 1
        }
      });
    }
    values.push(id);
    
    const [result] = await db.query(`UPDATE notifications SET ${fields.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Notification not found' });
    
    const [rows] = await db.query('SELECT * FROM notifications WHERE id = ?', [id]);
    res.json({
      success: true,
      data: {
        ...rows[0],
        status: rows[0].status === 1,
        isSent: rows[0].isSent === 1
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notification', error: error.message });
  }
});

// DELETE notification
router.delete('/notifications/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM notifications WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete notification', error: error.message });
  }
});


// ==========================================
// 7. COMMISSION SETTINGS API
// ==========================================

// GET commission settings
router.get('/commission', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM settings_config WHERE `key` = 'commission_rate'");
    const rate = rows.length > 0 ? parseFloat(rows[0].value) : 25.0;
    res.json({
      success: true,
      commissionRate: rate
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch commission setting', error: error.message });
  }
});

// PUT update commission settings
router.put('/commission', async (req, res) => {
  const { commissionRate } = req.body;
  if (commissionRate === undefined) {
    return res.status(400).json({ success: false, message: 'commissionRate is required' });
  }
  const rateVal = parseFloat(commissionRate);
  try {
    await db.query(
      "INSERT INTO settings_config (`key`, `value`) VALUES ('commission_rate', ?) ON DUPLICATE KEY UPDATE `value` = ?",
      [String(rateVal), String(rateVal)]
    );
    res.json({
      success: true,
      message: 'Commission rate updated successfully',
      commissionRate: rateVal
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update commission setting', error: error.message });
  }
});

// ==========================================
// 8. COUNTRIES LIST API
// ==========================================

// GET all countries (with optional name/code search)
router.get('/countries', (req, res) => {
  try {
    const countries = require('../defaults/countries.json');
    const { name, code } = req.query;
    
    let filtered = countries;
    
    if (name) {
      const q = name.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(q));
    }
    
    if (code) {
      const q = code.toUpperCase();
      filtered = filtered.filter(c => c.code === q);
    }

    const dialCodes = {
      "AF": "+93", "AX": "+358", "AL": "+355", "DZ": "+213", "AS": "+1-684", "AD": "+376", "AO": "+244", "AI": "+1-264", "AQ": "+672", "AG": "+1-268", "AR": "+54", "AM": "+374", "AW": "+297", "AU": "+61", "AT": "+43", "AZ": "+994", "BS": "+1-242", "BH": "+973", "BD": "+880", "BB": "+1-246", "BY": "+375", "BE": "+32", "BZ": "+501", "BJ": "+229", "BM": "+1-441", "BT": "+975", "BO": "+591", "BQ": "+599", "BA": "+387", "BW": "+267", "BV": "+47", "BR": "+55", "IO": "+246", "BN": "+673", "BG": "+359", "BF": "+226", "BI": "+257", "KH": "+855", "CM": "+237", "CA": "+1", "CV": "+238", "KY": "+1-345", "CF": "+236", "TD": "+235", "CL": "+56", "CN": "+86", "CX": "+61", "CC": "+61", "CO": "+57", "KM": "+269", "CG": "+242", "CD": "+243", "CK": "+682", "CR": "+506", "CI": "+225", "HR": "+385", "CU": "+53", "CW": "+599", "CY": "+357", "CZ": "+420", "DK": "+45", "DJ": "+253", "DM": "+1-767", "DO": "+1-809", "EC": "+593", "EG": "+20", "SV": "+503", "GQ": "+240", "ER": "+291", "EE": "+372", "ET": "+251", "FK": "+500", "FO": "+298", "FJ": "+679", "FI": "+358", "FR": "+33", "GF": "+594", "PF": "+689", "TF": "+262", "GA": "+241", "GM": "+220", "GE": "+995", "DE": "+49", "GH": "+233", "GI": "+350", "GR": "+30", "GL": "+299", "GD": "+1-473", "GP": "+590", "GU": "+1-671", "GT": "+502", "GG": "+44", "GN": "+224", "GW": "+245", "GY": "+592", "HT": "+509", "HM": "+672", "VA": "+379", "HN": "+504", "HK": "+852", "HU": "+36", "IS": "+354", "IN": "+91", "ID": "+62", "IR": "+98", "IQ": "+964", "IE": "+353", "IM": "+44", "IL": "+972", "IT": "+39", "JM": "+1-876", "JP": "+81", "JE": "+44", "JO": "+962", "KZ": "+7", "KE": "+254", "KI": "+686", "KP": "+850", "KR": "+82", "KW": "+965", "KG": "+996", "LA": "+856", "LV": "+371", "LB": "+961", "LS": "+266", "LR": "+231", "LY": "+218", "LI": "+423", "LT": "+370", "LU": "+352", "MO": "+853", "MK": "+389", "MG": "+261", "MW": "+265", "MY": "+60", "MV": "+960", "ML": "+223", "MT": "+356", "MH": "+692", "MQ": "+596", "MR": "+222", "MU": "+230", "YT": "+262", "MX": "+52", "FM": "+691", "MD": "+373", "MC": "+377", "MN": "+976", "ME": "+382", "MS": "+1-664", "MA": "+212", "MZ": "+258", "MM": "+95", "NA": "+264", "NR": "+674", "NP": "+977", "NL": "+31", "NC": "+687", "NZ": "+64", "NI": "+505", "NE": "+227", "NG": "+234", "NU": "+683", "NF": "+672", "MP": "+1-670", "NO": "+47", "OM": "+968", "PK": "+92", "PW": "+680", "PS": "+970", "PA": "+507", "PG": "+675", "PY": "+595", "PE": "+51", "PH": "+63", "PN": "+870", "PL": "+48", "PT": "+351", "PR": "+1-787", "QA": "+974", "RE": "+262", "RO": "+40", "RU": "+7", "RW": "+250", "BL": "+590", "SH": "+290", "KN": "+1-869", "LC": "+1-758", "MF": "+590", "PM": "+508", "VC": "+1-784", "WS": "+685", "SM": "+378", "ST": "+239", "SA": "+966", "SN": "+221", "RS": "+381", "SC": "+248", "SL": "+232", "SG": "+65", "SX": "+1-721", "SK": "+421", "SI": "+386", "SB": "+677", "SO": "+252", "ZA": "+27", "GS": "+500", "SS": "+211", "ES": "+34", "LK": "+94", "SD": "+249", "SR": "+597", "SJ": "+47", "SZ": "+268", "SE": "+46", "CH": "+41", "SY": "+963", "TW": "+886", "TJ": "+992", "TZ": "+255", "TH": "+66", "TL": "+670", "TG": "+228", "TK": "+690", "TO": "+676", "TT": "+1-868", "TN": "+216", "TR": "+90", "TM": "+993", "TC": "+1-649", "TV": "+688", "UG": "+256", "UA": "+380", "GB": "+44", "US": "+1", "UM": "+1", "UY": "+598", "UZ": "+998", "VU": "+678", "VE": "+58", "VN": "+84", "VG": "+1-284", "VI": "+1-340", "WF": "+681", "EH": "+212", "YE": "+967", "ZM": "+260", "ZW": "+263",
      "AC": "+247", "AE": "+971", "CP": "+262", "DG": "+246", "EA": "+34", "EU": "+3", "IC": "+34", "TA": "+290", "UN": "+1", "XK": "+383", "ENGLAND": "+44", "SCOTLAND": "+44", "WALES": "+44"
    };

    const formatted = filtered.map(c => ({
      name: c.name,
      code: c.code,
      dialCode: dialCodes[c.code] || "",
      emoji: c.emoji,
      image: c.image
    }));
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch countries', error: error.message });
  }
});


// GET country codes of all registered users and partners
router.get('/country-codes', async (req, res) => {
  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    const list = [];

    // 1. Fetch from node_users_v2 (Flutter application users)
    const [nodeV2Rows] = await db.query("SELECT name, phone as mobile, countryCode FROM node_users_v2");
    nodeV2Rows.forEach(r => {
      const code = r.countryCode ? (r.countryCode.startsWith('+') ? r.countryCode : `+${r.countryCode}`) : '+91';
      list.push({
        name: r.name || 'Guest User',
        mobile: r.mobile || '',
        role: 'user',
        countryCode: code,
        source: 'User App (MySQL v2)'
      });
    });

    // 2. Fetch from node_users (Admin users)
    const [nodeRows] = await db.query("SELECT name, mobile FROM users");
    nodeRows.forEach(r => {
      list.push({
        name: r.name || '',
        mobile: r.mobile || '',
        role: 'user',
        countryCode: '+91',
        source: 'Admin User (MySQL)'
      });
    });

    // 3. Fetch from original Laravel users
    const [laravelRows] = await db.query(`SELECT name, mobile_number as mobile, role_id FROM \`${dbName}\`.\`users\` WHERE deleted_at IS NULL`);
    laravelRows.forEach(r => {
      list.push({
        name: r.name || '',
        mobile: r.mobile || '',
        role: r.role_id === 2 ? 'partner' : 'user',
        countryCode: '+91',
        source: r.role_id === 2 ? 'App Partner (Laravel)' : 'App User (Laravel)'
      });
    });

    // 4. Fetch from node_partners (Admin Partner)
    const [nodePartnerRows] = await db.query("SELECT name, mobile, countryCode FROM partners");
    nodePartnerRows.forEach(r => {
      const code = r.countryCode ? (r.countryCode.startsWith('+') ? r.countryCode : `+${r.countryCode}`) : '+91';
      list.push({
        name: r.name || '',
        mobile: r.mobile || '',
        role: 'partner',
        countryCode: code,
        source: 'Admin Partner (MySQL)'
      });
    });

    res.json({
      success: true,
      data: list
    });
  } catch (error) {
    console.error('Error fetching country codes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch country codes', error: error.message });
  }
});


// ==========================================
// STATUS TOGGLE APIS
// ==========================================

// BANNERS - PUT/PATCH toggle status
router.put('/banners/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ success: false, message: 'Status is required' });
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE banners SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Banner not found' });
    const [rows] = await db.query('SELECT * FROM banners WHERE id = ?', [id]);
    res.json({ success: true, message: `Banner status updated to ${statusInt === 1 ? 'active' : 'inactive'}`, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update banner status', error: error.message });
  }
});
router.patch('/banners/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ success: false, message: 'Status is required' });
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE banners SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Banner not found' });
    const [rows] = await db.query('SELECT * FROM banners WHERE id = ?', [id]);
    res.json({ success: true, message: `Banner status updated to ${statusInt === 1 ? 'active' : 'inactive'}`, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update banner status', error: error.message });
  }
});

// STATES - PUT/PATCH toggle status
router.put('/states/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ success: false, message: 'Status is required' });
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE states SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'State not found' });
    const [rows] = await db.query('SELECT * FROM states WHERE id = ?', [id]);
    res.json({ success: true, message: `State status updated to ${statusInt === 1 ? 'active' : 'inactive'}`, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update state status', error: error.message });
  }
});
router.patch('/states/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ success: false, message: 'Status is required' });
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE states SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'State not found' });
    const [rows] = await db.query('SELECT * FROM states WHERE id = ?', [id]);
    res.json({ success: true, message: `State status updated to ${statusInt === 1 ? 'active' : 'inactive'}`, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update state status', error: error.message });
  }
});

// CITIES - PUT/PATCH toggle status
router.put('/cities/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ success: false, message: 'Status is required' });
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE cities SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'City not found' });
    const [rows] = await db.query('SELECT * FROM cities WHERE id = ?', [id]);
    res.json({ success: true, message: `City status updated to ${statusInt === 1 ? 'active' : 'inactive'}`, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update city status', error: error.message });
  }
});
router.patch('/cities/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ success: false, message: 'Status is required' });
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE cities SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'City not found' });
    const [rows] = await db.query('SELECT * FROM cities WHERE id = ?', [id]);
    res.json({ success: true, message: `City status updated to ${statusInt === 1 ? 'active' : 'inactive'}`, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update city status', error: error.message });
  }
});

// LOCALITIES - PUT/PATCH toggle status
router.put('/localities/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ success: false, message: 'Status is required' });
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE localities SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Locality not found' });
    const [rows] = await db.query('SELECT * FROM localities WHERE id = ?', [id]);
    res.json({ success: true, message: `Locality status updated to ${statusInt === 1 ? 'active' : 'inactive'}`, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update locality status', error: error.message });
  }
});
router.patch('/localities/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ success: false, message: 'Status is required' });
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE localities SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Locality not found' });
    const [rows] = await db.query('SELECT * FROM localities WHERE id = ?', [id]);
    res.json({ success: true, message: `Locality status updated to ${statusInt === 1 ? 'active' : 'inactive'}`, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update locality status', error: error.message });
  }
});

// REVIEWS - PUT/PATCH toggle status
router.put('/reviews/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ success: false, message: 'Status is required' });
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE reviews SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Review not found' });
    const [rows] = await db.query('SELECT * FROM reviews WHERE id = ?', [id]);
    res.json({ success: true, message: `Review status updated to ${statusInt === 1 ? 'active' : 'inactive'}`, data: { ...rows[0], rating: parseFloat(rows[0].rating), status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update review status', error: error.message });
  }
});
router.patch('/reviews/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ success: false, message: 'Status is required' });
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE reviews SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Review not found' });
    const [rows] = await db.query('SELECT * FROM reviews WHERE id = ?', [id]);
    res.json({ success: true, message: `Review status updated to ${statusInt === 1 ? 'active' : 'inactive'}`, data: { ...rows[0], rating: parseFloat(rows[0].rating), status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update review status', error: error.message });
  }
});


module.exports = router;
