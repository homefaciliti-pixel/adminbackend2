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

    // Search razorpay payment ID across orders table
    console.log('Searching in orders for razorpay_payment_id...');
    const [r1] = await connection.query(`SELECT * FROM orders WHERE razorpay_payment_id = ? OR razorpay_id = ?`, [paymentId, paymentId]);
    console.log('Found in orders:', r1);

    // Search in node_orders_v2 address field (JSON) for phone
    console.log('\nSearching node_orders_v2 address field for phone...');
    const [r2] = await connection.query(`SELECT id, userPhone, serviceName, price, status, cancelReason, date, razorpayPaymentId, razorpayOrderId FROM node_orders_v2 WHERE address LIKE ?`, [`%${phone}%`]);
    console.log('Found in node_orders_v2 address:', r2.map(r => `ID: ${r.id}, Service: ${r.serviceName}, Status: ${r.status}, Price: ${r.price}`));

    // Get node_users_v2 info for this phone
    console.log('\nUser in node_users_v2:');
    const [users] = await connection.query('SELECT * FROM node_users_v2 WHERE phone = ?', [phone]);
    console.log(users);

    // Search in node_amc_subscriptions for this phone
    console.log('\nSearching node_amc_subscriptions for this phone...');
    const [r3] = await connection.query(`
      SELECT * FROM node_amc_subscriptions WHERE userPhone = ? OR phone = ?
    `, [phone, phone]);
    console.log('AMC subscriptions:', r3);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
