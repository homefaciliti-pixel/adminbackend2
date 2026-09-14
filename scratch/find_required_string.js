const fs = require('fs');
const path = require('path');

function searchFolder(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (file !== 'node_modules' && file !== '.git' && file !== 'build' && file !== 'dist' && file !== '.dart_tool' && file !== 'ios' && file !== 'android') {
            searchFolder(fullPath);
          }
        } else if (file.endsWith('.js') || file.endsWith('.dart') || file.endsWith('.php')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('productId is required in checkout') || content.includes('productId is required')) {
            console.log(`FOUND in: ${fullPath}`);
          }
        }
      } catch (err) {}
    }
  } catch (err) {}
}

const roots = ['D:\\HomeFaciliti_Source Code'];
for (const root of roots) {
  console.log(`Searching root: ${root}...`);
  searchFolder(root);
}
console.log('Search finished.');
