const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        walk(fullPath);
      }
    } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('http') || content.includes('api') || content.includes('axios') || content.includes('fetch')) {
        console.log(`Found communication references in: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('http') || line.includes('api') || line.includes('axios') || line.includes('fetch') || line.includes('baseUrl') || line.includes('BASE_URL')) {
            console.log(`  L${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

const srcDir = 'D:\\HomeFaciliti_Source Code\\Mobile_App_Code\\homefaciliti-vendor-final-master\\homefaciliti-vendor-final-master';
console.log(`Walking ${srcDir}...`);
try {
  walk(srcDir);
} catch (err) {
  console.error(err);
}
