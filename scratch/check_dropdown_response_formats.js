async function run() {
  const baseUrl = 'https://adminbackend-1-h03r.onrender.com/api';
  
  const endpoints = [
    '/categories',
    '/settings/states',
    '/settings/cities'
  ];

  for (const endpoint of endpoints) {
    const url = baseUrl + endpoint;
    console.log(`Fetching: ${url}...`);
    try {
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        console.log(`Success: ${json.success}`);
        if (json.data && json.data.length > 0) {
          console.log(`First item keys:`, Object.keys(json.data[0]));
          console.log(`First item sample:`, json.data[0]);
        } else {
          console.log(`Data is empty or not an array`);
        }
      } else {
        console.log(`Error Response:`, res.status);
      }
    } catch (err) {
      console.error(err);
    }
    console.log('--------------------------------------------------');
  }
}

run();
