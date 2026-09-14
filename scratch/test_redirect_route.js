const https = require('https');

function testRedirect() {
  const url = 'https://partner-backend-2.onrender.com/partner/join?ref=TESTCODE';
  console.log('Testing URL:', url);

  https.get(url, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);

    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('--- Response Body (partial) ---');
      console.log(body.substring(0, 1000));
      console.log('--------------------------------');

      // Check if reference is in response body
      if (body.includes('TESTCODE')) {
        console.log('SUCCESS: Referral code "TESTCODE" is correctly injected into the redirect page.');
      } else {
        console.log('FAIL: Referral code not found in response body.');
      }

      if (body.includes('com.homefaciliti.partner')) {
        console.log('SUCCESS: Google Play Store link has the correct package name (com.homefaciliti.partner).');
      } else {
        console.log('FAIL: Google Play Store link has incorrect package name.');
      }
    });
  }).on('error', (err) => {
    console.error('Request Error:', err.message);
  });
}

testRedirect();
