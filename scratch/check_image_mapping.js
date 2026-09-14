const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  try {
    // 1. Check categories image values
    const [cats] = await connection.query("SELECT id, title, image FROM node_categories WHERE image != '' LIMIT 5");
    console.log('Categories images:');
    for (const cat of cats) {
      const filename = cat.image.replace(/https?:\/\/[^\/]+\/uploads\//, '');
      const [exists] = await connection.query("SELECT COUNT(*) as count FROM node_uploaded_files WHERE filename = ?", [filename]);
      console.log(`- Title: "${cat.title}", DB Image Value: "${cat.image}" -> Filename extracted: "${filename}" -> Exists in node_uploaded_files: ${exists[0].count > 0}`);
    }

    // 2. Check banners image values
    const [banners] = await connection.query("SELECT id, title, image FROM node_banners WHERE image != '' LIMIT 5");
    console.log('\nBanners images:');
    for (const b of banners) {
      const filename = b.image.replace(/https?:\/\/[^\/]+\/uploads\//, '').replace(/^banners\//, '');
      const [exists] = await connection.query("SELECT COUNT(*) as count FROM node_uploaded_files WHERE filename = ?", [filename]);
      console.log(`- Title: "${b.title}", DB Image Value: "${b.image}" -> Filename: "${filename}" -> Exists in node_uploaded_files: ${exists[0].count > 0}`);
    }

    // 3. Check services image values
    const [services] = await connection.query("SELECT id, title, image FROM node_services WHERE image != '' LIMIT 5");
    console.log('\nServices images:');
    for (const s of services) {
      const filename = s.image.replace(/https?:\/\/[^\/]+\/uploads\//, '');
      const [exists] = await connection.query("SELECT COUNT(*) as count FROM node_uploaded_files WHERE filename = ?", [filename]);
      console.log(`- Title: "${s.title}", DB Image Value: "${s.image}" -> Filename: "${filename}" -> Exists in node_uploaded_files: ${exists[0].count > 0}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
