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
    } else if (file.endsWith('.dart')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('CheckoutViewModel')) {
        console.log(`Found "CheckoutViewModel" in: ${fullPath}`);
        // Print matching lines
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('CheckoutViewModel')) {
            console.log(`  L${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

const dir = 'D:\\userapp\\lib';
console.log(`Walking ${dir}...`);
try {
  walk(dir);
} catch (err) {
  console.error(err);
}
