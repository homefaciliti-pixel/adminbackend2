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
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.includes('http.') || line.includes('Uri.parse') || line.includes('/bookings')) {
              console.log(`${fullPath}:L${idx + 1}: ${line.trim()}`);
            }
          });
        }
      } catch (e) {}
    }
  } catch (e) {}
}

searchFolder('D:\\hf_partner\\lib');
