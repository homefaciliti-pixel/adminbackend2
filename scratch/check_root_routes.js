async function run() {
  const urls = [
    'https://adminbackend-1-h03r.onrender.com/',
    'https://partner-backend-2.onrender.com/',
    'https://backend-1-ux3b.onrender.com/'
  ];

  for (const url of urls) {
    console.log(`Checking root route for: ${url}...`);
    try {
      const res = await fetch(url);
      console.log(`Status: ${res.status}`);
      const text = await res.text();
      // Print first 200 chars or look for "API Server" / "Error"
      if (text.includes('Error') || text.includes('Cannot GET')) {
        console.log(`Error Response:`, text.substring(0, 150));
      } else {
        console.log(`Success Response (snippet):`, text.substring(0, 150).replace(/\s+/g, ' '));
      }
    } catch (err) {
      console.error(err);
    }
    console.log('-------------------------------------------');
  }
}

run();
