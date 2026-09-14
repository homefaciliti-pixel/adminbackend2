const https = require('https');

function checkCommit(repo, sha) {
  const options = {
    hostname: 'api.github.com',
    path: `/repos/${repo}/commits/${sha}`,
    headers: {
      'User-Agent': 'Node.js'
    }
  };

  https.get(options, (res) => {
    console.log(`SHA: ${sha} | Status Code: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error(err);
  });
}

checkCommit('homefaciliti-pixel/partner_backend', '9398296b051e7be8ddf63318b6e5df0f89cc8824');
checkCommit('homefaciliti-pixel/partner_backend', '2932dfb637333b5e4c87625692ee8f61337b17ae');
