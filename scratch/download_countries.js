const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://cdn.jsdelivr.net/npm/country-flag-emoji-json@2.0.0/dist/index.json';
const dest = path.join(__dirname, 'countries_raw.json');

https.get(url, (res) => {
  const chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    const data = JSON.parse(buffer.toString());
    console.log(`Successfully downloaded ${data.length} countries.`);
    fs.writeFileSync(dest, JSON.stringify(data, null, 2));
    console.log(`Saved to ${dest}`);
  });
}).on('error', console.error);
