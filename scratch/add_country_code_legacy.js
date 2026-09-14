const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  try {
    // Select all legacy partners (role_id = 2)
    const [partners] = await connection.query(
      "SELECT id, name, mobile_number FROM users WHERE role_id = 2"
    );
    console.log('Total legacy partners found:', partners.length);

    let updateCount = 0;
    for (const partner of partners) {
      const original = partner.mobile_number ? partner.mobile_number.trim() : '';
      if (!original) continue;

      let target = original;
      
      // Normalize to +91 format
      if (original.length === 10) {
        target = '+91' + original;
      } else if (original.length === 12 && original.startsWith('91')) {
        target = '+' + original; // change 91xxxxxxxxxx to +91xxxxxxxxxx
      } else if (original.length === 11 && original.startsWith('0')) {
        target = '+91' + original.substring(1); // change 0xxxxxxxxxx to +91xxxxxxxxxx
      }

      if (target !== original) {
        await connection.query(
          "UPDATE users SET mobile_number = ? WHERE id = ?",
          [target, partner.id]
        );
        updateCount++;
      }
    }
    console.log(`Successfully updated ${updateCount} legacy partner phone numbers with +91 prefix.`);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
