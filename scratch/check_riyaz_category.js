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
    const [catRows] = await connection.query('SELECT id, title FROM node_categories');
    const catMap = {};
    catRows.forEach(row => { catMap[row.id] = row.title; });

    const [rows] = await connection.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.mobile_number AS mobile, 
        s.name AS state, 
        c.name AS city, 
        l.name AS locality,
        u.category_id,
        u.status,
        u.is_approval AS isApproved
      FROM users u
      LEFT JOIN states s ON u.state_id = s.id
      LEFT JOIN cities c ON u.city_id = c.id
      LEFT JOIN localities l ON u.locality_id = l.id
      WHERE u.id = 1473
    `);
    
    console.log('SQL select result for Riyaz Ansari (ID 1473):');
    console.log(rows[0]);
    console.log('Resolved category name using catMap[105]:', catMap[105]);

    // Let's print the category titles from the categories table where id = 105
    const [catLaravel] = await connection.query('SELECT id, title FROM categories WHERE id = 105');
    console.log('\nLaravel categories query result for ID 105:');
    console.log(catLaravel[0]);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
