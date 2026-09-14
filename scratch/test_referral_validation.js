const https = require('https');

function validateCode(code) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ referralCode: code });
    const req = https.request(
      'https://partner-backend-2.onrender.com/api/referral/validate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      },
      (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(body)
          });
        });
      }
    );

    req.on('error', (err) => {
      resolve({ error: err.message });
    });

    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('Testing referral validation...');
  
  // Test Govind's code (ID 171)
  const r1 = await validateCode('HF000171');
  console.log('--- Validate HF000171 ---');
  console.log('Status:', r1.statusCode);
  console.log('Response:', r1.body);

  // Test an invalid code
  const r2 = await validateCode('INVALIDCODE');
  console.log('--- Validate INVALIDCODE ---');
  console.log('Status:', r2.statusCode);
  console.log('Response:', r2.body);
}

run();
