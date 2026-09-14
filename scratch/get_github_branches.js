const https = require('https');

function getBranches(repo) {
  const options = {
    hostname: 'api.github.com',
    path: `/repos/${repo}/branches`,
    headers: {
      'User-Agent': 'Node.js'
    }
  };

  https.get(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log(`Repository: ${repo}`);
        console.log('Branches:', data.map(b => b.name));
        console.log('-----------------------------------');
      } catch (err) {
        console.log('Error parsing response for:', repo, err.message);
      }
    });
  }).on('error', (err) => {
    console.error(err);
  });
}

getBranches('homefaciliti-pixel/partner_backend');
getBranches('homefaciliti-pixel/adminbackend');
