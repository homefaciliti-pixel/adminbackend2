const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' }); // load root .env

async function main() {
  const connection = await mysql.createConnection({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  try {
    const phone = '8450921692';

    // 1. Query unprefixed partners
    const [rowsUnprefixed] = await connection.query(
      'SELECT id, name, mobile, isPaid, isApproved, status, createdAt FROM partners WHERE mobile LIKE ?',
      [`%${phone}%`]
    );
    console.log('Unprefixed partners table matches:', rowsUnprefixed);

    // 2. Query prefixed node_partners
    const [rowsPrefixed] = await connection.query(
      'SELECT id, name, mobile, isPaid, isApproved, status, createdAt FROM node_partners WHERE mobile LIKE ?',
      [`%${phone}%`]
    );
    console.log('Prefixed node_partners table matches:', rowsPrefixed);

    // 3. Query node_users and users using mobile column
    const [usersPrefixed] = await connection.query(
      'SELECT * FROM node_users WHERE mobile LIKE ?',
      [`%${phone}%`]
    );
    console.log('Prefixed node_users table matches:', usersPrefixed);

    const [usersUnprefixed] = await connection.query(
      'SELECT * FROM users WHERE mobile LIKE ?',
      [`%${phone}%`]
    );
    console.log('Unprefixed users table matches:', usersUnprefixed);

  } catch (err) {
    console.error('Error during raw query:', err);
  } finally {
    await connection.end();
  }
}

main();
