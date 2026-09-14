const fs = require('fs');
const path = require('path');

function search(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file !== '.git') {
          search(fullPath);
        }
      } else if (file.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('/checkout') && !fullPath.includes('scratch')) {
          console.log(`Found '/checkout' in file: ${fullPath}`);
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.includes('/checkout')) {
              console.log(`  L${idx + 1}: ${line.trim()}`);
            }
          });
        }
      }
    } catch (e) {}
  }
}

search('.');
