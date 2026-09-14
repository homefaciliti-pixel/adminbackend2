const mysql = require('mysql2/promise');

async function test() {
  const pool = await mysql.createPool({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306,
    connectionLimit: 1
  });

  // Apply query prefixing logic as in db.js
  const tablePrefix = 'node_';
  function prefixQuery(sql) {
    const tables = [
      'users', 'categories', 'services', 'orders', 'orders_v2', 'pages', 'partners',
      'booking_earnings', 'subscription_earnings', 'banners', 'states',
      'cities', 'localities', 'notifications', 'reviews', 'settings_config',
      'support_tickets', 'uploaded_files', 'admin_accounts'
    ];
    const regex = new RegExp(`\\b(FROM|JOIN|INTO|UPDATE|DESCRIBE|TABLE)\\s+\`?(${tables.join('|')})\`?\\b`, 'gi');
    return sql.replace(regex, (match, keyword, tableName) => {
      return `${keyword} \`${tablePrefix}${tableName}\``;
    });
  }

  async function runQuery(name, sql, params = []) {
    try {
      const prefixed = prefixQuery(sql);
      const [rows] = await pool.query(prefixed, params);
      console.log(`✅ ${name}: Success (${rows.length || 0} rows)`);
    } catch (e) {
      console.error(`❌ ${name} failed!`);
      console.error(`   Query: ${sql}`);
      console.error(`   Error: ${e.message}`);
    }
  }

  try {
    const dbName = 'homef4fw_homefaci';
    const todayStr = '31-08-2026';

    console.log('Testing Dashboard combined query...');
    await runQuery('Dashboard Combined Query', `
      SELECT
        (SELECT COUNT(*) FROM node_users_v2) AS nodeUsersV2Count,
        (SELECT COUNT(*) FROM users) AS nodeUsersCount,
        (SELECT COUNT(*) FROM categories) AS totalCategories,
        (SELECT COUNT(*) FROM services) AS totalServices,
        (SELECT COUNT(*) FROM partners) AS nodePartnersCount,
        (SELECT COUNT(*) FROM orders) AS totalOrders,
        (SELECT COUNT(*) FROM orders WHERE status = 'Completed') AS completeOrders,
        (SELECT COUNT(*) FROM orders WHERE status = 'Assigned') AS assignedOrders,
        (SELECT COUNT(*) FROM orders WHERE status = 'In Progress') AS inProgressOrders,
        (SELECT COUNT(*) FROM orders WHERE status = 'Cancelled') AS cancelOrders,
        (SELECT COUNT(*) FROM orders WHERE serviceDate = ?) AS todayOrders,
        (SELECT SUM(amount) FROM subscription_earnings) AS subEarningsVal,
        (SELECT SUM(totalAmount) FROM booking_earnings) AS orderEarningsVal,
        (SELECT COUNT(*) FROM support_tickets) AS totalSupporters,
        (SELECT COUNT(*) FROM \`${dbName}\`.\`users\` WHERE deleted_at IS NULL) AS laravelUsersCount,
        (SELECT COUNT(*) FROM \`${dbName}\`.\`users\` WHERE role_id = 2) AS laravelPartnersCount
    `, [todayStr]);

    console.log('\nTesting Pending Partners query...');
    await runQuery('Pending Partners - node', 'SELECT * FROM partners WHERE isApproved = 0 OR isApproved IS NULL');
    await runQuery('Pending Partners - laravel', `
      SELECT 
        u.id, u.name, u.email, u.mobile_number AS mobile, s.name AS state, c.name AS city, l.name AS locality,
        u.address, u.image, u.status, u.is_approval AS isApproved, u.gender, u.experience, u.service_id AS services,
        u.aadhaar_number AS aadhaarNumber, u.aadhaar_front_image AS aadharFront, u.aadhaar_back_image AS aadharBack,
        u.pan_number AS panNumber, u.pan_image AS panImage, u.bank_name AS bankName, u.account_number AS accountNumber,
        u.ifsc_code AS ifscCode, u.created_at AS createdAt, u.do_you_have_vehicle AS hasVehicle, u.category_id,
        u.sub_category_id, u.account_holder_name AS accountHolder, u.payment_status AS isPaid
      FROM \`${dbName}\`.\`users\` u
      LEFT JOIN \`${dbName}\`.\`states\` s ON u.state_id = s.id
      LEFT JOIN \`${dbName}\`.\`cities\` c ON u.city_id = c.id
      LEFT JOIN \`${dbName}\`.\`localities\` l ON u.locality_id = l.id
      WHERE u.role_id = 2 AND (u.is_approval = 0 OR u.is_approval IS NULL)
    `);

    console.log('\nTesting Orders listing query...');
    await runQuery('Orders - node_orders_v2', 'SELECT * FROM orders_v2');
    await runQuery('Orders - node_orders', 'SELECT * FROM orders');

  } finally {
    await pool.end();
  }
}

test().catch(console.error);
