const https = require('https');

function getCommit(repo) {
  const options = {
    hostname: 'api.github.com',
    path: `/repos/${repo}/commits/main?t=${Date.now()}`,
    headers: {
      'User-Agent': 'Node.js',
      'Cache-Control': 'no-cache'
    }
  };

  https.get(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log(`Repository: ${repo}`);
        console.log('Latest Commit SHA:', data.sha);
        console.log('Message:', data.commit.message);
        console.log('Author Date:', data.commit.author.date);
        console.log('-----------------------------------');
      } catch (err) {
        console.log('Error parsing response for:', repo, err.message);
      }
    });
  }).on('error', (err) => {
    console.error(err);
  });
}

getCommit('homefaciliti-pixel/partner_backend');
getCommit('homefaciliti-pixel/adminbackend');
