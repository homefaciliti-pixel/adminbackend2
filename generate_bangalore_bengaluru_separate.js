const mysql = require('mysql2/promise');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

async function generatePDF(allRows, title, color, lightColor, filename) {
  const outPath = path.join(__dirname, filename);
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  const pageW = doc.page.width - 80;
  const cols  = [35, 155, 105, 90, 110, 65];
  const heads = ['S.No', 'Name', 'Mobile', 'Category', 'Locality', 'Source'];
  const rowH  = 20;

  // HEADER
  doc.rect(0, 0, doc.page.width, 80).fill(color);
  doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
     .text(`HomeFaciliti — ${title}`, 40, 20, { align: 'center' });
  doc.fontSize(10).font('Helvetica')
     .text(`Generated: ${new Date().toLocaleString('en-IN')}   |   Total: ${allRows.length} Partners`, 40, 50, { align: 'center' });

  // SUMMARY BOX
  let y = 100;
  doc.rect(40, y, pageW, 28).fill(lightColor);
  doc.fillColor(color).fontSize(11).font('Helvetica-Bold')
     .text(`Total: ${allRows.length} Partners  |  All Approved ✓`, 50, y + 9, { align: 'center', width: pageW - 20 });
  y += 38;

  function drawHeader(startY) {
    doc.rect(40, startY, pageW, rowH).fill(color);
    let x = 40;
    heads.forEach((h, i) => {
      doc.fillColor('white').fontSize(8.5).font('Helvetica-Bold')
         .text(h, x + 3, startY + 6, { width: cols[i] - 5, lineBreak: false });
      x += cols[i];
    });
    return startY + rowH;
  }

  y = drawHeader(y);

  allRows.forEach((p, idx) => {
    if (y > doc.page.height - 55) {
      doc.addPage();
      y = 40;
      y = drawHeader(y);
    }

    const bg = idx % 2 === 0 ? '#ffffff' : lightColor;
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
       .strokeColor('#ddd').lineWidth(0.3).stroke();
    y += rowH;
  });

  // FOOTER
  if (y > doc.page.height - 55) doc.addPage();
  y += 15;
  doc.rect(40, y, pageW, 30).fill(color);
  doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
     .text(`Grand Total: ${allRows.length} Partners  |  All Approved ✓`, 40, y + 10, { align: 'center', width: pageW });

  doc.end();
  await new Promise((resolve, reject) => { stream.on('finish', resolve); stream.on('error', reject); });
  console.log(`✅ Saved: ${outPath}  (${allRows.length} partners)`);
}

async function run() {
  const pool = await mysql.createPool({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  try {
    // ==================== BANGALORE ====================
    const [nodeBang] = await pool.query(
      "SELECT id, name, email, mobile, city, locality, category, isApproved, createdAt FROM node_partners WHERE city LIKE '%Bangalore%' ORDER BY name ASC"
    );
    const [laravelBang] = await pool.query(
      `SELECT u.id, u.name, u.email, u.mobile_number AS mobile,
              c.name AS city, l.name AS locality, cat.title AS category,
              u.is_approval AS isApproved, u.created_at AS createdAt
       FROM homef4fw_homefaci.users u
       LEFT JOIN homef4fw_homefaci.cities c ON u.city_id = c.id
       LEFT JOIN homef4fw_homefaci.localities l ON u.locality_id = l.id
       LEFT JOIN homef4fw_homefaci.categories cat ON u.category_id = cat.id
       WHERE u.role_id = 2 AND c.name LIKE '%Bangalore%' ORDER BY u.name ASC`
    );

    const bangRows = [
      ...nodeBang.map(r => ({ ...r, source: 'Admin Panel' })),
      ...laravelBang.map(r => ({ ...r, source: 'App' }))
    ].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    // ==================== BENGALURU ====================
    const [nodeBeng] = await pool.query(
      "SELECT id, name, email, mobile, city, locality, category, isApproved, createdAt FROM node_partners WHERE city LIKE '%Bengaluru%' OR city LIKE '%bengaluru%' ORDER BY name ASC"
    );
    const [laravelBeng] = await pool.query(
      `SELECT u.id, u.name, u.email, u.mobile_number AS mobile,
              c.name AS city, l.name AS locality, cat.title AS category,
              u.is_approval AS isApproved, u.created_at AS createdAt
       FROM homef4fw_homefaci.users u
       LEFT JOIN homef4fw_homefaci.cities c ON u.city_id = c.id
       LEFT JOIN homef4fw_homefaci.localities l ON u.locality_id = l.id
       LEFT JOIN homef4fw_homefaci.categories cat ON u.category_id = cat.id
       WHERE u.role_id = 2 AND (c.name LIKE '%Bengaluru%' OR c.name LIKE '%bengaluru%') ORDER BY u.name ASC`
    );

    const bengRows = [
      ...nodeBeng.map(r => ({ ...r, source: 'Admin Panel' })),
      ...laravelBeng.map(r => ({ ...r, source: 'App' }))
    ].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    console.log(`Bangalore: ${bangRows.length} | Bengaluru: ${bengRows.length}`);

    // Generate both PDFs
    await generatePDF(bangRows, 'Bangalore Partners', '#e65100', '#fff3e0', 'bangalore_only_partners.pdf');
    await generatePDF(bengRows, 'Bengaluru Partners', '#004d40', '#e0f2f1', 'bengaluru_only_partners.pdf');

  } finally {
    await pool.end();
  }
}

run().catch(console.error);
