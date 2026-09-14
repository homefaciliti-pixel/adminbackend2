const fs = require('fs');

try {
  const filePath = 'D:\\HomeFaciliti_Source Code\\Backend_Code_DB\\Backend 2\\app\\Http\\Controllers\\Api\\CartController.php';
  const content = fs.readFileSync(filePath, 'utf8');
  console.log('Successfully read CartController.php. Length:', content.length);
  console.log(content);
} catch (err) {
  console.error(err);
}
