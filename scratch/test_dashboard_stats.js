const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const partnerRouter = require('../routes/partner');

async function runTest() {
  console.log('🧪 Starting local integration tests for partner dashboard stats calculations...');

  const app = express();
  app.use(express.json());
  app.use('/api', partnerRouter);

  const server = app.listen(3005, async () => {
    console.log('📡 Temporary test server running on port 3005...');

    try {
      // Use target test partner ID = 10
      const partnerId = 10;
      const targetToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsIm1vYmlsZSI6IjgzMDc1MTEzODYiLCJpYXQiOjE3ODA0NjYyNjUsImV4cCI6MTc4MzA1ODI2NX0.awNvtVFKJ-_4ZzeU6Idba7xUMPX_TEqQ1GCYXVx-2d0';

      console.log('\n--- Test Case 1: GET /api/partner/dashboard ---');
      const resDash = await fetch('http://localhost:3005/api/partner/dashboard', {
        headers: { 'Authorization': `Bearer ${targetToken}` }
      });
      const dashBody = await resDash.json();
      console.log('Response Status:', resDash.status);
      console.log('bookingsStats Response:', JSON.stringify(dashBody.bookingsStats, null, 2));

      if (resDash.status !== 200) {
        throw new Error('GET /api/partner/dashboard failed');
      }

      const stats = dashBody.bookingsStats;
      // Verification of logic
      if (!stats.hasOwnProperty('totalBooking') || !stats.hasOwnProperty('upcomingBooking') || !stats.hasOwnProperty('acceptedBooking') || !stats.hasOwnProperty('inProgressBooking')) {
        throw new Error('bookingsStats is missing properties');
      }

      console.log('✅ GET /api/partner/dashboard stats check passed!');

      console.log('\n--- Test Case 2: GET /api/bookings/stats ---');
      const resStats = await fetch('http://localhost:3005/api/bookings/stats', {
        headers: { 'Authorization': `Bearer ${targetToken}` }
      });
      const statsBody = await resStats.json();
      console.log('Response Status:', resStats.status);
      console.log('bookings/stats Response:', JSON.stringify(statsBody, null, 2));

      if (resStats.status !== 200) {
        throw new Error('GET /api/bookings/stats failed');
      }

      console.log('✅ GET /api/bookings/stats check passed!');

      console.log('\n🎉 All local dashboard stats integration tests completed successfully!');

    } catch (err) {
      console.error('\n❌ Test execution failed:', err);
    } finally {
      server.close(() => {
        console.log('📡 Test server stopped.');
        process.exit(0);
      });
    }
  });
}

runTest();
