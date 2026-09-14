const https = require('https');

function makeRequest(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'partner-backend-2.onrender.com',
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'NodeTestClient'
      }
    };

    const req = https.request(options, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(resBody)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: resBody
          });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  try {
    const res1 = await makeRequest('/api/auth/send-otp', {
      phone: '9462015852',
      countryCode: '+91'
    });
    console.log('Send OTP status:', res1.statusCode);
    console.log('Send OTP response:', res1.body);
  } catch (err) {
    console.error('Send OTP error:', err.message);
  }

  try {
    const res2 = await makeRequest('/api/auth/login', {
      phone: '9462015852',
      password: 'somepassword',
      countryCode: '+91'
    });
    console.log('Login status:', res2.statusCode);
    console.log('Login response:', res2.body);
  } catch (err) {
    console.error('Login error:', err.message);
  }
}

run();
