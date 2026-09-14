const fs = require('fs');
const content = fs.readFileSync('routes/partner.js', 'utf8');

console.log('Searching for checkout-api...');
let idx = content.indexOf('checkout-api');
if (idx !== -1) {
  console.log('Found it at index:', idx);
  console.log(content.substring(idx - 100, idx + 500));
} else {
  console.log('Not found by direct indexOf!');
  // Let's search with regex
  const regex = /checkout/i;
  let match;
  while ((match = regex.exec(content)) !== null) {
    console.log(`Found "checkout" at index ${match.index}:`);
    console.log(content.substring(match.index - 50, match.index + 150));
    content = content.substring(match.index + 1); // move forward
  }
}
