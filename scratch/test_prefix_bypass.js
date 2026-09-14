const db = require('../db');

async function run() {
  try {
    const [rows] = await db.query("SELECT id, name, mobile_number FROM `homef4fw_homefaci`.`users` WHERE id = 1859");
    console.log('Query with schema prefix output:', rows);
  } catch (err) {
    console.error('Error:', err);
  }
  
  try {
    const [rows2] = await db.query("SELECT id, name, mobile_number FROM users WHERE id = 1859");
    console.log('Query without schema prefix output:', rows2);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
