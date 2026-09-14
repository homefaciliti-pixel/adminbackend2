const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, '..', '..', 'build', 'web', 'main.dart.js');

if (!fs.existsSync(jsPath)) {
  console.error('File not found');
  process.exit(1);
}

const content = fs.readFileSync(jsPath, 'utf8');

// Find index of 'onrender'
let idx = -1;
let count = 0;
while ((idx = content.indexOf('onrender.com', idx + 1)) !== -1) {
  count++;
  console.log(`Match ${count} at index ${idx}:`);
  const start = Math.max(0, idx - 100);
  const end = Math.min(content.length, idx + 100);
  console.log(`   Snippet: ${content.substring(start, end)}\n`);
}

if (count === 0) {
  console.log('No matches for "onrender.com" found in main.dart.js');
}
