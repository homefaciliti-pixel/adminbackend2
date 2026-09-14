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
    const phone = '9949445425';
    const paymentId = 'pay_TKVl8HrPCyOpGe';

    console.log(`Searching for phone: ${phone} and payment ID: ${paymentId}...`);

    // Check node_orders_v2
    console.log('\n--- node_orders_v2 ---');
    const [rows1] = await connection.query(`
      SELECT * FROM node_orders_v2 
      WHERE userPhone LIKE ? OR razorpayPaymentId = ?
    `, [`%${phone}%`, paymentId]);
    console.log(`Found ${rows1.length} rows:`, rows1);

    // Check orders (Laravel)
    console.log('\n--- orders (Laravel) ---');
    const [rows2] = await connection.query(`
      SELECT o.*, oi.service_name, oi.status as item_status
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.razorpay_payment_id = ? OR oi.razorpay_payment_id = ?
    `, [paymentId, paymentId]);
    console.log(`Found ${rows2.length} rows:`, rows2);

    // Check order_items directly
    console.log('\n--- order_items ---');
    const [rows3] = await connection.query(`
      SELECT * FROM order_items WHERE razorpay_payment_id = ?
    `, [paymentId]);
    console.log(`Found ${rows3.length} rows:`, rows3);

    // Check node_users_v2 for this phone
    console.log('\n--- node_users_v2 ---');
    const [users] = await connection.query(`SELECT * FROM node_users_v2 WHERE phone LIKE ?`, [`%${phone}%`]);
    console.log(`Found ${users.length} users:`, users.map(u => `Name: ${u.name}, Phone: ${u.phone}`));

    // Check orders (Laravel) by user phone via users table
    console.log('\n--- Checking orders via user lookup ---');
    const [laravelUsers] = await connection.query('SELECT * FROM users WHERE phone = ? OR mobile = ?', [phone, phone]);
    console.log(`Found ${laravelUsers.length} users in Laravel users:`, laravelUsers.map(u => `ID: ${u.id}, Name: ${u.name}, Phone: ${u.phone || u.mobile}`));
    if (laravelUsers.length > 0) {
      const userId = laravelUsers[0].id;
      const [ordersByUser] = await connection.query(`
        SELECT o.*, oi.service_name, oi.status as item_status 
        FROM orders o 
        LEFT JOIN order_items oi ON oi.order_id = o.id 
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
      `, [userId]);
      console.log(`Orders for user ${userId}:`, ordersByUser.map(o => `Order: ${o.id}, Service: ${o.service_name}, Amount: ${o.amount}, Status: ${o.item_status}`));
    }

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
