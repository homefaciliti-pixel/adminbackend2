const fs = require('fs');
const path = require('path');

const libDir = path.join(__dirname, '..', '..', 'lib');
const apiConfigPath = path.join(libDir, 'service_Api', 'api_config.dart');

function getRelativeImport(filePath) {
  const relativePath = path.relative(path.dirname(filePath), apiConfigPath);
  // Convert Windows backslashes to forward slashes for Dart import
  return relativePath.replace(/\\/g, '/');
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let modified = false;

  // 1. Replace hardcoded /api/ uploads / base URLs
  // Check for https://adminbackend-1-h03r.onrender.com/api/
  const apiRegex = /["']https:\/\/adminbackend-1-h03r\.onrender\.com\/api([^"']*)["']/g;
  if (apiRegex.test(content)) {
    content = content.replace(apiRegex, (match, suffix) => {
      modified = true;
      return `"\${ApiConfig.baseUrl}${suffix}"`;
    });
  }

  // Check for https://adminbackend-1-h03r.onrender.com/api (without trailing slash)
  const apiRegexNoSlash = /["']https:\/\/adminbackend-1-h03r\.onrender\.com\/api["']/g;
  if (apiRegexNoSlash.test(content)) {
    content = content.replace(apiRegexNoSlash, () => {
      modified = true;
      return `ApiConfig.baseUrl`;
    });
  }

  // Check for https://adminbackend-1-h03r.onrender.com/uploads/
  const uploadsRegex = /["']https:\/\/adminbackend-1-h03r\.onrender\.com\/uploads([^"']*)["']/g;
  if (uploadsRegex.test(content)) {
    content = content.replace(uploadsRegex, (match, suffix) => {
      modified = true;
      return `"\${ApiConfig.uploadsUrl}${suffix}"`;
    });
  }

  // Check for https://adminbackend-1-h03r.onrender.com/uploads (without trailing slash)
  const uploadsRegexNoSlash = /["']https:\/\/adminbackend-1-h03r\.onrender\.com\/uploads["']/g;
  if (uploadsRegexNoSlash.test(content)) {
    content = content.replace(uploadsRegexNoSlash, () => {
      modified = true;
      return `ApiConfig.uploadsUrl`;
    });
  }

  if (modified) {
    // 2. Add import statement if not present
    const importPath = getRelativeImport(filePath);
    const importStmt = `import '${importPath}';`;
    if (!content.includes(importStmt) && !content.includes('api_config.dart')) {
      // Find the first import statement and insert before it, or just insert at top
      const firstImportIdx = content.indexOf('import ');
      if (firstImportIdx !== -1) {
        content = content.slice(0, firstImportIdx) + importStmt + '\n' + content.slice(firstImportIdx);
      } else {
        content = importStmt + '\n' + content;
      }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Modified: ${path.relative(libDir, filePath)}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith('.dart') && filePath !== apiConfigPath) {
      processFile(filePath);
    }
  }
}

console.log('Starting URL refactoring in lib/ ...');
walkDir(libDir);
console.log('Refactoring finished!');
