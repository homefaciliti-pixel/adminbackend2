const mysql = require('mysql2/promise');
require('dotenv').config();

// ============================================================
// DIRECT MySQL CONNECTION — No PHP bridge needed
// BigRock allows external MySQL connections from any IP.
// Direct connection is faster, more reliable, and has no
// rate-limiting issues unlike the HTTP bridge approach.
// ============================================================

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'homefaciliti.com',
  user:     process.env.DB_USER     || 'homef4fw_homefaci',
  password: process.env.DB_PASSWORD || 'Xnj3*t%F36RDK+!',
  database: process.env.DB_NAME     || 'homef4fw_homefaci',
  port:     parseInt(process.env.DB_PORT || '3306'),

  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  connectTimeout:     15000,   // 15s — enough for cold BigRock connection
  enableKeepAlive:    true,
  keepAliveInitialDelay: 30000,
  ssl: false
});

// Table prefix: all production tables are prefixed with "node_"
const dbHost      = process.env.DB_HOST || 'homefaciliti.com';
const tablePrefix = process.env.DB_PREFIX !== undefined
  ? process.env.DB_PREFIX
  : (dbHost === 'homefaciliti.com' || process.env.DB_USER === 'homef4fw_homefaci' ? 'node_' : '');

if (tablePrefix) {
  console.log(`🔧 SQL Table prefix: "${tablePrefix}"`);
}

// Auto-prefix table names in SQL queries
function prefixQuery(sql) {
  if (!tablePrefix) return sql;

  const tables = [
    'users', 'categories', 'services', 'orders', 'orders_v2', 'pages', 'partners',
    'booking_earnings', 'subscription_earnings', 'banners', 'states',
    'cities', 'localities', 'notifications', 'reviews', 'settings_config',
    'support_tickets', 'uploaded_files', 'admin_accounts'
  ];

  const regex = new RegExp(`\\b(FROM|JOIN|INTO|UPDATE|DESCRIBE|TABLE)\\s+\`?(${tables.join('|')})\`?\\b`, 'gi');
  return sql.replace(regex, (match, keyword, tableName) => `${keyword} \`${tablePrefix}${tableName}\``);
}

// Wrap pool.query to auto-prefix table names
const _query = pool.query.bind(pool);
pool.query = async function (sql, values) {
  const queryStr = prefixQuery(typeof sql === 'string' ? sql : (sql?.sql || ''));
  return _query(queryStr, values);
};

// Wrap pool.execute to auto-prefix table names
const _execute = pool.execute.bind(pool);
pool.execute = async function (sql, values) {
  const queryStr = prefixQuery(typeof sql === 'string' ? sql : (sql?.sql || ''));
  return _execute(queryStr, values);
};

// Verify connection on startup (non-blocking, just for logging)
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected directly to homefaciliti.com — no bridge needed.');
    conn.release();
  })
  .catch(err => {
    console.error('⚠️ MySQL direct connection error on startup:', err.message);
    console.error('   Check that BigRock Remote MySQL is enabled for this server IP.');
  });

module.exports = pool;
