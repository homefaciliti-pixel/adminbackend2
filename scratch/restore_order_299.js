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
    console.log('Restoring order item 299 by setting status to Pending...');
    const [res] = await connection.query(`
      UPDATE order_items 
      SET status = 'Pending', updated_at = NOW() 
      WHERE id = 299
    `);

    if (res.affectedRows > 0) {
      console.log('Successfully restored order item 299 to Pending.');
    } else {
      console.log('Failed to update status.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
