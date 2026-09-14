const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, '..', '..', 'build', 'web', 'main.dart.js');

if (!fs.existsSync(jsPath)) {
  console.error(`❌ File not found: ${jsPath}`);
  process.exit(1);
}

let content = fs.readFileSync(jsPath, 'utf8');

// Count occurrences first
const targetApi1 = '"https://adminbackend-1-h03r.onrender.com/api"';
const targetApi2 = "'https://adminbackend-1-h03r.onrender.com/api'";
const targetUploads1 = '"https://adminbackend-1-h03r.onrender.com/uploads"';
const targetUploads2 = "'https://adminbackend-1-h03r.onrender.com/uploads'";

let countApi = 0;
let countUploads = 0;

// Dynamic expressions to replace the string literals
const replacementApi = '(window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"?"http://localhost:3000/api":"https://adminbackend-1-h03r.onrender.com/api")';
const replacementUploads = '(window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"?"http://localhost:3000/uploads":"https://adminbackend-1-h03r.onrender.com/uploads")';

// Replace API URLs
if (content.includes(targetApi1)) {
  const parts = content.split(targetApi1);
  countApi += parts.length - 1;
  content = parts.join(replacementApi);
}
if (content.includes(targetApi2)) {
  const parts = content.split(targetApi2);
  countApi += parts.length - 1;
  content = parts.join(replacementApi);
}

// Replace Uploads URLs
if (content.includes(targetUploads1)) {
  const parts = content.split(targetUploads1);
  countUploads += parts.length - 1;
  content = parts.join(replacementUploads);
}
if (content.includes(targetUploads2)) {
  const parts = content.split(targetUploads2);
  countUploads += parts.length - 1;
  content = parts.join(replacementUploads);
}

// Also search for general occurrences without quotes just to log
console.log(`Found and replaced API URLs: ${countApi} time(s)`);
console.log(`Found and replaced Uploads URLs: ${countUploads} time(s)`);

if (countApi > 0 || countUploads > 0) {
  fs.writeFileSync(jsPath, content, 'utf8');
  console.log('✅ main.dart.js patched successfully!');
} else {
  console.log('⚠️ No URLs found to patch in main.dart.js.');
}
