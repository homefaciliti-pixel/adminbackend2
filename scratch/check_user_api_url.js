const fs = require('fs');

try {
  const content = fs.readFileSync('D:\\HomeFaciliti_Source Code\\Mobile_App_Code\\homefaciliti-user-final-master\\homefaciliti-user-final-master\\src\\api\\ApiInfo.js', 'utf8');
  console.log('User app ApiInfo.js BASE_URL line:');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('BASE_URL') || line.includes('baseUrl')) {
      console.log(`- L${index + 1}: ${line.trim()}`);
    }
  });
} catch (err) {
  console.error(err);
}
