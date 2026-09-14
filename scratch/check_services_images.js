const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'homefaciliti.com',
    user: process.env.DB_USER || 'homef4fw_homefaci',
    password: process.env.DB_PASSWORD || 'Xnj3*t%F36RDK+!',
    database: process.env.DB_NAME || 'homef4fw_homefaci'
  });

  const [r] = await c.query("SELECT s.id, s.title, s.image FROM node_services s WHERE s.image LIKE '%/uploads/%'");
  console.log('Found', r.length, 'services with upload URLs.');
  
  for (const s of r) {
    const filename = s.image.split('/uploads/').pop();
    const [dbRow] = await c.query('SELECT filename, LENGTH(file_data) as size FROM node_uploaded_files WHERE filename = ?', [filename]);
    if (dbRow.length > 0) {
      console.log(`[OK] ${s.title}: file size in DB is ${dbRow[0].size}`);
    } else {
      console.log(`[MISSING] ${s.title}: NOT in DB! URL: ${s.image}`);
    }
  }
  await c.end();
}

run().catch(console.error);
