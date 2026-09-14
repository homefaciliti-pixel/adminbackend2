async function run() {
  const url = 'https://homefaciliti.com/api/vendor-order-list';
  console.log(`Checking: ${url}...`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    console.log(`Content-Type: ${res.headers.get('content-type')}`);
    const text = await res.text();
    console.log(`Body:`, text.substring(0, 300));
  } catch (err) {
    console.error(err);
  }
}

run();
