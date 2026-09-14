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
    const tables = ['orders', 'node_orders', 'node_amc_visits', 'node_amc_subscriptions'];
    for (const tbl of tables) {
      try {
        const [[res]] = await connection.query(`SELECT MAX(id) as maxId FROM \`${tbl}\``);
        console.log(`Max ID in ${tbl}:`, res.maxId);
      } catch (e) {
        console.log(`Failed to get max ID for ${tbl}:`, e.message);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
