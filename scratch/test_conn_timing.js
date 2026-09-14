const https = require('https');
const http = require('http');

function test(urlStr) {
  return new Promise(resolve => {
    const url = new URL(urlStr);
    const protocol = url.protocol === 'https:' ? https : http;
    const start = Date.now();
    let dnsTime = 0, tcpTime = 0, tlsTime = 0;

    const payload = JSON.stringify({ sql: 'SELECT * FROM node_categories LIMIT 1', params: [] });

    const req = protocol.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': 'humans_21909=1',
        'X-Bridge-Secret': 'HF_SECURE_KEY_2026_x92!',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 10000
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const total = Date.now() - start;
        console.log(`URL: ${urlStr} | Status: ${res.statusCode} | DNS: ${dnsTime}ms | TCP: ${tcpTime}ms | TLS: ${tlsTime}ms | Total: ${total}ms | Length: ${data.length}`);
        resolve();
      });
    });

    req.on('socket', socket => {
      socket.on('lookup', () => { dnsTime = Date.now() - start; });
      socket.on('connect', () => { tcpTime = Date.now() - start; });
      socket.on('secureConnect', () => { tlsTime = Date.now() - start; });
    });

    req.on('error', err => {
      console.log(`URL: ${urlStr} | Error: ${err.message} | Total: ${Date.now() - start}ms`);
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

async function run() {
  await test('http://homefaciliti.com/public/db_bridge.php');
  await test('https://homefaciliti.com/public/db_bridge.php');
}

run();
