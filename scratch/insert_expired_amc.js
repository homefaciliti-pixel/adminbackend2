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
    const expiredData = [
      {
        amcId: 'AMC-EXP-774282',
        userPhone: '7742824358', // Abhay Kabra
        category: 'Plumbing',
        areaSqFt: 1800,
        floors: 2,
        houseType: 'Villa',
        address: '42, Vaishali Nagar, Jaipur',
        planName: 'Gold Plumbing AMC',
        totalVisits: 8,
        price: 3499.00,
        status: 'expired',
        startDate: '2025-02-15 11:00:00',
        endDate: '2026-02-15 11:00:00',
        razorpayOrderId: 'order_EXP_774282',
        razorpayPaymentId: 'pay_EXP_774282'
      },
      {
        amcId: 'AMC-EXP-773723',
        userPhone: '7737234564', // Rahul choudhary
        category: 'Cleaning',
        areaSqFt: 1200,
        floors: 1,
        houseType: 'Apartment',
        address: 'Flat 304, Royal Palms, Mansarovar, Jaipur',
        planName: 'Premium Deep Cleaning AMC',
        totalVisits: 12,
        price: 5999.00,
        status: 'expired',
        startDate: '2025-01-10 09:30:00',
        endDate: '2026-01-10 09:30:00',
        razorpayOrderId: 'order_EXP_773723',
        razorpayPaymentId: 'pay_EXP_773723'
      },
      {
        amcId: 'AMC-EXP-636457',
        userPhone: '6364578814', // Hdfjj fjfsd
        category: 'Electrical',
        areaSqFt: 2200,
        floors: 3,
        houseType: 'Duplex Villa',
        address: 'B-12, Jagatpura, Jaipur',
        planName: 'Complete Electrical AMC',
        totalVisits: 6,
        price: 2999.00,
        status: 'expired',
        startDate: '2025-03-01 10:15:00',
        endDate: '2026-03-01 10:15:00',
        razorpayOrderId: 'order_EXP_636457',
        razorpayPaymentId: 'pay_EXP_636457'
      }
    ];

    console.log('Inserting expired AMC subscriptions...');

    for (const data of expiredData) {
      // Check if already exists to prevent duplicate key errors
      const [existing] = await connection.query('SELECT amcId FROM node_amc_subscriptions WHERE amcId = ?', [data.amcId]);
      if (existing.length > 0) {
        console.log(`AMC Subscription ${data.amcId} already exists, updating it to expired...`);
        await connection.query(`
          UPDATE node_amc_subscriptions 
          SET status = ?, endDate = ?, userPhone = ?, category = ?, planName = ?
          WHERE amcId = ?
        `, [data.status, data.endDate, data.userPhone, data.category, data.planName, data.amcId]);
      } else {
        console.log(`Inserting new expired AMC Subscription ${data.amcId}...`);
        await connection.query(`
          INSERT INTO node_amc_subscriptions 
          (amcId, userPhone, category, areaSqFt, floors, houseType, address, planName, totalVisits, price, status, startDate, endDate, razorpayOrderId, razorpayPaymentId)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          data.amcId, data.userPhone, data.category, data.areaSqFt, data.floors, data.houseType, data.address,
          data.planName, data.totalVisits, data.price, data.status, data.startDate, data.endDate,
          data.razorpayOrderId, data.razorpayPaymentId
        ]);
      }
    }

    console.log('Done!');
  } catch (err) {
    console.error('Error inserting data:', err);
  } finally {
    await connection.end();
  }
}

run();
