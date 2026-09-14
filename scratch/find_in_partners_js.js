const fs = require('fs');
const lines = fs.readFileSync('routes/partners.js', 'utf8').split('\n');

lines.forEach((line, index) => {
  if (line.includes('checkout-api')) {
    console.log(`L${index + 1}: ${line.trim()}`);
  }
});
