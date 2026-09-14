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
    const orderIds = [596, 597];
    const newPrice = 199.00;

    console.log(`Updating price to ${newPrice} for Order IDs ${orderIds.join(', ')}...`);

    for (const id of orderIds) {
      const [res] = await connection.query(`
        UPDATE node_orders_v2 
        SET price = ?, remainingAmount = ? 
        WHERE id = ?
      `, [newPrice, newPrice, id]);

      if (res.affectedRows > 0) {
        console.log(`Successfully updated Order ID ${id}.`);
      } else {
        console.log(`Order ID ${id} not found or no change made.`);
      }
    }

    console.log('Update complete.');
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
