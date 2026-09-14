async function run() {
  const urls = [
    'https://backend-1-ux3b.onrender.com/api/checkout-api/9653853414',
    'https://backend-1-ux3b.onrender.com/api/partners/checkout-api/9653853414'
  ];
  for (const url of urls) {
    console.log(`Checking: ${url}...`);
    try {
      const res = await fetch(url);
      console.log(`Status: ${res.status}`);
      const text = await res.text();
      console.log(`Body:`, text.substring(0, 300));
    } catch (err) {
      console.error(err);
    }
  }
}

run();
