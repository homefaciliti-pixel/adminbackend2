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
    // 1. Cancel order 595
    console.log('Cancelling Order 595...');
    const [cancelRes] = await connection.query(`
      UPDATE node_orders_v2 
      SET status = 'Cancelled', cancelReason = 'Cancelled by user' 
      WHERE id = ?
    `, [595]);
    if (cancelRes.affectedRows > 0) {
      console.log('Order 595 successfully cancelled.');
    } else {
      console.log('Order 595 not found or already cancelled.');
    }

    // 2. Create new order for Simma
    const phone = '6375571560';
    const name = 'Simma';
    const addressDetails = {
      id: Math.floor(1000 + Math.random() * 9000),
      userPhone: phone,
      type: 'Home',
      houseNo: 'Jb prime 2',
      society: 'Near Sufal School',
      floor: '',
      landmark: 'Gokulpura Kalwar Road',
      city: 'Jaipur',
      locality: 'Kalwar Road',
      pincode: '302012',
      latitude: null, // explicit null as requested
      longitude: null,
      name: name,
      alternateNumber: '',
      countryCode: '+91'
    };

    const addressJsonString = JSON.stringify(addressDetails);
    const paymentJsonString = JSON.stringify({ paymentMethod: 'Cash', amountPaid: 0 });

    // Ensure user exists in node_users_v2
    const [users] = await connection.query('SELECT phone FROM node_users_v2 WHERE phone = ?', [phone]);
    if (users.length === 0) {
      console.log(`User ${phone} not found. Creating user Simma...`);
      await connection.query(`
        INSERT INTO node_users_v2 (phone, name, email, location, locality, gender, countryCode, walletBalance)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0.00)
      `, [phone, name, 'simma@gmail.com', 'Jaipur', 'Kalwar Road', 'female', '+91']);
    } else {
      console.log(`User ${phone} already exists.`);
    }

    // Fetch current MAX(id)
    const [[maxRes]] = await connection.query('SELECT MAX(id) as maxId FROM node_orders_v2');
    const nextId = (maxRes.maxId || 0) + 1;
    console.log(`Current max ID: ${maxRes.maxId}, next ID: ${nextId}`);

    const orderDate = '2026-08-03'; // Monday
    const timeSlot = '10:30 AM';
    const serviceName = '3 BHK essential cleaning';
    const price = 3199.00;
    const description = 'Includes: - All Basic Cleaning + - Floor deep mopp...';

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
      '124', // Product ID of 3 BHK essential cleaning
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
    console.error('Error executing database tasks:', err);
  } finally {
    await connection.end();
  }
}

run();
