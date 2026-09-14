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
    const [rows] = await connection.query(`
      SELECT id, title FROM node_categories WHERE id IN (103, 105, 107, 115, 119, 121, 127)
    `);
    console.log('Categories in node_categories with Laravel IDs:');
    rows.forEach(r => console.log(`- ID: ${r.id}, Title: "${r.title}"`));

    const [allCats] = await connection.query('SELECT COUNT(*) as count FROM node_categories');
    console.log(`Total categories in node_categories: ${allCats[0].count}`);

    const [maxIdNode] = await connection.query('SELECT MAX(id) as maxId FROM node_categories');
    console.log(`Max ID in node_categories: ${maxIdNode[0].maxId}`);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
