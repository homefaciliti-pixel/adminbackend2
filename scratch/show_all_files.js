const fs = require('fs');

try {
  const files = fs.readdirSync('D:\\HomeFaciliti_Source Code\\Mobile_App_Code\\homefaciliti-vendor-final-master\\homefaciliti-vendor-final-master');
  console.log('Files in homefaciliti-vendor-final-master/homefaciliti-vendor-final-master:', files);
} catch (err) {
  console.error(err);
}
