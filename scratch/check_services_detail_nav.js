const fs = require('fs');

try {
  const filePath = 'D:\\userapp\\lib\\view\\home\\servicesdetail screen\\services_detail_screen.dart';
  const content = fs.readFileSync(filePath, 'utf8');
  console.log('Successfully read services_detail_screen.dart. Length:', content.length);
  
  // Find AddressScreen navigation
  const idx = content.indexOf('AddressScreen');
  if (idx !== -1) {
    console.log('Found AddressScreen navigation:');
    console.log(content.substring(idx - 500, idx + 500));
  } else {
    console.log('AddressScreen navigation not found!');
  }
} catch (err) {
  console.error(err);
}
