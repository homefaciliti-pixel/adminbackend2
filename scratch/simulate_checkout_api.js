async function check() {
  const url = 'https://backend-1-ux3b.onrender.com/api/partners/checkout-api/9653853414?productId=professional%20Plumber';
  console.log(`Checking live endpoint: ${url}`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    const body = await res.text();
    console.log(`Body snippet: ${body.substring(0, 300)}`);
    if (res.status === 200 && body.includes('success":true')) {
      console.log('DEPLOYMENT SUCCESSFUL!');
      process.exit(0);
    }
  } catch (err) {
    console.error('Error fetching:', err.message);
  }
}

// Check every 10 seconds for up to 3 minutes
let count = 0;
const interval = setInterval(async () => {
  count++;
  console.log(`\n--- Verification Attempt #${count} ---`);
  await check();
  if (count >= 18) {
    console.log('Timeout waiting for deployment.');
    clearInterval(interval);
    process.exit(1);
  }
}, 10000);
