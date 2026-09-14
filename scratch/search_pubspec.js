const fs = require('fs');
const path = require('path');

function searchForPubspec(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (file !== 'node_modules' && file !== '.git' && file !== 'build' && file !== '.dart_tool' && file !== 'AppData' && file !== 'Windows') {
            searchForPubspec(fullPath);
          }
        } else if (file === 'pubspec.yaml') {
          console.log(`Found pubspec.yaml in: ${fullPath}`);
          const content = fs.readFileSync(fullPath, 'utf8');
          const nameLine = content.split('\n').find(l => l.startsWith('name:'));
          console.log(`  Name: ${nameLine ? nameLine.trim() : 'unknown'}`);
        }
      } catch (e) {}
    }
  } catch (e) {}
}

const roots = ['D:\\', 'C:\\Users\\user\\Desktop', 'C:\\Users\\user\\Documents'];
for (const root of roots) {
  console.log(`Searching for Flutter projects in: ${root}...`);
  searchForPubspec(root);
}
console.log('Search finished.');
