const db = require('../db');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    console.log("Querying database for pending approval partners...");
    const [rows] = await db.query(`
      SELECT 
        id, name, email, mobile, countryCode, city, state, locality, address, 
        gender, experience, services, category, subCategory, 
        aadhaarNumber, panNumber, bankName, accountNumber, ifscCode, accountHolder,
        isPaid, hasVehicle, walletBalance, totalEarnings, referral_code, referredBy, createdAt
      FROM partners 
      WHERE isApproved = 0 OR isApproved IS NULL
      ORDER BY createdAt DESC
    `);
    
    console.log(`Found ${rows.length} partners pending approval.`);
    if (rows.length === 0) {
      console.log("No partners pending approval found.");
      process.exit(0);
    }

    // Map rows to a cleaner format
    const formattedData = rows.map(r => ({
      "Partner ID": r.id,
      "Name": r.name || '',
      "Phone": `${r.countryCode || '+91'}${r.mobile}`,
      "Email": r.email || '',
      "Category": r.category || '',
      "Sub Category": r.subCategory || '',
      "Services": r.services || '',
      "Experience": r.experience || '',
      "Gender": r.gender || '',
      "City": r.city || '',
      "State": r.state || '',
      "Locality": r.locality || '',
      "Address": r.address || '',
      "Has Vehicle": r.hasVehicle === 1 ? 'Yes' : 'No',
      "Paid Registration": r.isPaid === 1 ? 'Paid' : 'Unpaid',
      "Aadhaar Number": r.aadhaarNumber || '',
      "PAN Number": r.panNumber || '',
      "Bank Name": r.bankName || '',
      "Account Holder": r.accountHolder || '',
      "Account Number": r.accountNumber || '',
      "IFSC Code": r.ifscCode || '',
      "Wallet Balance": r.walletBalance || 0,
      "Total Earnings": r.totalEarnings || 0,
      "Referral Code": r.referral_code || '',
      "Referred By": r.referredBy || '',
      "Registered Date": r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : ''
    }));

    const desktopDir = 'C:\\Users\\user\\Desktop';
    const csvPath = path.join(desktopDir, 'unapproved_partners.csv');
    const xlsxPath = path.join(desktopDir, 'unapproved_partners.xlsx');

    // 1. Write CSV with UTF-8 BOM so Excel opens it correctly with formatting
    console.log("Generating CSV...");
    const headers = Object.keys(formattedData[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of formattedData) {
      const values = headers.map(header => {
        let val = row[header];
        if (val === null || val === undefined) {
          val = '';
        }
        val = String(val).replace(/"/g, '""'); // Escape quotes
        return `"${val}"`;
      });
      csvRows.push(values.join(','));
    }
    
    // Write CSV with BOM
    const csvContent = '\ufeff' + csvRows.join('\n');
    fs.writeFileSync(csvPath, csvContent, 'utf8');
    console.log(`✅ CSV file saved to: ${csvPath}`);

    // 2. Write XLSX using xlsx library
    console.log("Generating XLSX...");
    try {
      const XLSX = require('xlsx');
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      
      // Auto-adjust column widths
      const maxLens = {};
      formattedData.forEach(row => {
        Object.keys(row).forEach(key => {
          const val = String(row[key] || '');
          maxLens[key] = Math.max(maxLens[key] || key.length, val.length);
        });
      });
      const colWidths = Object.keys(maxLens).map(key => ({ wch: maxLens[key] + 3 }));
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Pending Approval');
      XLSX.writeFile(workbook, xlsxPath);
      console.log(`✅ XLSX file saved to: ${xlsxPath}`);
    } catch (xlsxErr) {
      console.warn("⚠️ xlsx library not available or error occurred. Excel file (.xlsx) generation skipped.", xlsxErr.message);
    }
    
    console.log("Export complete!");
  } catch (error) {
    console.error("Error exporting partners:", error);
  } finally {
    process.exit(0);
  }
}

main();
