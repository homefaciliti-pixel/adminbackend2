const fs = require('fs');

try {
  const filePath = 'D:\\userapp\\lib\\view\\home\\servicesdetail screen\\services_detail_screen.dart';
  const content = fs.readFileSync(filePath, 'utf8');
  
  const idx = content.indexOf('AddressScreen');
  if (idx !== -1) {
    console.log(content.substring(idx - 1500, idx + 500));
  }
} catch (err) {
  console.error(err);
}
