const db = require('../db');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    // Querying all partners where isApproved is 0 or NULL
    const [rows] = await db.query('SELECT id, name, mobile, email, category, isPaid, isApproved, status, createdAt FROM partners WHERE isApproved = 0 OR isApproved IS NULL');
    
    console.log(`Found ${rows.length} unapproved partners.`);
    
    let fileContent = `======================================================================\n`;
    fileContent += `UNAPPROVED PARTNERS LIST\n`;
    fileContent += `Generated on: ${new Date().toLocaleString()}\n`;
    fileContent += `Total Unapproved Partners: ${rows.length}\n`;
    fileContent += `======================================================================\n\n`;
    
    rows.forEach((r, index) => {
      fileContent += `${index + 1}. ID: ${r.id}\n`;
      fileContent += `   Name: ${r.name || 'N/A'}\n`;
      fileContent += `   Mobile: ${r.mobile || 'N/A'}\n`;
      fileContent += `   Email: ${r.email || 'N/A'}\n`;
      fileContent += `   Category: ${r.category || 'N/A'}\n`;
      fileContent += `   Paid Status (isPaid): ${r.isPaid}\n`;
      fileContent += `   Approved Status (isApproved): ${r.isApproved}\n`;
      fileContent += `   Status: ${r.status}\n`;
      fileContent += `   Created At: ${r.createdAt || 'N/A'}\n`;
      fileContent += `----------------------------------------------------------------------\n`;
    });
    
    const outputPath = path.join(__dirname, '..', '..', 'unapproved_partners.txt');
    fs.writeFileSync(outputPath, fileContent, 'utf-8');
    
    console.log(`Successfully saved the list to ${outputPath}`);
    process.exit(0);
  } catch (err) {
    console.error('Error fetching unapproved partners:', err);
    process.exit(1);
  }
}

main();
