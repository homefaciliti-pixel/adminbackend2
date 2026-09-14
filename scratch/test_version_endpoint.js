const https = require('https');

function testVersion() {
  https.get('https://partner-backend-2.onrender.com/api/settings/version', (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('Status Code:', res.statusCode);
      console.log('Response Body:', JSON.parse(body));
    });
  }).on('error', (err) => {
    console.error('Request Error:', err.message);
  });
}

testVersion();
