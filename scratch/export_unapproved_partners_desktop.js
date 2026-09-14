const db = require('../db');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    const [rows] = await db.query('SELECT id, name, mobile, email, category, isPaid, isApproved, status, createdAt FROM partners WHERE isApproved = 0 OR isApproved IS NULL');
    
    console.log(`Found ${rows.length} unapproved partners.`);
    
    const desktopDir = 'C:\\Users\\user\\Desktop';
    const txtPath = path.join(desktopDir, 'unapproved_partners.txt');
    const csvPath = path.join(desktopDir, 'unapproved_partners.csv');
    
    // 1. Generate TXT Content
    let txtContent = `======================================================================\n`;
    txtContent += `UNAPPROVED PARTNERS LIST\n`;
    txtContent += `Generated on: ${new Date().toLocaleString()}\n`;
    txtContent += `Total Unapproved Partners: ${rows.length}\n`;
    txtContent += `======================================================================\n\n`;
    
    rows.forEach((r, index) => {
      txtContent += `${index + 1}. ID: ${r.id}\n`;
      txtContent += `   Name: ${r.name || 'N/A'}\n`;
      txtContent += `   Mobile: ${r.mobile || 'N/A'}\n`;
      txtContent += `   Email: ${r.email || 'N/A'}\n`;
      txtContent += `   Category: ${r.category || 'N/A'}\n`;
      txtContent += `   Paid Status (isPaid): ${r.isPaid}\n`;
      txtContent += `   Approved Status (isApproved): ${r.isApproved}\n`;
      txtContent += `   Status: ${r.status}\n`;
      txtContent += `   Created At: ${r.createdAt || 'N/A'}\n`;
      txtContent += `----------------------------------------------------------------------\n`;
    });
    
    fs.writeFileSync(txtPath, txtContent, 'utf-8');
    console.log(`Saved TXT to: ${txtPath}`);
    
    // 2. Generate CSV Content (for Excel)
    // Helper to escape CSV fields
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        str = '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };
    
    let csvContent = '\ufeff'; // UTF-8 BOM so Excel opens it with correct encoding
    const headers = ['S.No.', 'ID', 'Name', 'Mobile', 'Email', 'Category', 'Paid Status (isPaid)', 'Approved Status (isApproved)', 'Status', 'Created At'];
    csvContent += headers.map(escapeCSV).join(',') + '\n';
    
    rows.forEach((r, index) => {
      const rowData = [
        index + 1,
        r.id,
        r.name || 'N/A',
        r.mobile || 'N/A',
        r.email || 'N/A',
        r.category || 'N/A',
        r.isPaid,
        r.isApproved,
        r.status,
        r.createdAt || 'N/A'
      ];
      csvContent += rowData.map(escapeCSV).join(',') + '\n';
    });
    
    fs.writeFileSync(csvPath, csvContent, 'utf-8');
    console.log(`Saved CSV to: ${csvPath}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error exporting files:', err);
    process.exit(1);
  }
}

main();
