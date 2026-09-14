async function runLiveVerification() {
  console.log('🧪 Starting live verification for Support Ticket partner details mapping & fallback placeholders on Render...');
  const liveUrl = 'https://partner-backend-2.onrender.com/api/support';

  try {
    console.log(`📡 Hitting live endpoint: ${liveUrl}`);
    const getRes = await fetch(liveUrl);
    const getBody = await getRes.json();

    console.log('Response Status:', getRes.status);
    console.log('Returned Tickets Count:', getBody.data ? getBody.data.length : 0);

    if (getRes.status !== 200 || !getBody.success) {
      throw new Error('GET /api/support on live server failed');
    }

    if (getBody.data && getBody.data.length > 0) {
      const ticket = getBody.data[0];
      console.log('First Support Ticket details:');
      console.log('  ID:', ticket.id);
      console.log('  UserName:', ticket.userName);
      console.log('  Mobile:', ticket.mobile);
      console.log('  partnerImage:', ticket.partnerImage);
      console.log('  partnerDocuments:', JSON.stringify(ticket.partnerDocuments));
      console.log('  partner object exists:', !!ticket.partner);

      // Verify the properties exist on live response
      if (!ticket.hasOwnProperty('partnerImage')) {
        throw new Error('Live support ticket missing "partnerImage" property');
      }
      if (!ticket.hasOwnProperty('partnerDocuments') || !Array.isArray(ticket.partnerDocuments)) {
        throw new Error('Live support ticket missing or invalid "partnerDocuments" property');
      }
      if (!ticket.hasOwnProperty('partner')) {
        throw new Error('Live support ticket missing "partner" property');
      }

      if (ticket.partnerImage) {
        if (!ticket.partnerImage.startsWith('http://') && !ticket.partnerImage.startsWith('https://')) {
          throw new Error('Live partnerImage is not a fully qualified URL: ' + ticket.partnerImage);
        }
        if (ticket.partnerImage.includes('/uploads/default-profile.svg')) {
          console.log('  -> Confirmed: Fallback profile placeholder SVG is active for empty partner image');
        }
      }
      console.log('✅ Live verification test passed!');
    } else {
      console.log('⚠️ No support tickets found on the live server database to verify. Live verification skipped ticket field validation but API responded successfully.');
    }

    console.log('\n🎉 Live Support API verification completed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Live verification failed:', err);
    process.exit(1);
  }
}

runLiveVerification();
