const PORT = 3500;
process.env.PORT = PORT; // override port

const server = require('./server');
const http = require('http');

// Start server
const app = server.listen(PORT, async () => {
  console.log(`🧪 Test server booted on port ${PORT}`);
  try {
    const db = require('./db');
    
    // Ensure local test database has category_id column and foreign key constraint
    const [cols] = await db.query('SHOW COLUMNS FROM services LIKE "category_id"');
    if (cols.length === 0) {
      console.log('Altering local test database "services" table to add category_id column...');
      await db.query('ALTER TABLE services ADD COLUMN category_id INT DEFAULT NULL');
      try {
        await db.query('ALTER TABLE services ADD CONSTRAINT services_category_id_foreign FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE');
      } catch (err) {
        console.log('Constraint already exists or could not be added:', err.message);
      }
    }

    const [ratingCols] = await db.query('SHOW COLUMNS FROM services LIKE "rating"');
    if (ratingCols.length === 0) {
      console.log('Altering local test database "services" table to add rating column...');
      await db.query('ALTER TABLE services ADD COLUMN rating DECIMAL(3, 2) DEFAULT NULL');
    }

    const [timeCols] = await db.query('SHOW COLUMNS FROM services LIKE "time"');
    if (timeCols.length === 0) {
      console.log('Altering local test database "services" table to add time column...');
      await db.query('ALTER TABLE services ADD COLUMN time VARCHAR(100) DEFAULT NULL');
    }

    // Make categories.parent and orders.vendorName columns nullable to accommodate NULL foreign keys
    console.log('Altering local test database: making categories.parent nullable...');
    await db.query('ALTER TABLE categories MODIFY COLUMN parent VARCHAR(255) DEFAULT NULL');
    
    console.log('Altering local test database: making orders.vendorName nullable...');
    await db.query('ALTER TABLE orders MODIFY COLUMN vendorName VARCHAR(255) DEFAULT NULL');

    // Helper to perform GET request
    function fetchJson(url) {
      return new Promise((resolve, reject) => {
        http.get(url, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (err) {
              reject(new Error(`Failed to parse JSON: ${data}`));
            }
          });
        }).on('error', reject);
      });
    }

    // Test 1: Dashboard API
    console.log('Testing GET /api/dashboard...');
    const dashRes = await fetchJson(`http://localhost:${PORT}/api/dashboard`);
    if (!dashRes.success || !Array.isArray(dashRes.data)) {
      throw new Error(`Invalid Dashboard response: ${JSON.stringify(dashRes)}`);
    }
    console.log('✅ Dashboard returns array as expected:');
    dashRes.data.forEach(item => {
      console.log(`  - ${item.name}: ${item.totalAmount} (Icon: ${item.imageIcon})`);
    });

    // Test 2: Partners Filter
    console.log('Testing GET /api/partners (list & search)...');
    const partnersRes = await fetchJson(`http://localhost:${PORT}/api/partners?city=Delhi`);
    if (!partnersRes.success || !Array.isArray(partnersRes.data)) {
      throw new Error(`Invalid Partners response: ${JSON.stringify(partnersRes)}`);
    }
    console.log(`✅ Partners city search returned ${partnersRes.data.length} partners.`);

    // Test 3: Partners Pending
    console.log('Testing GET /api/partners/pending...');
    const pendingRes = await fetchJson(`http://localhost:${PORT}/api/partners/pending`);
    if (!pendingRes.success || !Array.isArray(pendingRes.data)) {
      throw new Error(`Invalid Pending Partners response: ${JSON.stringify(pendingRes)}`);
    }
    console.log(`✅ Pending partners returned ${pendingRes.data.length} partners.`);

    // Test 4: Booking Earnings
    console.log('Testing GET /api/earnings/bookings...');
    const bookingsRes = await fetchJson(`http://localhost:${PORT}/api/earnings/bookings`);
    if (!bookingsRes.success || bookingsRes.totalBookingEarnings === undefined || bookingsRes.totalTransactions === undefined) {
      throw new Error(`Invalid Booking Earnings response: ${JSON.stringify(bookingsRes)}`);
    }
    console.log(`✅ Booking earnings: Total = ${bookingsRes.totalBookingEarnings}, Transactions = ${bookingsRes.totalTransactions}`);

    // Test 5: Users Search
    console.log('Testing GET /api/users?query=Rahul...');
    const usersRes = await fetchJson(`http://localhost:${PORT}/api/users?query=Rahul`);
    if (!usersRes.success || !Array.isArray(usersRes.data)) {
      throw new Error(`Invalid Users response: ${JSON.stringify(usersRes)}`);
    }
    console.log(`✅ Users search returned ${usersRes.data.length} users (Expected matches: Rahul Sharma).`);
    usersRes.data.forEach(u => console.log(`  - ${u.name} (${u.email})`));

    // Test 6: Settings Banners Search & Commission Settings
    console.log('Testing GET /api/settings/banners?title=Summer...');
    const bannerRes = await fetchJson(`http://localhost:${PORT}/api/settings/banners?title=Summer`);
    if (!bannerRes.success || !Array.isArray(bannerRes.data)) {
      throw new Error(`Invalid Banners search response: ${JSON.stringify(bannerRes)}`);
    }
    console.log(`✅ Banners search returned ${bannerRes.data.length} banners.`);

    console.log('Testing GET /api/settings/commission...');
    const commRes = await fetchJson(`http://localhost:${PORT}/api/settings/commission`);
    if (!commRes.success || commRes.commissionRate === undefined) {
      throw new Error(`Invalid Commission response: ${JSON.stringify(commRes)}`);
    }
    console.log(`✅ Commission Rate: ${commRes.commissionRate}%`);

    // Test 7: Reports - all 4 endpoints with required params
    console.log('\n--- Running Reports Tests ---');

    // 7a. Missing params should return 400
    console.log('Testing GET /api/reports/users without required params (expects 400)...');
    const reportMissingRes = await fetchJson(`http://localhost:${PORT}/api/reports/users?startDate=15-05-2026`);
    if (reportMissingRes.success !== false) {
      throw new Error(`Expected 400 error for missing params but got: ${JSON.stringify(reportMissingRes)}`);
    }
    console.log('✅ Missing params correctly rejected with:', reportMissingRes.message);

    // 7b. Users Report with all required params
    console.log('Testing GET /api/reports/users with all required params...');
    const usersRepRes = await fetchJson(`http://localhost:${PORT}/api/reports/users?startDate=01-01-2026&endDate=31-12-2026&query=&export=`);
    if (!usersRepRes.success || !Array.isArray(usersRepRes.data)) {
      throw new Error(`Invalid Users report response: ${JSON.stringify(usersRepRes)}`);
    }
    console.log(`✅ Users report returned ${usersRepRes.data.length} users.`);

    // 7c. Partners Report with all required params
    console.log('Testing GET /api/reports/partners with all required params...');
    const partnersRepRes = await fetchJson(`http://localhost:${PORT}/api/reports/partners?startDate=01-01-2026&endDate=31-12-2026&query=&export=`);
    if (!partnersRepRes.success || !Array.isArray(partnersRepRes.data)) {
      throw new Error(`Invalid Partners report response: ${JSON.stringify(partnersRepRes)}`);
    }
    console.log(`✅ Partners report returned ${partnersRepRes.data.length} partners.`);

    // 7d. Earnings Report with all required params
    console.log('Testing GET /api/reports/earnings with all required params...');
    const earningsRepRes = await fetchJson(`http://localhost:${PORT}/api/reports/earnings?startDate=01-01-2026&endDate=31-12-2026&query=&export=`);
    if (!earningsRepRes.success || !Array.isArray(earningsRepRes.data)) {
      throw new Error(`Invalid Earnings report response: ${JSON.stringify(earningsRepRes)}`);
    }
    console.log(`✅ Earnings report returned ${earningsRepRes.data.length} records.`);

    // 7e. Subscriptions Report with all required params
    console.log('Testing GET /api/reports/subscriptions with all required params...');
    const subsRepRes = await fetchJson(`http://localhost:${PORT}/api/reports/subscriptions?startDate=01-01-2026&endDate=31-12-2026&query=&export=`);
    if (!subsRepRes.success || !Array.isArray(subsRepRes.data)) {
      throw new Error(`Invalid Subscriptions report response: ${JSON.stringify(subsRepRes)}`);
    }
    console.log(`✅ Subscriptions report returned ${subsRepRes.data.length} records.`);

    // Test 8: Support Tickets List
    console.log('Testing GET /api/support...');
    const supportRes = await fetchJson(`http://localhost:${PORT}/api/support`);
    if (!supportRes.success || !Array.isArray(supportRes.data)) {
      throw new Error(`Invalid Support response: ${JSON.stringify(supportRes)}`);
    }
    console.log(`✅ Support Tickets: returned ${supportRes.data.length} tickets.`);

    // ==========================================================
    // IMAGE UPLOAD TESTS
    // ==========================================================
    
    // HTTP helper for multipart upload
    function uploadMockImage(url, fieldName, filename, fileContent, mimeType) {
      return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const boundary = '----TestBoundary' + Math.random().toString(36).substring(2);
        
        let header = `--${boundary}\r\n`;
        header += `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\n`;
        header += `Content-Type: ${mimeType}\r\n\r\n`;
        
        const footer = `\r\n--${boundary}--\r\n`;
        
        const bodyBuffer = Buffer.concat([
          Buffer.from(header, 'utf-8'),
          Buffer.from(fileContent),
          Buffer.from(footer, 'utf-8')
        ]);
        
        const options = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: parsedUrl.pathname,
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': bodyBuffer.length
          }
        };
        
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
            } catch (err) {
              reject(new Error(`Failed to parse JSON: ${data}`));
            }
          });
        }).on('error', reject);
        
        req.write(bodyBuffer);
        req.end();
      });
    }

    console.log('\n--- Running Image Upload Tests ---');
    console.log('Testing POST /api/upload with mock PNG...');
    // PNG signature block
    const mockPngData = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const uploadRes = await uploadMockImage(
      `http://localhost:${PORT}/api/upload`,
      'image',
      'test_upload.png',
      mockPngData,
      'image/png'
    );

    if (uploadRes.statusCode !== 201 || !uploadRes.body.success || !uploadRes.body.data.url) {
      throw new Error(`Image upload failed: ${JSON.stringify(uploadRes)}`);
    }
    console.log(`✅ Image uploaded successfully. URL: ${uploadRes.body.data.url}`);

    // Verify file is statically served and accessible
    console.log('Verifying uploaded image URL accessibility...');
    const accessRes = await new Promise((resolve, reject) => {
      http.get(uploadRes.body.data.url, (res) => {
        resolve(res.statusCode);
      }).on('error', reject);
    });
    if (accessRes !== 200) {
      throw new Error(`Served uploaded image returned non-200 status code: ${accessRes}`);
    }
    console.log('✅ Uploaded image statically hosted and reachable.');

    // Test rejection of non-image files
    console.log('Testing POST /api/upload with disallowed file extension (.txt)...');
    const mockTxtData = Buffer.from('hello world');
    const uploadTxtRes = await uploadMockImage(
      `http://localhost:${PORT}/api/upload`,
      'image',
      'test_upload.txt',
      mockTxtData,
      'text/plain'
    );
    if (uploadTxtRes.statusCode === 201) {
      throw new Error('Image upload endpoint accepted a .txt file when it should have rejected it!');
    }
    console.log('✅ Disallowed file extension correctly rejected with error:', uploadTxtRes.body.message);

    // ==========================================================
    // ORDERS ENDPOINTS TESTS
    // ==========================================================
    console.log('\n--- Running Orders (Service Requests) Tests ---');
    console.log('Testing POST /api/orders to create a test order...');
    const createOrderRes = await makeRequest(`http://localhost:${PORT}/api/orders`, 'POST', {
      serviceRequestNumber: 'SRN_TEST_101',
      serviceName: 'Deep Sofa Cleaning',
      serviceAmount: 899.00,
      slotTime: '12:00 PM - 02:00 PM',
      serviceDate: '25-06-2026',
      city: 'Gurugram',
      locality: 'Sohna Road',
      status: 'Pending',
      vendorName: '-',
      address: 'Test Address 123, Sector 48, Gurugram'
    });
    if (createOrderRes.statusCode !== 201 || !createOrderRes.body.success) {
      throw new Error(`Failed to create order: ${JSON.stringify(createOrderRes.body)}`);
    }
    const testOrderId = createOrderRes.body.data.id;
    console.log(`✅ Order created successfully with ID ${testOrderId}.`);

    // Test GET single order detail by ID
    console.log(`Testing GET /api/orders/${testOrderId} for detailed info...`);
    const getOrderRes = await fetchJson(`http://localhost:${PORT}/api/orders/${testOrderId}`);
    if (!getOrderRes.success || !getOrderRes.data) {
      throw new Error(`Failed to retrieve order by ID: ${JSON.stringify(getOrderRes)}`);
    }
    const orderData = getOrderRes.data;
    if (orderData.id !== testOrderId || orderData.serviceRequestNumber !== 'SRN_TEST_101' || orderData.serviceAmount !== 899.00 || orderData.locality !== 'Sohna Road') {
      throw new Error(`Order details mismatch: ${JSON.stringify(orderData)}`);
    }
    console.log('✅ Single order details fetched and verified successfully.');

    // Test PUT assign vendor to order
    console.log(`Testing PUT /api/orders/${testOrderId}/assign to vendor "Ram Kumar"...`);
    const assignRes = await makeRequest(`http://localhost:${PORT}/api/orders/${testOrderId}/assign`, 'PUT', {
      vendorName: 'Ram Kumar'
    });
    if (assignRes.statusCode !== 200 || !assignRes.body.success) {
      throw new Error(`Failed to assign order: ${JSON.stringify(assignRes.body)}`);
    }
    const assignedOrder = assignRes.body.data;
    if (assignedOrder.vendorName !== 'Ram Kumar' || assignedOrder.status !== 'Assigned') {
      throw new Error(`Vendor assignment response mismatch: ${JSON.stringify(assignedOrder)}`);
    }
    console.log('✅ Vendor assigned and order status set to Assigned successfully.');

    // Clean up: delete order
    console.log(`Testing DELETE /api/orders/${testOrderId} to clean up...`);
    const deleteOrderRes = await makeRequest(`http://localhost:${PORT}/api/orders/${testOrderId}`, 'DELETE');
    if (deleteOrderRes.statusCode !== 200 || !deleteOrderRes.body.success) {
      throw new Error(`Failed to delete order: ${JSON.stringify(deleteOrderRes.body)}`);
    }
    console.log('✅ Order deleted and cleaned up successfully.');

    // ==========================================================
    // SERVICES CATEGORY ID, RATING & TIME TESTS
    // ==========================================================
    console.log('\n--- Running Services Category ID, Rating & Time Tests ---');
    console.log('Testing POST /api/services with categoryId = 3, rating = 4.8, time = "45 mins", isHighlighted = "Trending Now"...');
    const createServiceRes = await makeRequest(`http://localhost:${PORT}/api/services`, 'POST', {
      title: 'Test Service With Category',
      price: 199.99,
      image: 'http://icon.png',
      description: 'A test service for checking category, rating and time constraint mapping',
      status: true,
      categoryId: 3,
      rating: 4.8,
      time: '45 mins',
      isHighlighted: 'Trending Now'
    });
    if (createServiceRes.statusCode !== 201 || !createServiceRes.body.success) {
      throw new Error(`Failed to create service: ${JSON.stringify(createServiceRes.body)}`);
    }
    const serviceId = createServiceRes.body.data.id;
    console.log(`✅ Service created successfully with ID ${serviceId}.`);

    // Verify it returns categoryId, rating, time on GET
    console.log('Verifying categoryId, rating, time, isHighlighted populated in GET services...');
    const checkServices = await fetchJson(`http://localhost:${PORT}/api/services`);
    const serviceFound = checkServices.data.find(s => s.id === serviceId);
    if (!serviceFound) {
      throw new Error(`Created service ID ${serviceId} not found in GET response`);
    }
    if (serviceFound.categoryId !== 3 && serviceFound.category_id !== 3) {
      throw new Error(`Service categoryId is not correctly set. Response: ${JSON.stringify(serviceFound)}`);
    }
    if (parseFloat(serviceFound.rating) !== 4.8 || serviceFound.time !== '45 mins' || serviceFound.isHighlighted !== 'Trending Now') {
      throw new Error(`Service rating/time/highlight not correctly set. Response: ${JSON.stringify(serviceFound)}`);
    }
    console.log(`✅ Service returns categoryId: ${serviceFound.categoryId}, rating: ${serviceFound.rating}, time: ${serviceFound.time}, isHighlighted: ${serviceFound.isHighlighted}`);

    // Test PUT update category_id, rating, time, isHighlighted
    console.log(`Testing PUT /api/services/${serviceId} to update categoryId to 1, rating to 4.5, time to "60 mins", isHighlighted to "Best Seller"...`);
    const updateServiceRes = await makeRequest(`http://localhost:${PORT}/api/services/${serviceId}`, 'PUT', {
      categoryId: 1,
      rating: 4.5,
      time: '60 mins',
      isHighlighted: 'Best Seller'
    });
    if (updateServiceRes.statusCode !== 200 || !updateServiceRes.body.success) {
      throw new Error(`Failed to update service: ${JSON.stringify(updateServiceRes.body)}`);
    }
    if (updateServiceRes.body.data.categoryId !== 1 || parseFloat(updateServiceRes.body.data.rating) !== 4.5 || updateServiceRes.body.data.time !== '60 mins' || updateServiceRes.body.data.isHighlighted !== 'Best Seller') {
      throw new Error(`Updated service does not have new categoryId, rating, time, isHighlighted. Body: ${JSON.stringify(updateServiceRes.body)}`);
    }
    console.log('✅ Service categoryId, rating, time, isHighlighted updated successfully.');

    // Cleanup service
    await makeRequest(`http://localhost:${PORT}/api/services/${serviceId}`, 'DELETE');

    // ==========================================================
    // CASCADING DELETION TESTS
    // ==========================================================
    
    // HTTP helper for POST/DELETE methods
    function makeRequest(url, method, body = null) {
      return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const options = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: parsedUrl.pathname + parsedUrl.search,
          method: method,
          headers: {
            'Content-Type': 'application/json'
          }
        };
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
            } catch (err) {
              reject(new Error(`Failed to parse JSON: ${data}`));
            }
          });
        }).on('error', reject);
        if (body) {
          req.write(JSON.stringify(body));
        }
        req.end();
      });
    }

    console.log('\n--- Running Deletion & Cascade Tests ---');

    // 1. Categories Cascade Delete
    console.log('1. Testing category cascade deletion...');
    const createParentRes = await makeRequest(`http://localhost:${PORT}/api/categories`, 'POST', {
      title: 'TestParentClean',
      parent: 'None',
      image: 'img',
      status: true
    });
    if (createParentRes.statusCode !== 201 || !createParentRes.body.success) {
      throw new Error(`Failed to create parent category: ${JSON.stringify(createParentRes.body)}`);
    }
    const parentId = createParentRes.body.data.id;

    const createSubRes = await makeRequest(`http://localhost:${PORT}/api/categories`, 'POST', {
      title: 'TestSubClean',
      parent: 'TestParentClean',
      image: 'img',
      status: true
    });
    if (createSubRes.statusCode !== 201 || !createSubRes.body.success) {
      throw new Error(`Failed to create subcategory: ${JSON.stringify(createSubRes.body)}`);
    }
    const subId = createSubRes.body.data.id;

    console.log(`Created parent category ID ${parentId} and subcategory ID ${subId}. Now deleting parent...`);
    const delCatRes = await makeRequest(`http://localhost:${PORT}/api/categories/${parentId}`, 'DELETE');
    if (delCatRes.statusCode !== 200 || !delCatRes.body.success) {
      throw new Error(`Failed to delete category: ${JSON.stringify(delCatRes.body)}`);
    }

    // Verify parent is deleted
    const checkCats = await fetchJson(`http://localhost:${PORT}/api/categories`);
    const parentExists = checkCats.data.some(c => c.id === parentId);
    const subExists = checkCats.data.some(c => c.id === subId);
    if (parentExists) {
      throw new Error('Parent category was not deleted!');
    }
    if (subExists) {
      throw new Error('Subcategory was not cascade deleted!');
    }
    console.log('✅ Category cascade deletion test passed successfully.');

    // 2. States, Cities & Localities Cascade Delete
    console.log('2. Testing state cascade deletion...');
    const createStRes = await makeRequest(`http://localhost:${PORT}/api/settings/states`, 'POST', {
      name: 'TestStateDelete',
      status: true
    });
    if (createStRes.statusCode !== 201 || !createStRes.body.success) {
      throw new Error(`Failed to create state: ${JSON.stringify(createStRes.body)}`);
    }
    const stId = createStRes.body.data.id;

    const createCiRes = await makeRequest(`http://localhost:${PORT}/api/settings/cities`, 'POST', {
      cityName: 'TestCityDelete',
      stateName: 'TestStateDelete',
      status: true
    });
    if (createCiRes.statusCode !== 201 || !createCiRes.body.success) {
      throw new Error(`Failed to create city: ${JSON.stringify(createCiRes.body)}`);
    }
    const ciId = createCiRes.body.data.id;

    const createLocRes = await makeRequest(`http://localhost:${PORT}/api/settings/localities`, 'POST', {
      localityName: 'TestLocalityDelete',
      cityName: 'TestCityDelete',
      stateName: 'TestStateDelete',
      status: true
    });
    if (createLocRes.statusCode !== 201 || !createLocRes.body.success) {
      throw new Error(`Failed to create locality: ${JSON.stringify(createLocRes.body)}`);
    }
    const locId = createLocRes.body.data.id;

    console.log(`Created state ID ${stId}, city ID ${ciId}, and locality ID ${locId}. Deleting state...`);
    const delStateRes = await makeRequest(`http://localhost:${PORT}/api/settings/states/${stId}`, 'DELETE');
    if (delStateRes.statusCode !== 200 || !delStateRes.body.success) {
      throw new Error(`Failed to delete state: ${JSON.stringify(delStateRes.body)}`);
    }

    // Verify state, city and locality are deleted
    const statesList = await fetchJson(`http://localhost:${PORT}/api/settings/states`);
    const citiesList = await fetchJson(`http://localhost:${PORT}/api/settings/cities`);
    const localitiesList = await fetchJson(`http://localhost:${PORT}/api/settings/localities`);

    if (statesList.data.some(s => s.id === stId)) throw new Error('State was not deleted!');
    if (citiesList.data.some(c => c.id === ciId)) throw new Error('City was not cascade deleted!');
    if (localitiesList.data.some(l => l.id === locId)) throw new Error('Locality was not cascade deleted!');
    console.log('✅ State cascade deletion test passed successfully.');

    // 3. Cities & Localities Cascade Delete
    console.log('3. Testing city cascade deletion...');
    const createSt2Res = await makeRequest(`http://localhost:${PORT}/api/settings/states`, 'POST', {
      name: 'TestStateDelete2',
      status: true
    });
    const st2Id = createSt2Res.body.data.id;

    const createCi2Res = await makeRequest(`http://localhost:${PORT}/api/settings/cities`, 'POST', {
      cityName: 'TestCityDelete2',
      stateName: 'TestStateDelete2',
      status: true
    });
    const ci2Id = createCi2Res.body.data.id;

    const createLoc2Res = await makeRequest(`http://localhost:${PORT}/api/settings/localities`, 'POST', {
      localityName: 'TestLocalityDelete2',
      cityName: 'TestCityDelete2',
      stateName: 'TestStateDelete2',
      status: true
    });
    const loc2Id = createLoc2Res.body.data.id;

    console.log(`Created state ID ${st2Id}, city ID ${ci2Id}, and locality ID ${loc2Id}. Deleting city...`);
    const delCityRes = await makeRequest(`http://localhost:${PORT}/api/settings/cities/${ci2Id}`, 'DELETE');
    if (delCityRes.statusCode !== 200 || !delCityRes.body.success) {
      throw new Error(`Failed to delete city: ${JSON.stringify(delCityRes.body)}`);
    }

    // Verify city and locality are deleted, but state still exists
    const states2List = await fetchJson(`http://localhost:${PORT}/api/settings/states`);
    const cities2List = await fetchJson(`http://localhost:${PORT}/api/settings/cities`);
    const localities2List = await fetchJson(`http://localhost:${PORT}/api/settings/localities`);

    if (!states2List.data.some(s => s.id === st2Id)) throw new Error('State should still exist but was deleted!');
    if (cities2List.data.some(c => c.id === ci2Id)) throw new Error('City was not deleted!');
    if (localities2List.data.some(l => l.id === loc2Id)) throw new Error('Locality was not cascade deleted!');

    // Cleanup state 2
    await makeRequest(`http://localhost:${PORT}/api/settings/states/${st2Id}`, 'DELETE');
    console.log('✅ City cascade deletion test passed successfully.');

    console.log('\n🎉 ALL LIVE API TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ LIVE API TEST FAILED:', error);
    process.exit(1);
  } finally {
    app.close();
  }
});
