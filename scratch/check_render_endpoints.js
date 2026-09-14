async function run() {
  const baseUrl = 'https://adminbackend-1-h03r.onrender.com/api';
  const url = baseUrl + '/partners/pending';
  console.log(`Fetching: ${url}...`);
  try {
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      const list = json.data;
      console.log(`Total partners in response: ${list.length}`);
    } else {
      console.log(`Error Status: ${res.status}`);
    }
  } catch (err) {
    console.error(err);
  }
}

run();
