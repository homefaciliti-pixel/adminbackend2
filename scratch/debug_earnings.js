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
    const partnerName = 'Active Partner';
    const [partners] = await connection.query("SELECT * FROM node_partners WHERE name = ?", [partnerName]);
    const partner = partners[0];

    // 1. Fetch completed admin orders
    const [adminOrders] = await connection.query(
      "SELECT serviceAmount, paymentMethod, serviceDate FROM node_orders WHERE vendorName = ? AND status = 'Completed'",
      [partnerName]
    );

    // 2. Fetch completed app orders (v2)
    const [v2Orders] = await connection.query(
      "SELECT id, price, payment, date FROM node_orders_v2 WHERE partnerName = ? AND status = 'Completed'",
      [partnerName]
    );

    console.log(`Found ${adminOrders.length} admin orders and ${v2Orders.length} v2 orders.`);

    // Helper functions for date matching in IST
    const today = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const todayIST = new Date(Date.now() + istOffset + (new Date().getTimezoneOffset() * 60000));
    
    const yyyy = todayIST.getFullYear();
    const mm = String(todayIST.getMonth() + 1).padStart(2, '0');
    const dd = String(todayIST.getDate()).padStart(2, '0');
    
    const dVal = todayIST.getDate();
    const mVal = todayIST.getMonth() + 1;

    // ISO formats
    const todayISO1 = yyyy + '-' + mm + '-' + dd;
    const todayISO2 = yyyy + '-' + mVal + '-' + dVal;
    const todayISO3 = yyyy + '-' + mm + '-' + dVal;
    const todayISO4 = yyyy + '-' + mVal + '-' + dd;

    // Dashed formats
    const todayDashed1 = dd + '-' + mm + '-' + yyyy;
    const todayDashed2 = dVal + '-' + mVal + '-' + yyyy;
    const todayDashed3 = dd + '-' + mVal + '-' + yyyy;
    const todayDashed4 = dVal + '-' + mm + '-' + yyyy;

    // Slashed formats
    const todaySlashed1 = dd + '/' + mm + '/' + yyyy;
    const todaySlashed2 = dVal + '/' + mVal + '/' + yyyy;
    const todaySlashed3 = dd + '/' + mVal + '/' + yyyy;
    const todaySlashed4 = dVal + '/' + mm + '/' + yyyy;

    const isToday = (dateStr) => {
      if (!dateStr) return false;
      const clean = dateStr.trim();
      return clean === todayISO1 || 
             clean === todayISO2 || 
             clean === todayISO3 || 
             clean === todayISO4 || 
             clean === todayDashed1 || 
             clean === todayDashed2 || 
             clean === todayDashed3 || 
             clean === todayDashed4 || 
             clean === todaySlashed1 || 
             clean === todaySlashed2 || 
             clean === todaySlashed3 || 
             clean === todaySlashed4;
    };

    let totalEarningsCalculated = 0;
    let todayEarning = 0;
    let cashEarning = 0;
    let onlineEarning = 0;

    for (const o of adminOrders) {
      const amount = parseFloat(o.serviceAmount || 0);
      const partnerShare = amount * 0.75;
      const isCash = (o.paymentMethod || '').toLowerCase() === 'cash';
      
      totalEarningsCalculated += partnerShare;
      if (isToday(o.serviceDate)) {
        todayEarning += partnerShare;
      }
      if (isCash) {
        cashEarning += partnerShare;
      } else {
        onlineEarning += partnerShare;
      }
    }

    for (const o of v2Orders) {
      const amount = parseFloat(o.price || 0);
      const partnerShare = amount * 0.75;
      
      let isCash = false;
      try {
        const payObj = typeof o.payment === 'string' ? JSON.parse(o.payment) : (o.payment || {});
        isCash = (payObj.paymentMethod || '').toLowerCase() === 'cash';
      } catch(e) {}

      totalEarningsCalculated += partnerShare;
      console.log(`v2 Order ${o.id}: amount=${amount}, partnerShare=${partnerShare}, isToday=${isToday(o.date)} (${o.date}), isCash=${isCash}`);
      if (isToday(o.date)) {
        todayEarning += partnerShare;
      }
      if (isCash) {
        cashEarning += partnerShare;
      } else {
        onlineEarning += partnerShare;
      }
    }

    console.log('Results:');
    console.log({
      totalEarning: Math.round(totalEarningsCalculated),
      todayEarning: Math.round(todayEarning),
      monthlyEarning: Math.round(totalEarningsCalculated),
      onlineEarning: Math.round(onlineEarning),
      cashEarning: Math.round(cashEarning),
      payToCompany: parseFloat(partner.payToCompany || 0),
      walletBalance: parseFloat(partner.walletBalance || 0)
    });
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
