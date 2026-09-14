const mysql = require('mysql2/promise');

async function run() {
  const pool = await mysql.createPool({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  const [[n1]] = await pool.query("SELECT COUNT(*) as c FROM node_partners WHERE city LIKE '%Bangalore%'");
  const [[n2]] = await pool.query("SELECT COUNT(*) as c FROM node_partners WHERE city LIKE '%Bengaluru%'");

  const [[l1]] = await pool.query("SELECT COUNT(*) as c FROM homef4fw_homefaci.users u LEFT JOIN homef4fw_homefaci.cities c ON u.city_id = c.id WHERE u.role_id=2 AND c.name LIKE '%Bangalore%'");
  const [[l2]] = await pool.query("SELECT COUNT(*) as c FROM homef4fw_homefaci.users u LEFT JOIN homef4fw_homefaci.cities c ON u.city_id = c.id WHERE u.role_id=2 AND c.name LIKE '%Bengaluru%'");

  // Also check unique city name variations
  const [nodeVariants] = await pool.query("SELECT DISTINCT city, COUNT(*) as cnt FROM node_partners WHERE city LIKE '%angal%' OR city LIKE '%engal%' GROUP BY city ORDER BY city");
  const [laravelVariants] = await pool.query("SELECT DISTINCT c.name as city, COUNT(*) as cnt FROM homef4fw_homefaci.users u LEFT JOIN homef4fw_homefaci.cities c ON u.city_id = c.id WHERE u.role_id=2 AND (c.name LIKE '%angal%' OR c.name LIKE '%engal%') GROUP BY c.name ORDER BY c.name");

  console.log('=== node_partners ===');
  console.log('Bangalore:', n1.c);
  console.log('Bengaluru:', n2.c);
  console.log('All variants:');
  nodeVariants.forEach(r => console.log(`  "${r.city}": ${r.cnt}`));

  console.log('\n=== users (Laravel) ===');
  console.log('Bangalore:', l1.c);
  console.log('Bengaluru:', l2.c);
  console.log('All variants:');
  laravelVariants.forEach(r => console.log(`  "${r.city}": ${r.cnt}`));

  console.log('\nTotal Bangalore only:', parseInt(n1.c) + parseInt(l1.c));
  console.log('Total Bengaluru only:', parseInt(n2.c) + parseInt(l2.c));

  await pool.end();
}

run().catch(console.error);
