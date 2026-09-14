const fs = require('fs');
const path = require('path');

const dir = 'D:\\admin_panel\\backend\\backend\\routes';
const files = fs.readdirSync(dir);
for (const file of files) {
  if (file.endsWith('.js')) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    if (content.toLowerCase().includes('checkout-api') || content.toLowerCase().includes('checkout_api') || content.toLowerCase().includes('checkoutapi')) {
      console.log(`FOUND in: ${file}`);
    }
  }
}
