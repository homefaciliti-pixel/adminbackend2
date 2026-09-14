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
    const [nodeRows] = await connection.query('SELECT * FROM node_partners');
    const [laravelRows] = await connection.query(`
      SELECT u.id, u.name, u.is_approval AS isApproved, u.status 
      FROM users u 
      WHERE u.role_id = 2
    `);

    const all = [];

    nodeRows.forEach(r => {
      all.push({
        ...r,
        isApproved: r.isApproved === 1 || r.isApproved === true,
        status: r.status === 1 || r.status === true,
        source: 'Admin Partner (MySQL)'
      });
    });

    laravelRows.forEach(r => {
      all.push({
        ...r,
        id: r.id + 10000000,
        isApproved: r.isApproved === 1 || r.isApproved === '1' || r.isApproved === true,
        status: r.status === 1 || r.status === '1' || r.status === true,
        source: 'App Partner (Laravel)'
      });
    });

    const pending = all.filter(p => !p.isApproved);
    const approved = all.filter(p => p.isApproved);

    console.log(`Simulated Total: ${all.length}`);
    console.log(`Simulated Approved: ${approved.length}`);
    console.log(`Simulated Pending: ${pending.length}`);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
