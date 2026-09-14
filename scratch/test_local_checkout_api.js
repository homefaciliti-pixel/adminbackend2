const http = require('http');

// Start server locally on port 3001
process.env.PORT = '3001';
const server = require('../server');

setTimeout(async () => {
  console.log('\n--- LOCAL TEST ---');
  const urls = [
    'http://localhost:3001/api/checkout-api/9653853414?productId=professional%20Plumber',
    'http://localhost:3001/api/partners/checkout-api/9653853414?productId=professional%20Plumber'
  ];

  for (const url of urls) {
    console.log(`\nTesting local: ${url}`);
    try {
      const res = await fetch(url);
      console.log(`Status: ${res.status}`);
      const text = await res.text();
      console.log(`Body snippet: ${text.substring(0, 300)}`);
    } catch (err) {
      console.error('Error:', err.message);
    }
  }

  process.exit(0);
}, 2000);
