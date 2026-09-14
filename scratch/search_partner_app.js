const fs = require('fs');
const path = require('path');

function findDartFiles(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (file !== 'node_modules' && file !== '.git' && file !== 'build' && file !== '.dart_tool') {
            findDartFiles(fullPath);
          }
        } else if (file.endsWith('.dart')) {
          if (fullPath.toLowerCase().includes('partner') || fullPath.toLowerCase().includes('booking') || fullPath.toLowerCase().includes('order')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('/bookings') || content.includes('status=')) {
              console.log(`Found in: ${fullPath}`);
              const lines = content.split('\n');
              lines.forEach((line, idx) => {
                if (line.includes('/bookings') || line.includes('status=')) {
                  console.log(`  L${idx + 1}: ${line.trim()}`);
                }
              });
            }
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
}

const roots = ['D:\\hf_partner', 'D:\\admin_panel', 'D:\\HomeFaciliti_Source Code', 'D:\\new_mobile_code'];
for (const root of roots) {
  console.log(`Searching root: ${root}...`);
  findDartFiles(root);
}
console.log('Search finished.');
