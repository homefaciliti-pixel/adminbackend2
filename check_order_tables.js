const mysql = require('mysql2/promise');

async function run() {
  const pool = await mysql.createPool({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306,
    connectTimeout: 10000,
  });

  try {
    // Check if node_users_v2 table exists
    const [[tableCheck]] = await pool.query(
      "SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = 'homef4fw_homefaci' AND table_name = 'node_users_v2'"
    );
    console.log('node_users_v2 exists:', tableCheck.cnt > 0 ? 'YES' : 'NO');

    // Check node_orders_v2
    const [[v2Check]] = await pool.query(
      "SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = 'homef4fw_homefaci' AND table_name = 'node_orders_v2'"
    );
    console.log('node_orders_v2 exists:', v2Check.cnt > 0 ? 'YES' : 'NO');

    // Check node_orders
    const [[ordersCheck]] = await pool.query(
      "SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = 'homef4fw_homefaci' AND table_name = 'node_orders'"
    );
    console.log('node_orders exists:', ordersCheck.cnt > 0 ? 'YES' : 'NO');

    if (tableCheck.cnt > 0) {
      const [[userCount]] = await pool.query("SELECT COUNT(*) as cnt FROM node_users_v2");
      console.log('node_users_v2 rows:', userCount.cnt);
    }
    if (v2Check.cnt > 0) {
      const [[v2Count]] = await pool.query("SELECT COUNT(*) as cnt FROM node_orders_v2");
      console.log('node_orders_v2 rows:', v2Count.cnt);
    }
    if (ordersCheck.cnt > 0) {
      const [[oCount]] = await pool.query("SELECT COUNT(*) as cnt FROM node_orders");
      console.log('node_orders rows:', oCount.cnt);
    }

  } finally {
    await pool.end();
  }
}

run().catch(console.error);
