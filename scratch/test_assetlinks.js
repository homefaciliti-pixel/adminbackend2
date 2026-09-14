const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body.substring(0, 500)
        });
      });
    }).on('error', (err) => {
      resolve({ error: err.message });
    });
  });
}

async function run() {
  const r1 = await checkUrl('https://partner-backend-2.onrender.com/.well-known/assetlinks.json');
  console.log('--- partner-backend-2.onrender.com /.well-known/assetlinks.json ---');
  console.log('Status:', r1.statusCode);
  console.log('Body:', r1.body);

  const r2 = await checkUrl('https://homefaciliti.in/.well-known/assetlinks.json');
  console.log('--- homefaciliti.in /.well-known/assetlinks.json ---');
  console.log('Status:', r2.statusCode);
  console.log('Body:', r2.body);
  
  const r3 = await checkUrl('https://homefaciliti.com/.well-known/assetlinks.json');
  console.log('--- homefaciliti.com /.well-known/assetlinks.json ---');
  console.log('Status:', r3.statusCode);
  console.log('Body:', r3.body);
}

run();
