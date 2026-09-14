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
    const res = await makeRequest('/api/auth/login', {
      phone: '8009073091',
      password: 'secure123',
      countryCode: '+91'
    });
    console.log('Login status:', res.statusCode);
    console.log('Login response:', res.body);
  } catch (err) {
    console.error('Login error:', err.message);
  }
}

run();
