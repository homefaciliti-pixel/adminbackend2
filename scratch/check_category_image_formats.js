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
    const [rows] = await connection.query("SELECT id, title, image FROM node_categories WHERE image IS NOT NULL AND image != '' LIMIT 5");
    console.log('Images in node_categories:');
    rows.forEach(r => console.log(r));

    const [banners] = await connection.query("SELECT id, title, image FROM node_banners WHERE image IS NOT NULL AND image != '' LIMIT 5");
    console.log('\nImages in node_banners:');
    banners.forEach(r => console.log(r));

    const [services] = await connection.query("SELECT id, title, image FROM node_services WHERE image IS NOT NULL AND image != '' LIMIT 5");
    console.log('\nImages in node_services:');
    services.forEach(r => console.log(r));

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
