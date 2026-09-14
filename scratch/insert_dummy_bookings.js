const db = require('../db');

// Helper to format date as DD-MM-YYYY
function formatDate(d) {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

async function main() {
  try {
    const testPartners = ['Govind', 'Mahesh Kumar', 'Amitkumar'];
    
    console.log('🔄 1. Updating payment and approval status for test partners:');
    for (const name of testPartners) {
      const [res] = await db.query(
        'UPDATE partners SET isPaid = 1, isApproved = 1, status = 1 WHERE name = ?',
        [name]
      );
      console.log(`Updated ${name}: ${res.affectedRows} row(s) updated.`);
    }

    console.log('\n🗑️ 2. Deleting old orders for test partners to start clean:');
    for (const name of testPartners) {
      const [res] = await db.query('DELETE FROM orders WHERE vendorName = ?', [name]);
      console.log(`Deleted old orders for ${name}: ${res.affectedRows} row(s) deleted.`);
    }

    console.log('\n➕ 3. Inserting dummy bookings with various statuses:');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateTodayStr = formatDate(today);
    const dateTomorrowStr = formatDate(tomorrow);

    const dummyOrders = [
      {
        serviceRequestNumber: 'REQ-2026-0001',
        serviceName: 'AC Deep Repairing',
        serviceAmount: 499.00,
        slotTime: '10:00 AM - 12:00 PM',
        serviceDate: dateTomorrowStr,
        city: 'Delhi',
        locality: 'Connaught Place',
        status: 'Assigned', // Maps to "upcoming" in the app
        address: 'H.No 12, Block B, Connaught Place, New Delhi',
        createdAt: `${dateTodayStr} 10:15 AM`
      },
      {
        serviceRequestNumber: 'REQ-2026-0002',
        serviceName: 'Sofa Deep Cleaning',
        serviceAmount: 999.00,
        slotTime: '01:00 PM - 03:00 PM',
        serviceDate: dateTodayStr,
        city: 'Jaipur',
        locality: 'Malviya Nagar',
        status: 'In Progress', // Maps to "in_progress" in the app
        address: 'Flat 402, Block C, Malviya Nagar, Jaipur',
        createdAt: `${dateTodayStr} 08:30 AM`
      },
      {
        serviceRequestNumber: 'REQ-2026-0003',
        serviceName: 'Kitchen Cleaning & Sanitization',
        serviceAmount: 1499.00,
        slotTime: '09:00 AM - 01:00 PM',
        serviceDate: dateTodayStr,
        city: 'Delhi',
        locality: 'Dwarka Sector 10',
        status: 'Completed', // Maps to "completed" in the app
        address: 'Pocket 3, Sector 10, Dwarka, Delhi',
        createdAt: `${dateTodayStr} 07:00 AM`
      },
      {
        serviceRequestNumber: 'REQ-2026-0004',
        serviceName: 'Electric Fitting & Wire Repair',
        serviceAmount: 299.00,
        slotTime: '04:00 PM - 05:00 PM',
        serviceDate: dateTodayStr,
        city: 'Delhi',
        locality: 'Connaught Place',
        status: 'Cancelled', // Maps to "cancel" in the app
        address: 'Block E, Inner Circle, Connaught Place, New Delhi',
        createdAt: `${dateTodayStr} 11:00 AM`
      }
    ];

    for (const partner of testPartners) {
      console.log(`Inserting 4 orders for ${partner}...`);
      for (const order of dummyOrders) {
        // Customize serviceRequestNumber per partner to keep them unique
        const reqNum = `${order.serviceRequestNumber}-${partner.replace(/\s+/g, '')}`;
        
        await db.query(
          `INSERT INTO orders 
           (serviceRequestNumber, serviceName, serviceAmount, slotTime, serviceDate, city, locality, status, vendorName, address, createdAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            reqNum,
            order.serviceName,
            order.serviceAmount,
            order.slotTime,
            order.serviceDate,
            order.city,
            order.locality,
            order.status,
            partner,
            order.address,
            order.createdAt
          ]
        );
      }
    }

    console.log('\n✅ Successfully inserted dummy bookings and set partner statuses.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error executing database script:', error);
    process.exit(1);
  }
}

main();
