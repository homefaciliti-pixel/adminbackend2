async function run() {
  const url = 'https://backend-1-ux3b.onrender.com/api/checkout-api/9653853414';
  console.log(`Testing: ${url}`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Body snippet: ${text}`);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
