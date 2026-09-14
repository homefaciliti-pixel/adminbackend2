const fs = require('fs');
const path = require('path');

function searchDir(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath, query);
    } else if (file.endsWith('.dart')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes(query.toLowerCase())) {
        console.log(`Found "${query}" in: ${fullPath}`);
        // Print the matching lines
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

const libDir = 'D:\\HomeFaciliti_Source Code\\Mobile_App_Code\\homefaciliti-vendor-final-master\\homefaciliti-vendor-final-master\\lib';
console.log(`Searching in ${libDir}...`);
try {
  searchDir(libDir, 'http');
  searchDir(libDir, '/bookings');
} catch (err) {
  console.error(err);
}
