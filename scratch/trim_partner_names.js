const db = require('../db');
async function main() {
  try {
    // Find all partners with trailing/leading spaces in name
    const [partners] = await db.query("SELECT id, name, LENGTH(name) as len, LENGTH(TRIM(name)) as trimLen FROM partners WHERE name != TRIM(name)");
    console.log('Partners with spaces in name:', JSON.stringify(partners, null, 2));

    if (partners.length === 0) {
      console.log('No partners with name padding found.');
      process.exit(0);
    }

    // Fix all of them
    const [result] = await db.query("UPDATE partners SET name = TRIM(name) WHERE name != TRIM(name)");
    console.log('Fixed rows:', result.affectedRows);

    // Verify
    const [verify] = await db.query("SELECT id, name FROM partners WHERE id IN (" + partners.map(p => p.id).join(',') + ")");
    console.log('After fix:', JSON.stringify(verify, null, 2));

    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}
main();
