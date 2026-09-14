const fs = require('fs');
const path = require('path');

function searchFile(dir, fileName) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      let stat;
      try {
        stat = fs.statSync(fullPath);
      } catch (e) {
        continue;
      }
      if (stat && stat.isDirectory()) {
        // Exclude system/hidden dirs or node_modules / build / .git
        if (file === 'node_modules' || file === 'build' || file === '.git' || file === '.dart_tool' || file.startsWith('.') || file === 'System Volume Information' || file === '$RECYCLE.BIN') {
          continue;
        }
        results = results.concat(searchFile(fullPath, fileName));
      } else if (file === fileName) {
        results.push({ path: fullPath, size: stat.size, mtime: stat.mtime });
      }
    }
  } catch (e) {
    // Ignore permission errors
  }
  return results;
}

const drive = 'D:\\';
console.log(`Searching entire D:\\ drive for pending_partner_screen.dart...`);
const matches = searchFile(drive, 'pending_partner_screen.dart');
console.log('Matches found:');
matches.forEach(m => console.log(`- Path: ${m.path}, Size: ${m.size} bytes, Modified: ${m.mtime}`));
