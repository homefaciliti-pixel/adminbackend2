const https = require('https');

https.get('https://partner-backend-2.onrender.com/api/settings/version', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Body:', body);
  });
});
