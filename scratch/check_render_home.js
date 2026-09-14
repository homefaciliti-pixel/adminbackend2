async function run() {
  const url = 'https://backend-1-ux3b.onrender.com/';
  console.log(`Testing root: ${url}`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Body snippet: ${text.substring(0, 500)}`);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
