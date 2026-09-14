const fs = require('fs');
const path = require('path');

function search(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (file !== 'node_modules' && file !== '.git' && file !== 'build' && file !== '.dart_tool') {
            search(fullPath);
          }
        } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.dart')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('bookings') || content.includes('/api/') || content.includes('orders')) {
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
              if (line.includes('http') || line.includes('fetch') || line.includes('axios') || line.includes('api') || line.includes('/bookings')) {
                console.log(`${fullPath}:L${idx + 1}: ${line.trim()}`);
              }
            });
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
}

console.log('Searching Mobile_App_Code...');
search('D:\\HomeFaciliti_Source Code\\Mobile_App_Code');
console.log('Search finished.');
