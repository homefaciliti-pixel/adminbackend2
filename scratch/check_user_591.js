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
    const tables = ['node_users_v2', 'node_partners', 'node_orders_v2', 'node_support_tickets'];
    for (const tbl of tables) {
      const [rows] = await connection.query(`SELECT * FROM \`${tbl}\` WHERE id = 591`);
      console.log(`${tbl} search:`, rows);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
