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
    // Find Men Facial service
    console.log('Searching for Men Facial service...');
    const [services] = await connection.query(`
      SELECT id, title, price FROM node_services 
      WHERE title LIKE '%Men%' AND (title LIKE '%Facial%' OR title LIKE '%Face%' OR title LIKE '%Cleanup%' OR title LIKE '%Skin%')
    `);
    console.log('Men Facial services:', services);

    // Fetch max ID
    const [[maxRes]] = await connection.query('SELECT MAX(id) as maxId FROM node_orders_v2');
    const nextId = (maxRes.maxId || 0) + 1;
    console.log(`\nCurrent max ID: ${maxRes.maxId}, next ID: ${nextId}`);

    const phone = '9949445425';
    const name = 'Customer'; // name not known
    const addressDetails = {
      id: Math.floor(1000 + Math.random() * 9000),
      userPhone: phone,
      type: 'Home',
      houseNo: '',
      society: '',
      floor: '',
      landmark: '',
      city: 'Navi Mumbai',
      locality: 'Navi Mumbai',
      pincode: '400614',
      latitude: null,
      longitude: null,
      name: name,
      alternateNumber: '',
      countryCode: '+91'
    };

    const addressJson = JSON.stringify(addressDetails);
    const paymentJson = JSON.stringify({ paymentMethod: 'Razorpay', amountPaid: 599 });

    const serviceName = 'Men Face & Skin (Cleanup)';
    const price = 599.00;
    const razorpayPaymentId = 'pay_TKVl8HrPCyOpGe';
    const today = new Date().toISOString().split('T')[0]; // 2026-08-01
    const createdAt = Date.now();

    console.log(`\nCreating Men Facial order (ID: ${nextId}) for ${phone}...`);

    await connection.query(`
      INSERT INTO node_orders_v2 
      (id, userPhone, serviceName, price, date, status, bookingStatus, productId, description, timeSlot, address, payment, razorpayOrderId, razorpayPaymentId, createdAt, advancePayment, remainingAmount, platformCharge, partnerPhone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nextId,
      phone,
      serviceName,
      price,
      today,
      'Paid',
      'searching',
      '161',
      'Men face & skin cleanup - deep cleansing, exfoliation, and skin brightening treatment.',
      '11:00 AM - 12:00 PM',
      addressJson,
      paymentJson,
      'order_mock_' + Math.random().toString(36).substr(2, 9),
      razorpayPaymentId,
      createdAt,
      599.00,
      0.00,
      0.00,
      null
    ]);

    console.log(`✅ Order created successfully! ID: ${nextId}`);

    // Verify
    const [verify] = await connection.query('SELECT id, userPhone, serviceName, price, status, razorpayPaymentId FROM node_orders_v2 WHERE id = ?', [nextId]);
    console.log('\nVerification:', verify[0]);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
