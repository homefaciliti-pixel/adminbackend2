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
    const [ordersCols] = await connection.query("DESCRIBE node_orders");
    console.log('node_orders columns:');
    ordersCols.forEach(c => console.log(`- ${c.Field}: ${c.Type}`));

    const [ordersV2Cols] = await connection.query("DESCRIBE node_orders_v2");
    console.log('\nnode_orders_v2 columns:');
    ordersV2Cols.forEach(c => console.log(`- ${c.Field}: ${c.Type}`));

    const [bookingsCols] = await connection.query("DESCRIBE bookings");
    console.log('\nbookings columns:');
    bookingsCols.forEach(c => console.log(`- ${c.Field}: ${c.Type}`));

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
