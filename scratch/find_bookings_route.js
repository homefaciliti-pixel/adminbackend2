const fs = require('fs');
const content = fs.readFileSync('D:\\HomeFaciliti_Source Code\\Backend_Code_DB\\Backend 2\\app\\Http\\Controllers\\Api\\OrderController.php', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.toLowerCase().includes('checkout')) {
    console.log(`L${index + 1}: ${line.trim()}`);
  }
});
