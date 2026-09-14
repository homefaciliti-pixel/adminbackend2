const express = require('express');
const router = express.Router();
const db = require('../db');

function formatImageUrl(img, req) {
  if (!img) return '';
  const host = req.get('host');
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  
  if (img.includes('/uploads/')) {
    const filename = img.split('/uploads/').pop();
    return `${protocol}://${host}/uploads/${filename}`;
  }

  if (img.startsWith('http://') || img.startsWith('https://')) {
    return img;
  }
  const cleanFilename = img.replace(/^uploads\//, '').replace(/^categories\//, '');
  return `${protocol}://${host}/uploads/${cleanFilename}`;
}

// GET all categories (with optional search/filtering)
router.get('/', async (req, res) => {
  try {
    const { title, categoryName, parent, mainCategory, status, emailStatus } = req.query;
    let query = 'SELECT * FROM categories WHERE 1=1';
    const params = [];

    const searchTitle = title || categoryName;
    if (searchTitle) {
      query += ' AND title LIKE ?';
      params.push(`%${searchTitle}%`);
    }

    const searchParent = parent || mainCategory;
    if (searchParent) {
      query += ' AND parent LIKE ?';
      params.push(`%${searchParent}%`);
    }

    const searchStatus = status !== undefined ? status : emailStatus;
    if (searchStatus !== undefined) {
      const statusInt = searchStatus === 'true' || searchStatus === '1' ? 1 : 0;
      query += ' AND status = ?';
      params.push(statusInt);
    }

    query += ' ORDER BY id DESC';
    const [rows] = await db.query(query, params);
    const mapped = rows.map(r => ({
      ...r,
      id: r.id,
      image: formatImageUrl(r.image, req),
      parent: r.parent === null ? 'None' : r.parent,
      status: r.status === 1
    }));
    res.json({
      success: true,
      data: mapped,
      categories: mapped,
      result: mapped
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message });
  }
});

// GET /search - search categories
router.get('/search', async (req, res) => {
  const q = req.query.q || req.query.query || '';
  try {
    let rows;
    if (q.trim() === '') {
      [rows] = await db.query('SELECT * FROM categories ORDER BY id DESC');
    } else {
      [rows] = await db.query(
        'SELECT * FROM categories WHERE title LIKE ? OR parent LIKE ? ORDER BY id DESC',
        [`%${q}%`, `%${q}%`]
      );
    }
    const mapped = rows.map(r => ({
      ...r,
      id: r.id,
      image: formatImageUrl(r.image, req),
      parent: r.parent === null ? 'None' : r.parent,
      status: r.status === 1
    }));
    res.json({ success: true, data: mapped, categories: mapped, result: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Search failed', error: error.message });
  }
});

// POST create category
router.post('/', async (req, res) => {
  const titleVal = req.body.title || req.body.categoryName;
  const parentVal = req.body.parent || req.body.mainCategory;
  const imageVal = req.body.image || '';
  const statusVal = req.body.status !== undefined ? req.body.status : req.body.emailStatus;
  
  if (!titleVal) {
    return res.status(400).json({ success: false, message: 'Category Name (title) is required' });
  }
  
  const statusInt = statusVal === true || statusVal === 1 || statusVal === 'true' ? 1 : 0;
  const dbParentVal = parentVal === 'None' || !parentVal ? null : parentVal;
  
  const slug = titleVal.trim().toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  try {
    const [result] = await db.query(
      'INSERT INTO categories (title, slug, parent, image, status) VALUES (?, ?, ?, ?, ?)',
      [titleVal, slug, dbParentVal, imageVal, statusInt]
    );
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        id: result.insertId,
        title: titleVal,
        parent: parentVal,
        image: imageVal,
        status: statusInt === 1
      }
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: 'Failed to create category', error: error.message });
  }
});

// PUT update category
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const numericId = id.startsWith('c') ? parseInt(id.slice(1)) : parseInt(id);
  if (isNaN(numericId)) {
    return res.status(400).json({ success: false, message: 'Invalid Category ID format' });
  }

  const titleVal = req.body.title || req.body.categoryName;
  const parentVal = req.body.parent || req.body.mainCategory;
  const imageVal = req.body.image;
  const statusVal = req.body.status !== undefined ? req.body.status : req.body.emailStatus;
  
  try {
    const fields = [];
    const values = [];

    if (titleVal !== undefined) {
      fields.push('`title` = ?');
      values.push(titleVal);
    }
    if (parentVal !== undefined) {
      fields.push('`parent` = ?');
      values.push(parentVal === 'None' || !parentVal ? null : parentVal);
    }
    if (imageVal !== undefined) {
      fields.push('`image` = ?');
      values.push(imageVal);
    }
    if (statusVal !== undefined) {
      fields.push('`status` = ?');
      values.push(statusVal === true || statusVal === 1 || statusVal === 'true' ? 1 : 0);
    }

    if (fields.length === 0) {
      const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [numericId]);
      return res.json({ success: true, message: 'Update successful (no changes made)', data: rows[0] });
    }

    values.push(numericId);
    const query = `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Retrieve updated category
    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [numericId]);
    const updatedCategory = {
      ...rows[0],
      id: rows[0].id,
      image: formatImageUrl(rows[0].image, req),
      parent: rows[0].parent === null ? 'None' : rows[0].parent,
      status: rows[0].status === 1
    };
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory,
      category: updatedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, message: 'Failed to update category', error: error.message });
  }
});

// DELETE category
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const numericId = id.startsWith('c') ? parseInt(id.slice(1)) : parseInt(id);
  if (isNaN(numericId)) {
    return res.status(400).json({ success: false, message: 'Invalid Category ID format' });
  }

  try {
    // Fetch category title first to perform programmatic cascade delete of sub-categories
    const [rows] = await db.query('SELECT title FROM categories WHERE id = ?', [numericId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const categoryTitle = rows[0].title;

    // Delete sub-categories referencing this category title as parent
    await db.query('DELETE FROM categories WHERE parent = ?', [categoryTitle]);

    // Delete parent category
    await db.query('DELETE FROM categories WHERE id = ?', [numericId]);

    res.json({
      success: true,
      message: 'Category and its sub-categories deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Failed to delete category', error: error.message });
  }
});

// PUT/PATCH toggle category status
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const numericId = id.startsWith('c') ? parseInt(id.slice(1)) : parseInt(id);
  if (isNaN(numericId)) {
    return res.status(400).json({ success: false, message: 'Invalid Category ID format' });
  }

  const statusVal = req.body.status !== undefined ? req.body.status : req.body.emailStatus;
  if (statusVal === undefined) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }
  const statusInt = (statusVal === true || statusVal === 1 || statusVal === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE categories SET status = ? WHERE id = ?', [statusInt, numericId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [numericId]);
    res.json({
      success: true,
      message: `Category status updated to ${statusInt === 1 ? 'active' : 'inactive'}`,
      data: {
        ...rows[0],
        id: rows[0].id,
        parent: rows[0].parent === null ? 'None' : rows[0].parent,
        status: rows[0].status === 1
      }
    });
  } catch (error) {
    console.error('Error toggling category status:', error);
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const numericId = id.startsWith('c') ? parseInt(id.slice(1)) : parseInt(id);
  if (isNaN(numericId)) {
    return res.status(400).json({ success: false, message: 'Invalid Category ID format' });
  }

  const statusVal = req.body.status !== undefined ? req.body.status : req.body.emailStatus;
  if (statusVal === undefined) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }
  const statusInt = (statusVal === true || statusVal === 1 || statusVal === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE categories SET status = ? WHERE id = ?', [statusInt, numericId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [numericId]);
    res.json({
      success: true,
      message: `Category status updated to ${statusInt === 1 ? 'active' : 'inactive'}`,
      data: {
        ...rows[0],
        id: rows[0].id,
        parent: rows[0].parent === null ? 'None' : rows[0].parent,
        status: rows[0].status === 1
      }
    });
  } catch (error) {
    console.error('Error toggling category status:', error);
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
});

module.exports = router;
