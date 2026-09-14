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
          if (file !== 'node_modules' && file !== '.git' && file !== 'build' && file !== '.dart_tool' && file !== 'backend') {
            search(fullPath);
          }
        } else if (file.endsWith('.dart')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('/assign') || content.includes('assign') || content.includes('vendorName') || content.includes('partnerName')) {
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
              if (line.includes('assign') || line.includes('put(') || line.includes('http') || line.includes('vendorName') || line.includes('partnerName')) {
                console.log(`${fullPath}:L${idx + 1}: ${line.trim()}`);
              }
            });
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
}

search('d:\\admin_panel\\lib');
