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
        } else if (file.endsWith('.dart') || file.endsWith('.kt') || file.endsWith('.java') || file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('/bookings') || content.includes('/api/bookings')) {
            console.log(`FOUND IN FILE: ${fullPath}`);
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
              if (line.includes('bookings') || line.includes('status')) {
                console.log(`  L${idx + 1}: ${line.trim()}`);
              }
            });
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
}

search('D:\\admin_panel\\lib');
