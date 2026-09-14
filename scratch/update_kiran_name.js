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
    const phone = '9949445425';
    const name = 'Kiran';

    // 1. Update node_users_v2 name
    console.log(`Updating name to "${name}" in node_users_v2 for ${phone}...`);
    const [r1] = await connection.query(`UPDATE node_users_v2 SET name = ? WHERE phone = ?`, [name, phone]);
    console.log(`node_users_v2 affected rows: ${r1.affectedRows}`);

    // 2. Update address JSON in node_orders_v2 order 608
    console.log(`\nUpdating address name in order 608...`);
    const [order] = await connection.query('SELECT address FROM node_orders_v2 WHERE id = 608');
    let addrObj = {};
    try { addrObj = JSON.parse(order[0].address); } catch(e) {}
    addrObj.name = name;
    const newAddr = JSON.stringify(addrObj);

    const [r2] = await connection.query(`UPDATE node_orders_v2 SET address = ? WHERE id = 608`, [newAddr]);
    console.log(`node_orders_v2 address affected rows: ${r2.affectedRows}`);

    console.log('\n✅ Name updated to Kiran successfully!');
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
