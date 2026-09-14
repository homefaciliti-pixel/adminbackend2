const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

function registerPartner() {
  const url = 'https://partner-backend-2.onrender.com/api/auth/register';
  console.log('Sending mock registration request to:', url);

  // We will build a raw multipart/form-data request body
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  
  // Create a temporary dummy file on disk for the test upload
  const dummyFileContent = 'dummy image content';
  const dummyFilePath = path.join(__dirname, 'dummy_test.png');
  fs.writeFileSync(dummyFilePath, dummyFileContent);

  const fields = {
    name: 'Test Referral Partner',
    phone: '9999900009',
    email: 'testreferral@gmail.com',
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
    ifscCode: 'TEST0000123',
    referralCode: 'HF000171' // Govind's code
  };

  let body = '';
  for (const [key, value] of Object.entries(fields)) {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
    body += `${value}\r\n`;
  }

  // Add mandatory file fields
  const fileFields = ['profileImage', 'aadharFront', 'aadharBack', 'panImage', 'policeVerification'];
  
  fileFields.forEach(field => {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${field}"; filename="test.png"\r\n`;
    body += 'Content-Type: image/png\r\n\r\n';
    body += dummyFileContent + '\r\n';
  });
  
  body += `--${boundary}--\r\n`;

  const req = https.request(url, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': Buffer.byteLength(body)
    }
  }, (res) => {
    console.log('Status Code:', res.statusCode);
    let resBody = '';
    res.on('data', chunk => resBody += chunk);
    res.on('end', () => {
      console.log('Response:', resBody);
      
      // Clean up dummy file
      try {
        fs.unlinkSync(dummyFilePath);
      } catch (e) {}
    });
  });

  req.on('error', (err) => {
    console.error('Request Error:', err.message);
    try {
      fs.unlinkSync(dummyFilePath);
    } catch (e) {}
  });

  req.write(body);
  req.end();
}

registerPartner();
