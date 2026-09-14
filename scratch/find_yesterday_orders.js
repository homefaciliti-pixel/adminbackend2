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
    // Yesterday = 2026-07-31
    // Check node_orders_v2 for orders created yesterday (before 4PM = before 1582800000000 approx)
    // createdAt is a timestamp in milliseconds
    // 2026-07-31 00:00:00 IST = 2026-07-30 18:30:00 UTC = 1753902600000 ms
    // 2026-07-31 16:00:00 IST = 2026-07-31 10:30:00 UTC = 1753957800000 ms
    // 2026-08-01 00:00:00 IST = 2026-07-31 18:30:00 UTC = 1753964400000 ms (approx)

    const startOfYesterday = new Date('2026-07-31T00:00:00+05:30').getTime(); // 1753904400000
    const fourPMYesterday = new Date('2026-07-31T16:00:00+05:30').getTime();  // 1753961400000
    const endOfYesterday  = new Date('2026-08-01T00:00:00+05:30').getTime(); // 1753990800000

    console.log(`Searching node_orders_v2 created yesterday (2026-07-31) up to 4PM IST...`);
    console.log(`Range: ${startOfYesterday} to ${fourPMYesterday}`);

    const [rows] = await connection.query(`
      SELECT id, userPhone, serviceName, price, status, cancelReason, createdAt, date, timeSlot 
      FROM node_orders_v2 
      WHERE createdAt BETWEEN ? AND ?
      ORDER BY createdAt ASC
    `, [startOfYesterday, fourPMYesterday]);

    console.log(`\nFound ${rows.length} orders before 4PM yesterday:`);
    rows.forEach(r => {
      const ts = new Date(parseInt(r.createdAt));
      console.log(`- ID: ${r.id}, Service: ${r.serviceName}, Price: ${r.price}, Status: ${r.status}, CancelReason: ${r.cancelReason}, CreatedAt: ${ts.toLocaleString('en-IN', {timeZone:'Asia/Kolkata'})}`);
    });

    console.log('\n--- Also checking full yesterday orders for context ---');
    const [allRows] = await connection.query(`
      SELECT id, userPhone, serviceName, price, status, cancelReason, createdAt, date, timeSlot 
      FROM node_orders_v2 
      WHERE createdAt BETWEEN ? AND ?
      ORDER BY createdAt ASC
    `, [startOfYesterday, endOfYesterday]);

    console.log(`\nAll orders from yesterday (2026-07-31): ${allRows.length}`);
    allRows.forEach(r => {
      const ts = new Date(parseInt(r.createdAt));
      console.log(`- ID: ${r.id}, Service: ${r.serviceName}, Price: ${r.price}, Status: ${r.status}, CancelReason: ${r.cancelReason}, CreatedAt: ${ts.toLocaleString('en-IN', {timeZone:'Asia/Kolkata'})}`);
    });

    // Also check orders (Laravel) from yesterday
    console.log('\n--- Checking Laravel orders from 2026-07-31 ---');
    const [laravelRows] = await connection.query(`
      SELECT o.id, o.order_number, o.amount, o.status, o.created_at,
             oi.service_name, oi.status as item_status
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE DATE(o.created_at) = '2026-07-31'
      ORDER BY o.created_at ASC
    `);
    console.log(`Found ${laravelRows.length} Laravel orders from 2026-07-31:`);
    laravelRows.forEach(r => {
      console.log(`- ID: ${r.id}, Service: ${r.service_name}, Amount: ${r.amount}, OrderStatus: ${r.status}, ItemStatus: ${r.item_status}, CreatedAt: ${r.created_at}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
