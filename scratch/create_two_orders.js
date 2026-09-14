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
    const phone = '9414343434';
    const name = 'laxman jii';
    const addressDetails = {
      id: Math.floor(1000 + Math.random() * 9000),
      userPhone: phone,
      type: 'Home',
      houseNo: 'Flat No.703',
      society: 'Herbinger Heights',
      floor: '7',
      landmark: 'Funberg Road',
      city: 'Jaipur',
      locality: 'Dholai',
      pincode: '302020',
      latitude: 26.8328,
      longitude: 75.7529,
      name: name,
      alternateNumber: '',
      countryCode: '+91'
    };

    const addressJsonString = JSON.stringify(addressDetails);
    const paymentJsonString = JSON.stringify({ paymentMethod: 'Cash', amountPaid: 0 });

    // 1. Ensure user exists
    const [users] = await connection.query('SELECT phone FROM node_users_v2 WHERE phone = ?', [phone]);
    if (users.length === 0) {
      console.log(`User ${phone} not found. Creating user Laxman...`);
      await connection.query(`
        INSERT INTO node_users_v2 (phone, name, email, location, locality, gender, countryCode, walletBalance)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0.00)
      `, [phone, name, 'laxman@gmail.com', 'Jaipur', 'Dholai', 'male', '+91']);
    } else {
      console.log(`User ${phone} already exists.`);
    }

    // 2. Fetch current MAX(id)
    const [[maxRes]] = await connection.query('SELECT MAX(id) as maxId FROM node_orders_v2');
    let nextId = (maxRes.maxId || 0) + 1;
    console.log(`Current max ID: ${maxRes.maxId}, next available ID: ${nextId}`);

    const orderDate = '2026-08-02'; // Tomorrow
    const timeSlot = '4:00 AM - 5:00 AM';

    const ordersToCreate = [
      {
        serviceName: 'RO Repair',
        price: 599.00,
        productId: 'RO Repair',
        description: 'Pump/valve fix...'
      },
      {
        serviceName: 'Washing machine installation and repair',
        price: 650.00,
        productId: 'Washing machine installation and repair',
        description: 'Homefaciliti Washing Machine Installation and Repair...'
      }
    ];

    for (const ord of ordersToCreate) {
      console.log(`Creating order for ${ord.serviceName} with ID: ${nextId}...`);
      const mockRazorpayOrderId = 'order_mock_' + Math.random().toString(36).substr(2, 9);
      const createdAt = Date.now();

      await connection.query(`
        INSERT INTO node_orders_v2 
        (id, userPhone, serviceName, price, date, status, bookingStatus, productId, description, timeSlot, address, payment, razorpayOrderId, createdAt, advancePayment, remainingAmount, platformCharge)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        nextId,
        phone,
        ord.serviceName,
        ord.price,
        orderDate,
        'Pending',
        'searching',
        ord.productId,
        ord.description,
        timeSlot,
        addressJsonString,
        paymentJsonString,
        mockRazorpayOrderId,
        createdAt,
        0.00,
        ord.price,
        0.00
      ]);

      console.log(`Successfully created order. ID: ${nextId}`);
      nextId++;
    }

    console.log('All orders successfully created.');
  } catch (err) {
    console.error('Error creating orders:', err);
  } finally {
    await connection.end();
  }
}

run();
