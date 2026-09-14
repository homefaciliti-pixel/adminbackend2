const mysql = require('mysql2/promise');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const DEFAULT_SIZE = 339500; // Size of default-document.png fallback

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const ct = res.headers['content-type'] || 'image/png';
        resolve({ buffer, mimeType: ct });
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'homefaciliti.com',
    user: process.env.DB_USER || 'homef4fw_homefaci',
    password: process.env.DB_PASSWORD || 'Xnj3*t%F36RDK+!',
    database: process.env.DB_NAME || 'homef4fw_homefaci',
  });

  console.log('✅ DB connected');

  // Collect all image URLs from categories, services, banners
  const urlsToCheck = [];

  // 1. Categories
  const [cats] = await connection.query('SELECT id, title, image FROM node_categories');
  for (const cat of cats) {
    if (cat.image && cat.image.includes('/uploads/')) {
      urlsToCheck.push({ source: `Category: ${cat.title}`, url: cat.image });
    }
  }

  // 2. Services
  const [services] = await connection.query('SELECT id, title, image FROM node_services');
  for (const s of services) {
    if (s.image && s.image.includes('/uploads/')) {
      urlsToCheck.push({ source: `Service: ${s.title}`, url: s.image });
    }
  }

  // 3. Banners
  const [banners] = await connection.query('SELECT id, title, image FROM node_banners');
  for (const b of banners) {
    // Banners might store filename or full URL. If it's a filename, we check if it is in uploads
    if (b.image) {
      const isUrl = b.image.includes('http');
      const url = isUrl ? b.image : `https://adminbackend-1-h03r.onrender.com/uploads/${b.image}`;
      urlsToCheck.push({ source: `Banner: ${b.title}`, url });
    }
  }

  console.log(`Found ${urlsToCheck.length} image URLs to check.`);

  let downloadedCount = 0;
  let alreadyOkCount = 0;
  let failCount = 0;

  for (const item of urlsToCheck) {
    const filename = item.url.split('/uploads/').pop();
    if (!filename) continue;

    const localPath = path.join(UPLOADS_DIR, filename);

    // Check DB
    const [dbRows] = await connection.query(
      'SELECT filename, LENGTH(file_data) as size FROM node_uploaded_files WHERE filename = ?',
      [filename]
    );

    const existsInDb = dbRows.length > 0;
    const dbSize = existsInDb ? dbRows[0].size : 0;

    if (existsInDb && dbSize !== DEFAULT_SIZE) {
      alreadyOkCount++;
      // Restore locally if missing or default size
      const localExists = fs.existsSync(localPath);
      const localSize = localExists ? fs.statSync(localPath).size : 0;
      if (!localExists || localSize === DEFAULT_SIZE) {
        const [fullRow] = await connection.query(
          'SELECT file_data FROM node_uploaded_files WHERE filename = ?',
          [filename]
        );
        if (fullRow.length > 0) {
          const buf = Buffer.from(fullRow[0].file_data, 'base64');
          fs.writeFileSync(localPath, buf);
          console.log(`📁 Restored ${filename} locally from DB`);
        }
      }
      continue;
    }

    // Need to download and save
    console.log(`⬇️ Downloading missing image for [${item.source}] from: ${item.url}`);
    try {
      const { buffer, mimeType } = await downloadImage(item.url);

      if (buffer.length === DEFAULT_SIZE) {
        console.warn(`  ⚠️ Downloaded image is the fallback placeholder size (${buffer.length} bytes). Skipping save.`);
        failCount++;
        continue;
      }

      // Save locally
      fs.writeFileSync(localPath, buffer);

      // Save to DB
      const base64Data = buffer.toString('base64');
      await connection.query(
        'INSERT INTO node_uploaded_files (filename, file_data, mime_type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE file_data = ?, mime_type = ?',
        [filename, base64Data, mimeType, base64Data, mimeType]
      );
      console.log(`  💾 Successfully saved ${filename} (${buffer.length} bytes) to DB and local uploads`);
      downloadedCount++;
    } catch (err) {
      console.error(`  ❌ Failed to download/save ${filename}: ${err.message}`);
      failCount++;
    }

    // Small delay to prevent rate limit
    await new Promise(r => setTimeout(r, 100));
  }

  console.log('\n========= RECOVERY SUMMARY =========');
  console.log(`Already persisted: ${alreadyOkCount}`);
  console.log(`Downloaded & saved: ${downloadedCount}`);
  console.log(`Failed / Fallbacks: ${failCount}`);

  await connection.end();
}

run().catch(console.error);
