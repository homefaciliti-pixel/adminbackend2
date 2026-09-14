const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        walk(fullPath);
      }
    } else if (file.endsWith('.js') || file.endsWith('.json')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('checkout') || content.includes('orders_v2') || content.includes('createOrder') || content.includes('order')) {
        console.log(`Found references in: ${fullPath}`);
      }
    }
  }
}

const dir = 'D:\\HomeFaciliti_Source Code\\Backend_Code_DB\\Backend';
console.log(`Walking ${dir}...`);
try {
  walk(dir);
} catch (err) {
  console.error(err);
}
