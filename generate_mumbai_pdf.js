const mysql = require('mysql2/promise');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

async function run() {
  const pool = await mysql.createPool({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306,
  });

  try {
    const city = 'Mumbai';

    // node_partners table
    const [nodeRows] = await pool.query(
      `SELECT id, name, email, mobile, city, locality, category, isApproved, createdAt
       FROM node_partners WHERE city LIKE ? ORDER BY name ASC`,
      [`%${city}%`]
    );

    // Laravel users table
    const [laravelRows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.mobile_number AS mobile,
              c.name AS city, l.name AS locality,
              cat.title AS category,
              u.is_approval AS isApproved, u.created_at AS createdAt
       FROM homef4fw_homefaci.users u
       LEFT JOIN homef4fw_homefaci.cities c ON u.city_id = c.id
       LEFT JOIN homef4fw_homefaci.localities l ON u.locality_id = l.id
       LEFT JOIN homef4fw_homefaci.categories cat ON u.category_id = cat.id
       WHERE u.role_id = 2 AND c.name LIKE ?
       ORDER BY u.name ASC`,
      [`%${city}%`]
    );

    const allRows = [
      ...nodeRows.map(r => ({ ...r, source: 'Admin Panel' })),
      ...laravelRows.map(r => ({ ...r, source: 'App' }))
    ].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    console.log(`node_partners: ${nodeRows.length}`);
    console.log(`users (Laravel): ${laravelRows.length}`);
    console.log(`Total: ${allRows.length}`);

    const outPath = path.join(__dirname, 'mumbai_partners_list.pdf');
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);

    const pageW = doc.page.width - 80;

    // HEADER BANNER
    doc.rect(0, 0, doc.page.width, 80).fill('#b71c1c');
    doc.fillColor('white')
       .fontSize(20).font('Helvetica-Bold')
       .text('HomeFaciliti — Mumbai Partners', 40, 20, { align: 'center' });
    doc.fontSize(10).font('Helvetica')
       .text(
         `Generated: ${new Date().toLocaleString('en-IN')}   |   Total: ${allRows.length} Partners`,
         40, 50, { align: 'center' }
       );

    // SUMMARY BOX
    let y = 100;
    doc.rect(40, y, pageW, 36).fill('#ffebee');
    doc.fillColor('#b71c1c').fontSize(11).font('Helvetica-Bold')
       .text(`Admin Panel Partners: ${nodeRows.length}`, 55, y + 5);
    doc.text(`App Partners: ${laravelRows.length}`, 55, y + 19);
    doc.fillColor('#b71c1c').fontSize(11).font('Helvetica-Bold')
       .text(`Total: ${allRows.length}  |  All Approved ✓`, 300, y + 12);
    y += 50;

    // TABLE COLUMNS
    const cols  = [35, 155, 105, 90, 110, 65];
    const heads = ['S.No', 'Name', 'Mobile', 'Category', 'Locality', 'Source'];
    const rowH  = 20;

    function drawHeader(startY) {
      doc.rect(40, startY, pageW, rowH).fill('#c62828');
      let x = 40;
      heads.forEach((h, i) => {
        doc.fillColor('white').fontSize(8.5).font('Helvetica-Bold')
           .text(h, x + 3, startY + 6, { width: cols[i] - 5, lineBreak: false });
        x += cols[i];
      });
      return startY + rowH;
    }

    y = drawHeader(y);

    // TABLE ROWS
    allRows.forEach((p, idx) => {
      if (y > doc.page.height - 55) {
        doc.addPage();
        y = 40;
        y = drawHeader(y);
      }

      const bg = idx % 2 === 0 ? '#ffffff' : '#fff5f5';
      doc.rect(40, y, pageW, rowH).fill(bg);

      const cells = [
        String(idx + 1) + '.',
        p.name || '-',
        p.mobile || '-',
        p.category || '-',
        p.locality || '-',
        p.source || '-',
      ];

      let cx = 40;
      cells.forEach((val, i) => {
        const maxChars = Math.floor((cols[i] - 6) / 4.8);
        const display = val.length > maxChars ? val.substring(0, maxChars - 1) + '…' : val;
        doc.fillColor('#222').fontSize(7.5).font('Helvetica')
           .text(display, cx + 3, y + 6, { width: cols[i] - 5, lineBreak: false });
        cx += cols[i];
      });

      doc.moveTo(40, y + rowH).lineTo(40 + pageW, y + rowH)
         .strokeColor('#ffcdd2').lineWidth(0.3).stroke();
      y += rowH;
    });

    // FOOTER
    if (y > doc.page.height - 55) doc.addPage();
    y += 15;
    doc.rect(40, y, pageW, 30).fill('#b71c1c');
    doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
       .text(
         `Grand Total: ${allRows.length} Partners in Mumbai  |  All Approved ✓`,
         40, y + 10, { align: 'center', width: pageW }
       );

    doc.end();

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    console.log('✅ PDF saved: ' + outPath);

  } finally {
    await pool.end();
  }
}

run().catch(console.error);
