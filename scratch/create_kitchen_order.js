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
    const phone = '9660085662';
    const name = 'Anjana';
    const addressDetails = {
      id: Math.floor(1000 + Math.random() * 9000),
      userPhone: phone,
      type: 'Home',
      houseNo: 'Kamlesh kumar',
      society: 'Vishwakarma industrial area road no 4',
      floor: '',
      landmark: 'opposite SBI Bank, Sikar Road',
      city: 'Jaipur',
      locality: 'Sikar Road',
      pincode: '302013',
      latitude: null, // explicit null
      longitude: null,
      name: name,
      alternateNumber: '',
      countryCode: '+91'
    };

    const addressJsonString = JSON.stringify(addressDetails);
    const paymentJsonString = JSON.stringify({ paymentMethod: 'Cash', amountPaid: 0 });

    // 1. Ensure user exists
    const [users] = await connection.query('SELECT phone FROM node_users_v2 WHERE phone = ?', [phone]);
    if (users.length === 0) {
      console.log(`User ${phone} not found. Creating user Anjana...`);
      await connection.query(`
        INSERT INTO node_users_v2 (phone, name, email, location, locality, gender, countryCode, walletBalance)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0.00)
      `, [phone, name, 'anjana@gmail.com', 'Jaipur', 'Sikar Road', 'female', '+91']);
    } else {
      console.log(`User ${phone} already exists.`);
    }

    // 2. Fetch current MAX(id)
    const [[maxRes]] = await connection.query('SELECT MAX(id) as maxId FROM node_orders_v2');
    const nextId = (maxRes.maxId || 0) + 1;
    console.log(`Current max ID: ${maxRes.maxId}, next ID: ${nextId}`);

    const orderDate = '2026-08-02'; // Tomorrow
    const timeSlot = '11:00 AM - 12:00 PM';
    const serviceName = 'Basic Kitchen Cleaning';
    const price = 499.00;
    const description = 'Stove & gas top cleaning Slab / countertop wipe & ...';

    console.log(`Creating order for ${serviceName} with ID: ${nextId}...`);
    const mockRazorpayOrderId = 'order_mock_' + Math.random().toString(36).substr(2, 9);
    const createdAt = Date.now();

    await connection.query(`
      INSERT INTO node_orders_v2 
      (id, userPhone, serviceName, price, date, status, bookingStatus, productId, description, timeSlot, address, payment, razorpayOrderId, createdAt, advancePayment, remainingAmount, platformCharge, partnerPhone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nextId,
      phone,
      serviceName,
      price,
      orderDate,
      'Pending',
      'searching',
      '55', // Product ID of Basic Kitchen Cleaning
      description,
      timeSlot,
      addressJsonString,
      paymentJsonString,
      mockRazorpayOrderId,
      createdAt,
      0.00,
      price,
      0.00,
      null // partnerPhone
    ]);

    console.log(`Successfully created order. ID: ${nextId}`);
  } catch (err) {
    console.error('Error creating kitchen cleaning order:', err);
  } finally {
    await connection.end();
  }
}

run();
