const fs = require('fs');

try {
  const filePath = 'D:\\HomeFaciliti_Source Code\\Backend_Code_DB\\Backend 2\\app\\Http\\Controllers\\Api\\OrderController.php';
  const content = fs.readFileSync(filePath, 'utf8');
  console.log('Successfully read OrderController.php. Length:', content.length);
  
  // Find the checkout function
  const checkoutIndex = content.indexOf('public function checkout');
  if (checkoutIndex !== -1) {
    console.log('Found checkout function. Code snippet:');
    console.log(content.substring(checkoutIndex, checkoutIndex + 3000));
  } else {
    console.log('checkout function not found! Let\'s print method names:');
    const matches = content.match(/public function \w+/g);
    console.log(matches);
  }

} catch (err) {
  console.error(err);
}
