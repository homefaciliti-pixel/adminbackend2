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
          if (file !== 'node_modules' && file !== '.git' && file !== 'build' && file !== '.dart_tool') {
            searchFolder(fullPath);
          }
        } else if (file.endsWith('.dart')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('bookings') || content.includes('/api/')) {
            console.log(`FOUND in: ${fullPath}`);
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
              if (line.includes('bookings') || line.includes('status') || line.includes('/api/')) {
                if (line.includes('http') || line.includes('get') || line.includes('post') || line.includes('api') || line.includes('status')) {
                  console.log(`  L${idx + 1}: ${line.trim()}`);
                }
              }
            });
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
}

console.log('Searching: D:\\hf_partner\\lib...');
searchFolder('D:\\hf_partner\\lib');
console.log('Search finished.');
