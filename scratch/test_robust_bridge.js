const http = require('http');
const https = require('https');

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 2 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 2 });

const queryCache = new Map();
const CACHE_TTL = 15000; // 15 seconds cache for SELECT queries

function queryViaHttpsBridge(sql, params = []) {
  return new Promise((resolve, reject) => {
    const isSelect = typeof sql === 'string' && sql.trim().toUpperCase().startsWith('SELECT');
    const cacheKey = isSelect ? `${sql}::${JSON.stringify(params)}` : null;

    if (cacheKey && queryCache.has(cacheKey)) {
      const cached = queryCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return resolve(cached.data);
      }
    }

    const payload = JSON.stringify({ sql, params: params || [] });

    const sendRequest = (useHttps = false, attempt = 1) => {
      const protocol = useHttps ? https : http;
      const port = useHttps ? 443 : 80;
      const agent = useHttps ? httpsAgent : httpAgent;

      const req = protocol.request({
        hostname: 'homefaciliti.com',
        port: port,
        path: '/public/db_bridge.php',
        method: 'POST',
        agent: agent,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cookie': 'humans_21909=1',
          'X-Bridge-Secret': 'HF_SECURE_KEY_2026_x92!',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 8000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 429 && attempt <= 3) {
            console.log(`[429 Rate-Limited] Retrying attempt ${attempt + 1} after ${attempt * 400}ms...`);
            setTimeout(() => sendRequest(useHttps, attempt + 1), attempt * 400);
            return;
          }

          try {
            let cleanData = data;
            const firstBrace = cleanData.indexOf('{');
            const lastBrace = cleanData.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              cleanData = cleanData.substring(firstBrace, lastBrace + 1);
            }
            const parsed = JSON.parse(cleanData);
            if (parsed && parsed.success) {
              let resultData;
              if (parsed.rows !== undefined) {
                resultData = [parsed.rows, []];
              } else {
                resultData = [{ affectedRows: parsed.affectedRows, insertId: parsed.insertId }, []];
              }
              if (cacheKey) {
                queryCache.set(cacheKey, { timestamp: Date.now(), data: resultData });
              }
              resolve(resultData);
            } else if (!useHttps) {
              sendRequest(true, attempt);
            } else if (attempt <= 3) {
              setTimeout(() => sendRequest(useHttps, attempt + 1), attempt * 400);
            } else {
              reject(new Error((parsed && (parsed.error || parsed.message)) || 'Bridge Error'));
            }
          } catch (e) {
            if (attempt <= 3) {
              console.log(`[Parse Error] HTTP ${res.statusCode} - Retrying attempt ${attempt + 1}...`);
              setTimeout(() => sendRequest(!useHttps, attempt + 1), attempt * 400);
            } else {
              reject(new Error(`JSON Parse Error on Bridge response (HTTP ${res.statusCode}): ${e.message} (Raw snippet: ${data.substring(0, 100)})`));
            }
          }
        });
      });

      req.on('error', (err) => {
        if (attempt <= 3) {
          setTimeout(() => sendRequest(!useHttps, attempt + 1), attempt * 400);
        } else {
          reject(err);
        }
      });

      req.on('timeout', () => {
        req.destroy();
        if (attempt <= 3) {
          setTimeout(() => sendRequest(!useHttps, attempt + 1), attempt * 400);
        } else {
          reject(new Error('Bridge Request Timeout'));
        }
      });

      req.write(payload);
      req.end();
    };

    sendRequest(false, 1);
  });
}

// Test firing 10 queries simultaneously with agents & retry logic
async function test() {
  console.log('Testing 10 simultaneous queries through robust bridge...');
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(queryViaHttpsBridge('SELECT * FROM node_categories LIMIT 1'));
  }
  try {
    const results = await Promise.all(promises);
    console.log(`Successfully completed all 10 queries! Result count: ${results.length}`);
  } catch(e) {
    console.error('Test Failed:', e.message);
  }
}

test();
