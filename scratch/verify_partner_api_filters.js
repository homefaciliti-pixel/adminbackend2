const mysql = require('mysql2/promise');
process.env.DB_NAME = 'homef4fw_homefaci';
process.env.DB_USER = 'homef4fw_homefaci';
const db = require('../db');

// Replicate the route logic to test it locally
async function getAllPartners() {
  const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
  const [
    [nodeRows],
    [laravelRows],
    [catRows],
    [serviceRows]
  ] = await Promise.all([
    db.query('SELECT * FROM partners'),
    db.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.mobile_number AS mobile, 
        s.name AS state, 
        c.name AS city, 
        l.name AS locality,
        cat.title AS categoryName,
        subcat.title AS subCategoryName,
        u.address, 
        u.image, 
        u.status, 
        u.is_approval AS isApproved, 
        u.gender, 
        u.experience, 
        u.service_id AS services, 
        u.aadhaar_number AS aadhaarNumber, 
        u.aadhaar_front_image AS aadharFront, 
        u.aadhaar_back_image AS aadharBack, 
        u.pan_number AS panNumber, 
        u.pan_image AS panImage, 
        u.bank_name AS bankName, 
        u.account_number AS accountNumber, 
        u.ifsc_code AS ifscCode, 
        u.created_at AS createdAt,
        u.do_you_have_vehicle AS hasVehicle,
        u.category_id,
        u.sub_category_id,
        u.account_holder_name AS accountHolder,
        u.payment_status AS isPaid
      FROM \`${dbName}\`.\`users\` u
      LEFT JOIN \`${dbName}\`.\`states\` s ON u.state_id = s.id
      LEFT JOIN \`${dbName}\`.\`cities\` c ON u.city_id = c.id
      LEFT JOIN \`${dbName}\`.\`localities\` l ON u.locality_id = l.id
      LEFT JOIN \`${dbName}\`.\`categories\` cat ON u.category_id = cat.id
      LEFT JOIN \`${dbName}\`.\`categories\` subcat ON u.sub_category_id = subcat.id
      WHERE u.role_id = 2
    `),
    db.query(`SELECT id, title FROM \`${dbName}\`.\`categories\``),
    db.query(`SELECT id, title FROM \`${dbName}\`.\`services\``)
  ]);

  const catMap = {};
  catRows.forEach(row => { catMap[row.id] = row.title; });

  const serviceMap = {};
  serviceRows.forEach(row => { serviceMap[row.id] = row.title; });

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
    let mappedServices = '';
    if (r.services) {
      mappedServices = r.services.split(',').map(id => serviceMap[id.trim()]).filter(Boolean).join(',');
    }
    all.push({
      ...r,
      id: r.id + 10000000,
      isApproved: r.isApproved === 1 || r.isApproved === '1' || r.isApproved === true,
      status: r.status === 1 || r.status === '1' || r.status === true,
      category: r.categoryName || '',
      subCategory: r.subCategoryName || '',
      source: 'App Partner (Laravel)'
    });
  });

  return all;
}

async function testFilterOptions(queryParams = {}) {
  const { state, city } = queryParams;
  const allPartners = await getAllPartners();

  const categoriesSet = new Set();
  const statesSet = new Set();
  const citiesSet = new Set();
  const localitiesSet = new Set();

  allPartners.forEach(p => {
    const pCategory = p.category ? p.category.trim() : '';
    const pState = p.state ? p.state.trim() : '';
    const pCity = p.city ? p.city.trim() : '';
    const pLocality = p.locality ? p.locality.trim() : '';

    if (pCategory) categoriesSet.add(pCategory);
    if (pState) statesSet.add(pState);

    let matchState = true;
    if (state && state.trim() !== '') {
      matchState = (pState.toLowerCase() === state.trim().toLowerCase());
    }

    let matchCity = true;
    if (city && city.trim() !== '') {
      matchCity = (pCity.toLowerCase() === city.trim().toLowerCase());
    }

    if (matchState) {
      if (pCity) citiesSet.add(pCity);
    }

    if (matchState && matchCity) {
      if (pLocality) localitiesSet.add(pLocality);
    }
  });

  const categories = Array.from(categoriesSet).filter(Boolean).sort((a, b) => a.localeCompare(b));
  const states = Array.from(statesSet).filter(Boolean).sort((a, b) => a.localeCompare(b));
  const cities = Array.from(citiesSet).filter(Boolean).sort((a, b) => a.localeCompare(b));
  const localities = Array.from(localitiesSet).filter(Boolean).sort((a, b) => a.localeCompare(b));

  return { categories, states, cities, localities };
}

async function run() {
  try {
    console.log('--- Testing without query params ---');
    const res1 = await testFilterOptions();
    console.log(`Categories count: ${res1.categories.length} (e.g. ${res1.categories.slice(0, 3)})`);
    console.log(`States count: ${res1.states.length} (e.g. ${res1.states.slice(0, 3)})`);
    console.log(`Cities count: ${res1.cities.length} (e.g. ${res1.cities.slice(0, 3)})`);
    console.log(`Localities count: ${res1.localities.length} (e.g. ${res1.localities.slice(0, 3)})`);

    console.log('\n--- Testing with state=Rajasthan ---');
    const res2 = await testFilterOptions({ state: 'Rajasthan' });
    console.log(`Cities in Rajasthan: ${res2.cities}`);
    console.log(`Localities count: ${res2.localities.length}`);

    console.log('\n--- Testing with state=Rajasthan, city=Jaipur ---');
    const res3 = await testFilterOptions({ state: 'Rajasthan', city: 'Jaipur' });
    console.log(`Localities count: ${res3.localities.length} (e.g. ${res3.localities.slice(0, 5)})`);

  } catch (err) {
    console.error(err);
  } finally {
    db.end(); // close pool
  }
}

run();
