const fs = require('fs');

try {
  const filePath = 'D:\\userapp\\lib\\view\\home\\servicesdetail screen\\services_detail_screen.dart';
  const content = fs.readFileSync(filePath, 'utf8');
  console.log('Successfully read services_detail_screen.dart. Length:', content.length);
  
  // Find CheckoutScreen navigation
  const idx = content.indexOf('CheckoutScreen');
  if (idx !== -1) {
    console.log('Found CheckoutScreen navigation:');
    console.log(content.substring(idx - 1000, idx + 1000));
  } else {
    console.log('CheckoutScreen navigation not found!');
  }
} catch (err) {
  console.error(err);
}
