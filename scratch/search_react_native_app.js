const fs = require('fs');
const path = require('path');

function searchDir(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        searchDir(fullPath, query);
      }
    } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes(query.toLowerCase())) {
        console.log(`Found "${query}" in: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(query.toLowerCase())) {
            console.log(`  L${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

const srcDir = 'D:\\HomeFaciliti_Source Code\\Mobile_App_Code\\homefaciliti-vendor-final-master\\homefaciliti-vendor-final-master\\src';
console.log(`Searching in ${srcDir}...`);
try {
  searchDir(srcDir, 'accepted');
  searchDir(srcDir, '/bookings');
} catch (err) {
  console.error(err);
}
