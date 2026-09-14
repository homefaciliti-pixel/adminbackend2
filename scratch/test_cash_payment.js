const db = require('../db');

async function test() {
  try {
    // 1. Find the test partner 'Govind'
    const [[partnerBefore]] = await db.query('SELECT * FROM partners WHERE name = "Govind"');
    console.log('--- Partner State BEFORE Cash Completion ---');
    console.log(`Name: ${partnerBefore.name}`);
    console.log(`Wallet Balance: ₹${partnerBefore.walletBalance}`);
    console.log(`Total Earnings: ₹${partnerBefore.totalEarnings}`);
    console.log(`Pay To Company: ₹${partnerBefore.payToCompany}`);

    // 2. Find an "In Progress" order for Govind
    const [orders] = await db.query('SELECT * FROM orders WHERE vendorName = "Govind" AND status = "In Progress"');
    if (orders.length === 0) {
      console.log('No In Progress order found for Govind. Running completion test might fail.');
      return;
    }
    const order = orders[0];
    console.log(`\nFound Order: ID ${order.id} | ReqNo ${order.serviceRequestNumber} | Service: ${order.serviceName} | Amount: ₹${order.serviceAmount}`);

    // 3. We simulate what POST /api/bookings/:id/complete does:
    const paymentMethod = 'Cash';
    const isCash = true;
    const commissionRate = 25; // 25% commission for Cash

    const serviceAmount = parseFloat(order.serviceAmount);
    const commissionAmount = (serviceAmount * commissionRate) / 100;
    const partnerShare = serviceAmount - commissionAmount;

    console.log(`\nCalculation for ₹${serviceAmount} Cash:`);
    console.log(`Commission (${commissionRate}%): ₹${commissionAmount}`);
    console.log(`Partner Share: ₹${partnerShare}`);

    await db.query('START TRANSACTION');

    // Update order status
    await db.query("UPDATE orders SET status = 'Completed' WHERE id = ?", [order.id]);

    // Update partner balances
    const walletIncrement = 0.00; // No wallet balance credit for Cash
    const payToCompanyIncrement = commissionAmount; // Add to payToCompany

    await db.query(
      `UPDATE partners 
       SET walletBalance = walletBalance + ?, 
           totalEarnings = totalEarnings + ?, 
           payToCompany = payToCompany + ?,
           completedBookings = completedBookings + 1
       WHERE id = ?`,
      [walletIncrement, partnerShare, payToCompanyIncrement, partnerBefore.id]
    );

    await db.query('COMMIT');
    console.log('\n✅ Transaction committed successfully.');

    // 4. Fetch and print partner details after completion
    const [[partnerAfter]] = await db.query('SELECT * FROM partners WHERE name = "Govind"');
    console.log('\n--- Partner State AFTER Cash Completion ---');
    console.log(`Name: ${partnerAfter.name}`);
    console.log(`Wallet Balance: ₹${partnerAfter.walletBalance} (Expected change: ₹0)`);
    console.log(`Total Earnings: ₹${partnerAfter.totalEarnings} (Expected change: +₹${partnerShare})`);
    console.log(`Pay To Company: ₹${partnerAfter.payToCompany} (Expected change: +₹${commissionAmount})`);

    // Reset Govind state for future tests if needed
    console.log('\n🔄 Reverting transaction to keep database clean...');
    await db.query("UPDATE orders SET status = 'In Progress' WHERE id = ?", [order.id]);
    await db.query(
      `UPDATE partners 
       SET walletBalance = ?, 
           totalEarnings = ?, 
           payToCompany = ?,
           completedBookings = completedBookings - 1
       WHERE id = ?`,
      [partnerBefore.walletBalance, partnerBefore.totalEarnings, partnerBefore.payToCompany, partnerBefore.id]
    );
    console.log('✅ Reverted successfully.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

test();
