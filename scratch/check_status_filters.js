const fs = require('fs');

function searchFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('/bookings') || line.includes('filterStatus') || line.includes('req.query.status')) {
      console.log(`${filePath}:L${idx + 1}: ${line.trim()}`);
    }
  });
}

searchFile('routes/partner.js');
searchFile('routes/partners.js');
