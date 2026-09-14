const db = require('../db');

async function check() {
  try {
    const [cats] = await db.query("SELECT id, title, image, status FROM categories ORDER BY id DESC LIMIT 25");
    console.log('Categories Count:', cats.length);
    cats.forEach(c => {
      console.log(`ID: ${c.id} | Title: ${c.title} | Image: ${c.image}`);
    });
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

check();
