async function runLiveVerification() {
  console.log('🧪 Starting live verification for partner dashboard stats calculations on Render...');
  const liveUrlDash = 'https://partner-backend-2.onrender.com/api/partner/dashboard';
  const liveUrlStats = 'https://partner-backend-2.onrender.com/api/bookings/stats';
  const targetToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsIm1vYmlsZSI6IjgzMDc1MTEzODYiLCJpYXQiOjE3ODA0NjYyNjUsImV4cCI6MTc4MzA1ODI2NX0.awNvtVFKJ-_4ZzeU6Idba7xUMPX_TEqQ1GCYXVx-2d0';

  try {
    console.log(`\n📡 Hitting live dashboard endpoint: ${liveUrlDash}`);
    const resDash = await fetch(liveUrlDash, {
      headers: { 'Authorization': `Bearer ${targetToken}` }
    });
    const dashBody = await resDash.json();
    console.log('Response Status:', resDash.status);
    console.log('bookingsStats Response:', JSON.stringify(dashBody.bookingsStats, null, 2));

    if (resDash.status !== 200) {
      throw new Error('GET /api/partner/dashboard failed on live Render server');
    }

    const stats = dashBody.bookingsStats;
    if (!stats.hasOwnProperty('totalBooking') || !stats.hasOwnProperty('upcomingBooking') || !stats.hasOwnProperty('acceptedBooking') || !stats.hasOwnProperty('inProgressBooking')) {
      throw new Error('bookingsStats is missing properties on live response');
    }

    console.log(`\n📡 Hitting live stats endpoint: ${liveUrlStats}`);
    const resStats = await fetch(liveUrlStats, {
      headers: { 'Authorization': `Bearer ${targetToken}` }
    });
    const statsBody = await resStats.json();
    console.log('Response Status:', resStats.status);
    console.log('bookings/stats Response:', JSON.stringify(statsBody, null, 2));

    if (resStats.status !== 200) {
      throw new Error('GET /api/bookings/stats failed on live Render server');
    }

    console.log('\n🎉 Live dashboard stats verification completed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Live verification failed:', err);
    process.exit(1);
  }
}

runLiveVerification();
