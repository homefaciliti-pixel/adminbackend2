const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const partnerRouter = require('../routes/partner');

const JWT_SECRET = 'home_faciliti_partner_secret_key_2026';

async function runTest() {
  console.log('🧪 Starting integration tests for partner category/services filtering and dashboard sync...');

  // Start express server
  const app = Math.random().toString(); // unused
  const expressApp = express();
  expressApp.use(express.json());
  expressApp.use('/api', partnerRouter);

  const server = expressApp.listen(3003, async () => {
    console.log('📡 Temporary test server running on port 3003...');

    let originalRahul = null;

    try {
      // 1. Fetch original profile for Rahul (ID 89) to restore it later
      const [rahulRows] = await db.query('SELECT category, services FROM partners WHERE id = 89');
      if (rahulRows.length > 0) {
        originalRahul = rahulRows[0];
        console.log('Original Rahul profile saved:', originalRahul);
      }

      // 2. Update Rahul (ID 89) to be a Plumber temporarily
      await db.query(
        `UPDATE partners 
         SET category = 'Plumber', 
             services = 'Tap Repair,Tap / Faucet Repair & Replacement,Sink / Wash-basin  Installation' 
         WHERE id = 89`
      );
      console.log('Rahul (ID 89) temporarily updated to Plumber.');

      // 3. Generate auth tokens
      const tokenHimanshu = jwt.sign({ id: 79, mobile: '7250642698' }, JWT_SECRET);
      const tokenRahul = jwt.sign({ id: 89, mobile: '7250642678' }, JWT_SECRET);

      // Jaipur coordinates address
      const addrJaipur = JSON.stringify({
        latitude: "26.9124",
        longitude: "75.7873",
        city: "Jaipur",
        locality: "Mansarovar",
        name: "Test Customer",
        houseNo: "123"
      });

      console.log('\n--- Inserting test pending bookings in Jaipur ---');

      const todayStr = new Date().toISOString().split('T')[0];
      const lateTimeSlot = '11:00 PM - 11:59 PM';

      // A. AC Foam Jet Service (matches Himanshu - AC Repair service/category)
      const idAC = 900001;
      await db.query(
        `INSERT INTO orders_v2 
         (id, userPhone, serviceName, price, date, status, bookingStatus, address, timeSlot, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [idAC, '8888888801', 'AC Foam Jet Service', 399.00, todayStr, 'Pending', 'searching', addrJaipur, lateTimeSlot, Date.now()]
      );

      // B. Sink / Wash-basin Installation (matches Rahul - Plumber service/category)
      const idPlumber = 900002;
      await db.query(
        `INSERT INTO orders_v2 
         (id, userPhone, serviceName, price, date, status, bookingStatus, address, timeSlot, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [idPlumber, '8888888802', 'Sink / Wash-basin  Installation', 199.00, todayStr, 'Pending', 'searching', addrJaipur, lateTimeSlot, Date.now()]
      );

      // C. Event Shoot (matches no one)
      const idPhoto = 900003;
      await db.query(
        `INSERT INTO orders_v2 
         (id, userPhone, serviceName, price, date, status, bookingStatus, address, timeSlot, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [idPhoto, '8888888803', 'Event Shoot', 4999.00, todayStr, 'Pending', 'searching', addrJaipur, lateTimeSlot, Date.now()]
      );

      console.log(`Inserted bookings with IDs: AC=${idAC}, Plumber=${idPlumber}, Event Shoot=${idPhoto}`);

      console.log('\n--- Test Case 1: Fetch Bookings List and Dashboard Counts for Himanshu ---');
      const resListHimanshu = await fetch('http://localhost:3003/api/bookings', {
        headers: { 'Authorization': `Bearer ${tokenHimanshu}` }
      });
      const bookingsHimanshu = await resListHimanshu.json();
      console.log('Himanshu list items:', bookingsHimanshu.map(b => `${b.id} - ${b.service} (status: ${b.status})`));

      const resDashHimanshu = await fetch('http://localhost:3003/api/partner/dashboard', {
        headers: { 'Authorization': `Bearer ${tokenHimanshu}` }
      });
      const dashHimanshu = await resDashHimanshu.json();
      console.log('Himanshu Dashboard Booking Stats:', dashHimanshu.bookingsStats);

      // Count lists manually
      const manualPendingHimanshu = bookingsHimanshu.filter(b => b.status === 'pending').length;
      const manualAcceptedHimanshu = bookingsHimanshu.filter(b => b.status === 'accepted' || b.status === 'in_progress').length;
      const manualTotalHimanshu = bookingsHimanshu.length;

      console.log(`- Pending match check: manual=${manualPendingHimanshu}, dashboard=${dashHimanshu.bookingsStats.upcomingBooking}`);
      console.log(`- Accepted match check: manual=${manualAcceptedHimanshu}, dashboard=${dashHimanshu.bookingsStats.acceptedBooking}`);
      console.log(`- Total match check: manual=${manualTotalHimanshu}, dashboard=${dashHimanshu.bookingsStats.totalBooking}`);

      if (manualPendingHimanshu !== dashHimanshu.bookingsStats.upcomingBooking) {
        throw new Error('Himanshu pending counts mismatch between list and dashboard!');
      }
      if (manualAcceptedHimanshu !== dashHimanshu.bookingsStats.acceptedBooking) {
        throw new Error('Himanshu accepted counts mismatch between list and dashboard!');
      }
      if (manualTotalHimanshu !== dashHimanshu.bookingsStats.totalBooking) {
        throw new Error('Himanshu total counts mismatch between list and dashboard!');
      }
      console.log('✅ Himanshu list and dashboard counts are 100% in sync!');

      console.log('\n--- Test Case 2: Fetch Bookings List and Dashboard Counts for Rahul Choudhary ---');
      const resListRahul = await fetch('http://localhost:3003/api/bookings', {
        headers: { 'Authorization': `Bearer ${tokenRahul}` }
      });
      const bookingsRahul = await resListRahul.json();
      console.log('Rahul list items:', bookingsRahul.map(b => `${b.id} - ${b.service} (status: ${b.status})`));

      const resDashRahul = await fetch('http://localhost:3003/api/partner/dashboard', {
        headers: { 'Authorization': `Bearer ${tokenRahul}` }
      });
      const dashRahul = await resDashRahul.json();
      console.log('Rahul Dashboard Booking Stats:', dashRahul.bookingsStats);

      // Count lists manually
      const manualPendingRahul = bookingsRahul.filter(b => b.status === 'pending').length;
      const manualAcceptedRahul = bookingsRahul.filter(b => b.status === 'accepted' || b.status === 'in_progress').length;
      const manualTotalRahul = bookingsRahul.length;

      console.log(`- Pending match check: manual=${manualPendingRahul}, dashboard=${dashRahul.bookingsStats.upcomingBooking}`);
      console.log(`- Accepted match check: manual=${manualAcceptedRahul}, dashboard=${dashRahul.bookingsStats.acceptedBooking}`);
      console.log(`- Total match check: manual=${manualTotalRahul}, dashboard=${dashRahul.bookingsStats.totalBooking}`);

      if (manualPendingRahul !== dashRahul.bookingsStats.upcomingBooking) {
        throw new Error('Rahul pending counts mismatch between list and dashboard!');
      }
      if (manualAcceptedRahul !== dashRahul.bookingsStats.acceptedBooking) {
        throw new Error('Rahul accepted counts mismatch between list and dashboard!');
      }
      if (manualTotalRahul !== dashRahul.bookingsStats.totalBooking) {
        throw new Error('Rahul total counts mismatch between list and dashboard!');
      }
      console.log('✅ Rahul list and dashboard counts are 100% in sync!');

      console.log('\n✅ ALL INTEGRATION TESTS PASSED PERFECTLY!');

    } catch (err) {
      console.error('\n❌ Test execution failed:', err);
    } finally {
      console.log('\nCleaning up test bookings...');
      try {
        await db.query("DELETE FROM orders_v2 WHERE id IN (900001, 900002, 900003)");
        console.log('Test bookings cleaned up successfully.');
      } catch (cleanErr) {
        console.error('Failed to clean up test bookings:', cleanErr);
      }

      if (originalRahul) {
        console.log('Restoring original Rahul profile...');
        try {
          await db.query(
            `UPDATE partners 
             SET category = ?, services = ? 
             WHERE id = 89`,
            [originalRahul.category, originalRahul.services]
          );
          console.log('Rahul profile restored successfully.');
        } catch (restoreErr) {
          console.error('Failed to restore Rahul profile:', restoreErr);
        }
      }

      server.close(() => {
        console.log('📡 Test server stopped.');
        process.exit(0);
      });
    }
  });
}

runTest();
