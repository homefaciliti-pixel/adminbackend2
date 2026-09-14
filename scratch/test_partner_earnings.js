const db = require('../db');

async function main() {
  try {
    const [partners] = await db.query('SELECT * FROM partners WHERE mobile = ?', ['9868605551']);
    if (partners.length === 0) {
      console.log('Partner not found');
      process.exit(1);
    }
    const partner = partners[0];
    const partnerName = partner.name;
    const partnerMobile = partner.mobile;

    const [adminOrders] = await db.query(
      "SELECT serviceAmount, paymentMethod, serviceDate FROM orders WHERE (LOWER(TRIM(vendorName)) = LOWER(TRIM(?)) OR vendorMobile = ?) AND LOWER(status) = 'completed'",
      [partnerName, partnerMobile]
    );

    const [v2Orders] = await db.query(
      "SELECT price, payment, date FROM orders_v2 WHERE LOWER(TRIM(partnerName)) = LOWER(TRIM(?)) AND LOWER(status) = 'completed'",
      [partnerName]
    );

    let totalEarningsCalculated = 0;
    let todayEarning = 0;
    let cashEarning = 0;
    let onlineEarning = 0;

    for (const o of adminOrders) {
      const amount = parseFloat(o.serviceAmount || 0);
      const partnerShare = amount * 0.75;
      const isCash = (o.paymentMethod || '').toLowerCase() === 'cash';
      totalEarningsCalculated += partnerShare;
      if (isCash) cashEarning += partnerShare;
      else onlineEarning += partnerShare;
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
      if (isCash) cashEarning += partnerShare;
      else onlineEarning += partnerShare;
    }

    const dbTotalEarnings = parseFloat(partner.totalEarnings || 0);
    const dbWalletBalance = parseFloat(partner.walletBalance || 0);
    const dbPayToCompany = parseFloat(partner.payToCompany || 0);

    const finalTotalEarning = Math.max(Math.round(totalEarningsCalculated), Math.round(dbTotalEarnings));
    const finalMonthlyEarning = finalTotalEarning;
    const finalOnlineEarning = Math.max(Math.round(onlineEarning), Math.round(dbWalletBalance));
    const finalCashEarning = Math.max(Math.round(cashEarning), Math.round(dbPayToCompany));

    console.log('Resulting Earnings JSON:', {
      totalEarning: finalTotalEarning,
      todayEarning: Math.round(todayEarning),
      monthlyEarning: finalMonthlyEarning,
      onlineEarning: finalOnlineEarning,
      cashEarning: finalCashEarning,
      payToCompany: dbPayToCompany,
      walletBalance: dbWalletBalance
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
