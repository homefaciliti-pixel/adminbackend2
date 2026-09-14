const https = require('https');

function checkLiveAssetlinks() {
  const url = 'https://partner-backend-2.onrender.com/.well-known/assetlinks.json';
  console.log('Fetching live assetlinks from:', url);

  https.get(url, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('Status Code:', res.statusCode);
      console.log('Body:', body);
    });
  }).on('error', (err) => {
    console.error('Request Error:', err.message);
  });
}

// Wait 5 seconds for Render to deploy before fetching
console.log('Waiting 5 seconds for Render deploy...');
setTimeout(checkLiveAssetlinks, 5000);
