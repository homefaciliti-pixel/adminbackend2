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
    const searchMobile = '9875787616';
    
    // Check in old partners (Laravel) table
    console.log(`Searching partners (Laravel) for mobile matching: ${searchMobile}`);
    try {
      const [rows] = await connection.query('SELECT * FROM partners WHERE mobile_number LIKE ?', [`%${searchMobile}%`]);
      console.log('Matches in partners:', rows);
    } catch(e) {
      console.log('Error searching Laravel partners table:', e.message);
    }

    // Check in users (Laravel role_id=2)
    console.log(`\nSearching users (Laravel role_id=2) for mobile matching: ${searchMobile}`);
    try {
      // Find columns in users
      const [cols] = await connection.query('DESCRIBE users');
      const hasMobile = cols.some(c => c.Field.toLowerCase().includes('mobile'));
      const hasPhone = cols.some(c => c.Field.toLowerCase().includes('phone'));
      
      let queryStr = 'SELECT * FROM users WHERE role_id = 2';
      if (hasMobile) {
        queryStr += ' AND mobile_number LIKE ?';
      } else if (hasPhone) {
        queryStr += ' AND phone LIKE ?';
      }
      
      const [rows] = await connection.query(queryStr, [`%${searchMobile}%`]);
      console.log('Matches in users:', rows);
    } catch(e) {
      console.log('Error searching Laravel users table:', e.message);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
