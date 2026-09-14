async function run() {
  const url = 'https://backend-1-ux3b.onrender.com/api/checkout';
  console.log(`Checking GET: ${url}...`);
  try {
    const res = await fetch(url);
    console.log(`GET Status: ${res.status}`);
    const text = await res.text();
    console.log(`GET Body:`, text.substring(0, 300));
  } catch (err) {
    console.error(err);
  }

  console.log(`\nChecking POST: ${url}...`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    console.log(`POST Status: ${res.status}`);
    const text = await res.text();
    console.log(`POST Body:`, text.substring(0, 300));
  } catch (err) {
    console.error(err);
  }
}

run();
