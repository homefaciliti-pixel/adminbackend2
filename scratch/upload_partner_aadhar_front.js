const db = require('../db');
const { saveFileToDb } = require('../filePersistence');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    const mobile = '9868605551';
    
    // 1. Verify partner exists
    const [partners] = await db.query('SELECT * FROM partners WHERE mobile = ?', [mobile]);
    if (partners.length === 0) {
      console.error(`Error: No partner found with mobile number ${mobile}`);
      process.exit(1);
    }
    const partner = partners[0];
    console.log(`Found partner: ${partner.name} (ID: ${partner.id}, Mobile: ${partner.mobile})`);
    
    // 2. Define source and destination paths
    const srcPath = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\4533860b-0498-4962-9458-418a4aa0e258\\media__1784179632769.jpg';
    
    if (!fs.existsSync(srcPath)) {
      console.error(`Error: Source image not found at ${srcPath}`);
      process.exit(1);
    }
    
    const timestamp = Date.now();
    const destFileName = `aadharFront-9868605551-${timestamp}.jpg`;
    const destPath = path.join(__dirname, '..', 'uploads', destFileName);
    
    // Ensure uploads directory exists
    const uploadsDir = path.dirname(destPath);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // 3. Copy file to local uploads directory
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied file to local uploads: ${destPath}`);
    
    // 4. Save to Database (uploaded_files table)
    await saveFileToDb(destFileName, destPath, 'image/jpeg');
    
    // 5. Update partner aadharFront in partners table
    await db.query('UPDATE partners SET aadharFront = ? WHERE id = ?', [destFileName, partner.id]);
    console.log(`Successfully updated partner aadharFront image in database to ${destFileName}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error during execution:', err);
    process.exit(1);
  }
}

main();
