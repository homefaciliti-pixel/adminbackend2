const fs = require('fs');
const path = require('path');
const db = require('./db');

/**
 * Reads a local file, encodes it as base64, and saves it to node_uploaded_files table.
 * @param {string} filename The name of the file (e.g. uniqueSuffix + ext)
 * @param {string} filepath The absolute path to the local file
 * @param {string} mimetype The MIME type of the file
 */
async function saveFileToDb(filename, filepath, mimetype) {
  try {
    if (!fs.existsSync(filepath)) {
      console.warn(`[saveFileToDb] File does not exist locally: ${filepath}`);
      return;
    }
    const data = await fs.promises.readFile(filepath);
    const base64Data = data.toString('base64');
    
    await db.query(
      'INSERT INTO uploaded_files (filename, file_data, mime_type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE file_data = ?, mime_type = ?',
      [filename, base64Data, mimetype, base64Data, mimetype]
    );
    console.log(`[saveFileToDb] Successfully saved ${filename} to DB.`);
  } catch (err) {
    console.error(`[saveFileToDb] Failed to save ${filename} to DB:`, err.message);
  }
}

/**
 * Loads a file from node_uploaded_files table and recreates it locally.
 * @param {string} filename The name of the file to load
 * @param {string} destPath The absolute target path where the file should be written
 * @returns {Promise<{buffer: Buffer, mimeType: string} | null>}
 */
async function loadFileFromDb(filename, destPath) {
  try {
    const cleanBasename = path.basename(filename);
    const [rows] = await db.query(
      'SELECT file_data, mime_type FROM uploaded_files WHERE filename = ? OR filename = ? OR filename LIKE ?',
      [filename, cleanBasename, `%/${cleanBasename}`]
    );
    if (rows.length > 0) {
      const buffer = Buffer.from(rows[0].file_data, 'base64');
      
      // Ensure target directory exists
      const dir = path.dirname(destPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      await fs.promises.writeFile(destPath, buffer);
      console.log(`[loadFileFromDb] Successfully restored ${filename} from DB to local disk.`);
      return { buffer, mimeType: rows[0].mime_type };
    }
    console.log(`[loadFileFromDb] File ${filename} not found in DB.`);
    return null;
  } catch (err) {
    console.error(`[loadFileFromDb] Failed to load ${filename} from DB:`, err.message);
    return null;
  }
}

module.exports = {
  saveFileToDb,
  loadFileFromDb
};
