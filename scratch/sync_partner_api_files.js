const fs = require('fs');
const path = require('path');

function copyFileIfExists(src, dest) {
  try {
    const parentDir = path.dirname(dest);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log(`Copied: ${src} -> ${dest}`);
  } catch (err) {
    console.error(`Error copying ${src} -> ${dest}:`, err.message);
  }
}

async function main() {
  const sourcePartnerApi = path.join('D:', 'admin_panel', 'backend', 'partner_api.txt');
  const sourceApiList = path.join('D:', 'admin_panel', 'backend', 'backend', 'api_list.txt');

  const destsPartnerApi = [
    path.join('D:', 'admin_panel', 'backend', 'backend', 'partner_api.txt'),
    path.join('E:', 'hf_partner', 'admin_panel', 'backend', 'partner_api.txt'),
    path.join('E:', 'hf_partner', 'admin_panel', 'backend', 'backend', 'partner_api.txt')
  ];

  const destsApiList = [
    path.join('E:', 'hf_partner', 'admin_panel', 'backend', 'backend', 'api_list.txt')
  ];

  console.log('Starting sync of partner_api.txt...');
  destsPartnerApi.forEach(dest => copyFileIfExists(sourcePartnerApi, dest));

  console.log('\nStarting sync of api_list.txt...');
  destsApiList.forEach(dest => copyFileIfExists(sourceApiList, dest));

  console.log('\nSync completed!');
  process.exit(0);
}

main();
