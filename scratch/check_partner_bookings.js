const mysql = require('mysql2/promise');
process.env.DB_NAME = 'homef4fw_homefaci';
process.env.DB_USER = 'homef4fw_homefaci';
const db = require('../db');

async function getFilteredBookingsList(partner) {
  const partnerName = partner.name || '';
  const partnerMobile = partner.mobile || '';
  const partnerMobileWithCode = (partner.countryCode || '+91') + partnerMobile;

  const [v2A] = await db.query(
    `SELECT * FROM node_orders_v2 
     WHERE partnerName = ? 
        OR partnerPhone = ? 
        OR partnerPhone = ? 
     ORDER BY id DESC`,
    [partnerName, partnerMobile, partnerMobileWithCode]
  );

  console.log(`v2A count: ${v2A.length}`);

  function parseAddrV2(o) {
    if (!o.address) return {};
    try {
      return typeof o.address === 'string' ? JSON.parse(o.address) : o.address;
    } catch (e) {
      return {};
    }
  }

  function mapV2(o) {
    const a = parseAddrV2(o);
    const s = (o.status||'').toLowerCase();
    let st = s==='completed'?'completed':s==='cancelled'||s==='rejected'?'cancel':s==='in progress'||s==='in_progress'?'in_progress':s==='assigned'?'accepted':s==='amc'?'amc':'pending';
    return {
      id: parseInt(o.id), status: st, service: o.serviceName, date: o.date, time: o.timeSlot,
      serviceAmount: o.price, serviceRequestNumber: o.id.toString(),
      address: a.houseNo ? `${a.houseNo}, ${a.society||''}, ${a.locality||''}, ${a.city||''}`.replace(/,\s*,/g,',').trim() : (o.address||''),
      city: a.city||'', locality: a.locality||'', customerName: a.name||'Customer', customerPhone: o.userPhone||'',
      latitude: parseFloat(a.latitude) || null, longitude: parseFloat(a.longitude) || null,
      source:'app'
    };
  }

  return v2A.map(mapV2);
}

async function run() {
  try {
    const [pRows] = await db.query("SELECT * FROM node_partners WHERE mobile = '7597816095'");
    const partner = pRows[0];
    console.log('Partner Hira details:', partner);

    if (partner) {
      const bookings = await getFilteredBookingsList(partner);
      console.log('\nBookings returned for Hira:', bookings);
    } else {
      console.log('Partner not found!');
    }

  } catch (err) {
    console.error(err);
  } finally {
    db.end();
  }
}

run();
