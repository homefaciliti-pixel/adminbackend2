const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, '..', '..', 'build', 'web', 'main.dart.js');

if (!fs.existsSync(jsPath)) {
  console.error(`❌ File not found: ${jsPath}`);
  process.exit(1);
}

let content = fs.readFileSync(jsPath, 'utf8');

// 1. Inject resolveUrl function at the top if not present
const helperFunc = 'window.resolveUrl=function(u){return (window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1")?u.replace("https://adminbackend-1-h03r.onrender.com","http://localhost:3000"):u;};';

if (!content.includes('window.resolveUrl=')) {
  content = helperFunc + content;
  console.log('✅ Injected helper function at the top of main.dart.js');
}

// 2. Replace all occurrences inside double quotes: "https://adminbackend-1-h03r.onrender.com/..."
const doubleQuoteRegex = /"(https:\/\/adminbackend-1-h03r\.onrender\.com\/[^"]*)"/g;
let doubleQuoteMatches = 0;
content = content.replace(doubleQuoteRegex, (match, url) => {
  doubleQuoteMatches++;
  return `window.resolveUrl("${url}")`;
});

// 3. Replace all occurrences inside single quotes: 'https://adminbackend-1-h03r.onrender.com/...'
const singleQuoteRegex = /'(https:\/\/adminbackend-1-h03r\.onrender\.com\/[^']*)'/g;
let singleQuoteMatches = 0;
content = content.replace(singleQuoteRegex, (match, url) => {
  singleQuoteMatches++;
  return `window.resolveUrl("${url}")`;
});

console.log(`Replaced in double quotes: ${doubleQuoteMatches} times`);
console.log(`Replaced in single quotes: ${singleQuoteMatches} times`);

if (doubleQuoteMatches > 0 || singleQuoteMatches > 0) {
  fs.writeFileSync(jsPath, content, 'utf8');
  console.log('✅ main.dart.js patched and saved successfully!');
} else {
  console.log('⚠️ No replacements made.');
}
