const db = require('../db');

async function assignOrder694() {
  try {
    const targetMobile = '9928417201';
    console.log(`\n--- Searching for Partner with mobile ${targetMobile} ---`);

    // 1. Find Partner
    const [partners] = await db.query(
      "SELECT * FROM partners WHERE mobile = ? OR mobile = ? OR CONCAT(countryCode, mobile) = ?",
      [targetMobile, `+91${targetMobile}`, targetMobile]
    );

    if (partners.length === 0) {
      console.log(`Partner with mobile ${targetMobile} not found in partners table!`);
      // Check legacy users
      const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
      const [users] = await db.query(
        `SELECT * FROM \`${dbName}\`.\`users\` WHERE role_id = 2 AND (mobile_number = ? OR mobile_number = ?)`,
        [targetMobile, `+91${targetMobile}`]
      );
      console.log('Legacy users table result:', users);
    } else {
      const p = partners[0];
      console.log(`Found Partner: ID=${p.id}, Name="${p.name}", Mobile="${p.mobile}", isPaid=${p.isPaid}, isApproved=${p.isApproved}, status=${p.status}`);

      // Ensure partner is approved and paid if needed
      if (p.isPaid !== 1 || p.isApproved !== 1) {
        console.log('Updating partner isPaid=1 and isApproved=1...');
        await db.query('UPDATE partners SET isPaid = 1, isApproved = 1, status = 1 WHERE id = ?', [p.id]);
        console.log('Partner account status updated to Paid & Approved.');
      }

      // 2. Find Order 694 in node_orders_v2
      const [v2Orders] = await db.query('SELECT * FROM node_orders_v2 WHERE id = 694');
      if (v2Orders.length > 0) {
        console.log('\nFound Order 694 in node_orders_v2:');
        console.log(v2Orders[0]);

        // Assign order to partner
        const cleanMobile = p.mobile.replace(/^\+?91/, '');
        await db.query(
          "UPDATE node_orders_v2 SET partnerName = ?, partnerPhone = ?, status = 'Assigned', bookingStatus = 'assigned' WHERE id = 694",
          [p.name, cleanMobile]
        );
        console.log(`Order 694 successfully assigned to ${p.name} (${cleanMobile}) in node_orders_v2!`);
      } else {
        console.log('Order 694 not found in node_orders_v2, checking admin orders...');
        const [adminOrders] = await db.query('SELECT * FROM orders WHERE id = 694');
        if (adminOrders.length > 0) {
          const cleanMobile = p.mobile.replace(/^\+?91/, '');
          await db.query(
            "UPDATE orders SET vendorName = ?, vendorMobile = ?, status = 'Assigned' WHERE id = 694",
            [p.name, cleanMobile]
          );
          console.log(`Order 694 successfully assigned to ${p.name} (${cleanMobile}) in orders!`);
        } else {
          console.log('Order 694 not found in orders either, checking order_items (Laravel)...');
          const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
          await db.query(
            `UPDATE \`${dbName}\`.\`order_items\` SET vendor_id = ?, status = 'Assigned' WHERE id = 694`,
            [p.id]
          );
          console.log(`Order 694 updated in order_items!`);
        }
      }

      // Verify the update
      const [updatedOrder] = await db.query('SELECT id, serviceName, partnerName, partnerPhone, status, bookingStatus FROM node_orders_v2 WHERE id = 694');
      console.log('\n--- Updated Order 694 Status ---');
      console.log(updatedOrder[0]);
    }

  } catch (err) {
    console.error('Error assigning order:', err);
  }
  process.exit(0);
}

assignOrder694();
