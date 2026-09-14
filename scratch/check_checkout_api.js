const { execSync } = require('child_process');

const files = [
  'backend/routes/partners.js',
  'backend/routes/partner.js',
  'backend/routes/orders.js',
  'backend/routes/users.js',
  'backend/server.js'
];

for (const file of files) {
  try {
    const content = execSync(`git show partner/main:${file}`, { encoding: 'utf8' });
    console.log(`Checking ${file} in partner/main...`);
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('/checkout') && !line.includes('/checkout-api')) {
        console.log(`  L${idx + 1}: ${line.trim()}`);
      }
    });
  } catch (e) {
    console.error(`Error checking ${file}: ${e.message}`);
  }
}
