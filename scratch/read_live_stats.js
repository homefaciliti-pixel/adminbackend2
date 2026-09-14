async function run() {
  const url = 'https://backend-1-ux3b.onrender.com/';
  try {
    const res = await fetch(url);
    const text = await res.text();
    // Parse stats
    const partnersMatch = text.match(/<div class="stat-number">(\d+)<\/div>\s*<div class="stat-label">Registered Partners<\/div>/);
    const bookingsMatch = text.match(/<div class="stat-number">(\d+)<\/div>\s*<div class="stat-label">Total Bookings<\/div>/);
    console.log('Live Registered Partners:', partnersMatch ? partnersMatch[1] : 'not found');
    console.log('Live Total Bookings:', bookingsMatch ? bookingsMatch[1] : 'not found');
  } catch (err) {
    console.error(err);
  }
}
run();
