const db = require('../db');

async function main() {
  try {
    console.log("Checking cities in partners table...");
    const [cities] = await db.query(`SELECT DISTINCT city FROM partners`);
    console.log("Distinct cities in database:", cities.map(c => c.city).filter(Boolean));

    console.log("\nQuerying Bengaluru cleaning partners...");
    // We will check city like '%bengaluru%' or like '%bangalore%'
    // And category/subCategory/services like '%cleaning%'
    const [partners] = await db.query(`
      SELECT id, name, mobile, city, category, subCategory, services, isApproved 
      FROM partners
      WHERE (LOWER(city) LIKE '%bengaluru%' OR LOWER(city) LIKE '%bangalore%')
        AND (LOWER(category) LIKE '%cleaning%' OR LOWER(subCategory) LIKE '%cleaning%' OR LOWER(services) LIKE '%cleaning%')
    `);

    console.log(`Found total ${partners.length} cleaning partners in Bengaluru/Bangalore.`);
    
    const approved = partners.filter(p => p.isApproved === 1);
    const pending = partners.filter(p => p.isApproved === 0 || p.isApproved === null);

    console.log(`Approved: ${approved.length}`);
    console.log(`Pending/Unapproved: ${pending.length}`);

    if (partners.length > 0) {
      console.log("\nList of Bengaluru cleaning partners:");
      partners.forEach((p, idx) => {
        console.log(`${idx + 1}. Name: ${p.name || 'N/A'}, Phone: ${p.mobile}, City: ${p.city}, Category: ${p.category}, Approved: ${p.isApproved === 1 ? 'Yes' : 'No'}`);
      });
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

main();
