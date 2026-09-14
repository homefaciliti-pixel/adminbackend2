const https = require('https');

function getCommits(repo) {
  const options = {
    hostname: 'api.github.com',
    path: `/repos/${repo}/commits?sha=main&per_page=5&t=${Date.now()}`,
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
        data.forEach(c => {
          console.log(`- SHA: ${c.sha} | Message: ${c.commit.message} | Date: ${c.commit.author.date}`);
        });
        console.log('-----------------------------------');
      } catch (err) {
        console.log('Error parsing response for:', repo, err.message);
      }
    });
  }).on('error', (err) => {
    console.error(err);
  });
}

getCommits('homefaciliti-pixel/partner_backend');
getCommits('homefaciliti-pixel/adminbackend');
