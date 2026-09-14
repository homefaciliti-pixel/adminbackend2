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
    const tables = [
      'node_amc_visits',
      'node_amc_partner_payments',
      'node_partners',
      'node_users_v2',
      'node_support_tickets',
      'node_booking_earnings',
      'node_subscription_earnings',
      'node_reviews',
      'node_banners',
      'node_cities',
      'node_localities'
    ];

    console.log('Searching for ID 591 across various tables...');

    for (const table of tables) {
      try {
        const [rows] = await connection.query(`SELECT * FROM \`${table}\` WHERE id = ?`, [591]);
        if (rows.length > 0) {
          console.log(`\n🎉 Found in ${table}:`, rows[0]);
        }
      } catch (e) {
        // Table might not exist or not have 'id' column
        // Let's try matching check for other common pk names like amcId
        if (table === 'node_amc_subscriptions' || table === 'node_amc_visits') {
          try {
            const [rows2] = await connection.query(`SELECT * FROM \`${table}\` WHERE amcId = ?`, ['591']);
            if (rows2.length > 0) {
              console.log(`\n🎉 Found in ${table} (by amcId):`, rows2[0]);
            }
          } catch (e2) {}
        }
      }
    }

    // Let's also check if it's a bookingCode or orderId in node_amc_visits or node_orders_v2
    try {
      const [rows] = await connection.query('SELECT * FROM node_amc_visits WHERE bookingCode = ?', ['591']);
      if (rows.length > 0) console.log('\n🎉 Found in node_amc_visits (by bookingCode):', rows[0]);
    } catch (e) {}

    try {
      const [rows] = await connection.query('SELECT * FROM node_orders_v2 WHERE bookingStatus = ? OR status = ?', ['591', '591']);
      if (rows.length > 0) console.log('\n🎉 Found in node_orders_v2 (by status/bookingStatus):', rows[0]);
    } catch (e) {}

    console.log('\nSearch completed.');
  } catch (err) {
    console.error('Error running search:', err);
  } finally {
    await connection.end();
  }
}

run();
