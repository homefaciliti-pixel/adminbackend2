async function run() {
  const url = 'https://backend-1-ux3b.onrender.com/';
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log(text);
  } catch (err) {
    console.error(err);
  }
}
run();
