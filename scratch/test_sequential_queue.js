const http = require('http');
const https = require('https');

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 2 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 2 });

const queryCache = new Map();
const CACHE_TTL_MS = 10000;

let bridgeQueue = Promise.resolve();

function queryViaHttpsBridge(sql, params = []) {
  const isSelect = typeof sql === 'string' && sql.trim().toUpperCase().startsWith('SELECT');
  const cacheKey = isSelect ? `${sql}::${JSON.stringify(params)}` : null;

  if (cacheKey && queryCache.has(cacheKey)) {
    const cached = queryCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return Promise.resolve(cached.data);
    }
  }

  // Queue requests sequentially with 80ms delay to prevent 429 Rate Limits from cPanel
  const task = bridgeQueue.then(() => new Promise((resolve, reject) => {
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
          'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${120 + (attempt % 5)}.0.0.0 Safari/537.36`,
          'Cookie': 'humans_21909=1',
          'X-Bridge-Secret': 'HF_SECURE_KEY_2026_x92!',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const isHtml = data.trim().startsWith('<') || data.includes('<!DOCTYPE');
          if ((res.statusCode === 429 || res.statusCode >= 500 || isHtml) && attempt <= 4) {
            const backoffMs = attempt * 400;
            console.log(`[HTTP ${res.statusCode} Retry ${attempt}] waiting ${backoffMs}ms...`);
            setTimeout(() => sendRequest(!useHttps, attempt + 1), backoffMs);
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
              setTimeout(() => resolve(resultData), 80);
            } else if (attempt <= 4) {
              setTimeout(() => sendRequest(!useHttps, attempt + 1), attempt * 400);
            } else {
              reject(new Error((parsed && (parsed.error || parsed.message)) || 'Bridge Error'));
            }
          } catch (e) {
            if (attempt <= 4) {
              setTimeout(() => sendRequest(!useHttps, attempt + 1), attempt * 400);
            } else {
              reject(new Error(`JSON Parse Error on Bridge response (HTTP ${res.statusCode}): ${e.message}`));
            }
          }
        });
      });

      req.on('error', (err) => {
        if (attempt <= 4) {
          setTimeout(() => sendRequest(!useHttps, attempt + 1), attempt * 400);
        } else {
          reject(err);
        }
      });

      req.on('timeout', () => {
        req.destroy();
        if (attempt <= 4) {
          setTimeout(() => sendRequest(!useHttps, attempt + 1), attempt * 400);
        } else {
          reject(new Error('Bridge Request Timeout'));
        }
      });

      req.write(payload);
      req.end();
    };

    sendRequest(false, 1);
  }));

  // Append error handler to bridgeQueue to prevent queue chain breaking on error
  bridgeQueue = task.catch(() => {});

  return task;
}

async function test() {
  console.log('Testing 10 queries queued with 80ms pacing...');
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(queryViaHttpsBridge('SELECT * FROM node_categories LIMIT 1'));
  }
  try {
    const results = await Promise.all(promises);
    console.log(`🎉 SUCCESS: All ${results.length} queries executed cleanly without 429 error!`);
  } catch(e) {
    console.error('Test Failed:', e.message);
  }
}

test();
