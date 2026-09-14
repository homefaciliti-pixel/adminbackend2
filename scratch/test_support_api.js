const express = require('express');
const db = require('../db');
const supportRouter = require('../routes/support');

async function runTest() {
  console.log('🧪 Starting local integration tests for Support Ticket partner details mapping & fallback placeholders...');

  const app = express();
  app.use(express.json());
  app.use('/api/support', supportRouter);

  // Start temporary server
  const server = app.listen(3004, async () => {
    console.log('📡 Temporary test server running on port 3004...');

    try {
      console.log('\n--- Test Case 1: GET /api/support (Fetch all tickets and check mapped fields) ---');
      const getRes = await fetch('http://localhost:3004/api/support');
      const getBody = await getRes.json();

      console.log('Response Status:', getRes.status);
      console.log('Returned Tickets Count:', getBody.data ? getBody.data.length : 0);

      if (getRes.status !== 200 || !getBody.success) {
        throw new Error('GET /api/support failed');
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

        // Verification of properties
        if (!ticket.hasOwnProperty('partnerImage')) {
          throw new Error('Support ticket missing "partnerImage" property');
        }
        if (!ticket.hasOwnProperty('partnerDocuments') || !Array.isArray(ticket.partnerDocuments)) {
          throw new Error('Support ticket missing or invalid "partnerDocuments" property');
        }
        if (!ticket.hasOwnProperty('partner')) {
          throw new Error('Support ticket missing "partner" property');
        }

        if (ticket.partnerImage) {
          if (!ticket.partnerImage.startsWith('http://') && !ticket.partnerImage.startsWith('https://')) {
            throw new Error('partnerImage is not a fully qualified URL: ' + ticket.partnerImage);
          }
          if (ticket.partnerImage.includes('/uploads/default-')) {
            console.log('  -> Confirmed: Fallback profile placeholder SVG is active for empty partner image');
          }
        }
      } else {
        console.log('⚠️ No support tickets found in the database. Creating one to test...');
        const createRes = await fetch('http://localhost:3004/api/support', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userName: 'Test User',
            email: 'test@example.com',
            mobile: '9876543201', // Govind's number in seed data
            subject: 'Test Subject',
            message: 'Test Message details here'
          })
        });
        const createBody = await createRes.json();
        console.log('Create Response:', createBody);
        if (createRes.status !== 201 || !createBody.success) {
          throw new Error('Creating support ticket failed');
        }
        console.log('✅ Created support ticket successfully. Re-running test case 1...');
        
        // Fetch again
        const reGetRes = await fetch('http://localhost:3004/api/support');
        const reGetBody = await reGetRes.json();
        const reTicket = reGetBody.data[0];
        console.log('Mapped Ticket:', reTicket);
        if (!reTicket.partnerImage || !reTicket.partner) {
          throw new Error('Support ticket mapping failed after creation');
        }
      }
      console.log('✅ GET /api/support test passed!');

      console.log('\n--- Test Case 2: GET /api/support/:id (Fetch single support ticket) ---');
      // Fetch the last support ticket
      const listRes = await db.query('SELECT id FROM support_tickets ORDER BY id DESC LIMIT 1');
      if (listRes[0].length > 0) {
        const ticketId = listRes[0][0].id;
        const detailRes = await fetch(`http://localhost:3004/api/support/${ticketId}`);
        const detailBody = await detailRes.json();
        console.log('Single Ticket Response Status:', detailRes.status);
        if (detailRes.status !== 200 || !detailBody.success) {
          throw new Error(`GET /api/support/${ticketId} failed`);
        }
        const ticket = detailBody.data;
        if (!ticket.partnerImage || !ticket.hasOwnProperty('partner')) {
          throw new Error('Single ticket response is missing mapped partner fields');
        }
        console.log('✅ GET /api/support/:id test passed!');
      } else {
        console.log('Skipping Test Case 2 because no tickets exist.');
      }

      console.log('\n🎉 All local Support API integration tests completed successfully!');

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
