const https = require('https');
const fs = require('fs');
const path = require('path');

function makeGetRequest(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    }).on('error', (err) => resolve({ error: err.message }));
  });
}

function makePostRequest(url, body, headers) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'POST', headers }, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: resBody }));
    });
    req.on('error', (err) => resolve({ error: err.message }));
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log('--- Testing IP-based Referral Flow ---');

  // 1. Simulate Link Click
  console.log('1. Simulating link click on /partner/join?ref=HF000176...');
  const clickRes = await makeGetRequest('https://partner-backend-2.onrender.com/partner/join?ref=HF000176');
  console.log('Link Click Status:', clickRes.statusCode);

  // 2. Simulate App Launch & IP detection
  console.log('2. Simulating app checking /api/referral/detect...');
  const detectRes = await makeGetRequest('https://partner-backend-2.onrender.com/api/referral/detect');
  console.log('Detect Status:', detectRes.statusCode);
  console.log('Detect Body:', detectRes.body);

  // 3. Simulate Registration without explicitly passing referralCode
  console.log('3. Simulating registration with no referralCode parameter...');
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const dummyFileContent = 'dummy image content';
  
  const fields = {
    name: 'IP Test Partner',
    phone: '9999900088',
    email: 'iptest@gmail.com',
    password: 'password123',
    city: 'Narnaul',
    state: 'Haryana',
    locality: 'Sector 1',
    address: '123 Test Street',
    gender: 'Male',
    category: 'Cleaning Services',
    subCategory: 'Home Cleaning Services',
    services: '344,345',
    hasVehicle: 'Yes',
    aadharNumber: '111122223333',
    panNumber: 'ABCDE1234F',
    bankName: 'Test Bank',
    accountHolder: 'Test Holder',
    accountNumber: '1234567890',
    ifscCode: 'TEST0000123'
    // referralCode is omitted!
  };

  let body = '';
  for (const [key, value] of Object.entries(fields)) {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
    body += `${value}\r\n`;
  }

  const fileFields = ['profileImage', 'aadharFront', 'aadharBack', 'panImage', 'policeVerification'];
  fileFields.forEach(field => {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${field}"; filename="test.png"\r\n`;
    body += 'Content-Type: image/png\r\n\r\n';
    body += dummyFileContent + '\r\n';
  });
  body += `--${boundary}--\r\n`;

  const registerRes = await makePostRequest(
    'https://partner-backend-2.onrender.com/api/auth/register',
    body,
    {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': Buffer.byteLength(body)
    }
  );

  console.log('Register Status:', registerRes.statusCode);
  console.log('Register Body:', registerRes.body);
}

run();
