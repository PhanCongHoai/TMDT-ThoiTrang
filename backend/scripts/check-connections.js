const { poolPromise } = require('../src/config/db');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, PORT } = require('../src/config/env');

async function check(url, headers = {}) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  const body = await response.json();
  if (!response.ok || !['ok', 'success'].includes(body.status)) {
    throw new Error(`HTTP ${response.status}: ${body.message || body.detail || body.status}`);
  }
  console.log(`[OK] ${url}`);
}

async function main() {
  let pool;
  let failures = 0;
  async function verify(label, action) {
    try { await action(); } catch (error) {
      failures++;
      console.error(`[FAIL] ${label}: ${error.message}`);
    }
  }
  try {
    await verify('SQL Server', async () => {
      pool = await poolPromise;
      const result = await pool.request().query('SELECT DB_NAME() AS db, (SELECT COUNT(*) FROM sys.tables) AS tables, (SELECT COUNT(*) FROM products) AS products');
      console.log('[OK] SQL Server', result.recordset[0]);
    });
    await verify('Backend -> SQL Server', () => check(`http://127.0.0.1:${PORT}/api/health`));
    await verify('Frontend -> Backend -> SQL Server', () => check('http://127.0.0.1:3000/api/health'));
    for (const endpoint of ['products', 'categories', 'blogs']) {
      await verify(endpoint, () => check(`http://127.0.0.1:3000/api/v1/${endpoint}`));
    }
    const aiURL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
    const aiHeaders = { 'X-Internal-API-Key': process.env.AI_INTERNAL_API_KEY || 'auralie_internal_ml_secret_2026' };
    await verify('AI service', () => check(`${aiURL}/health`));
    await verify('AI -> SQL Server + internal key', () => check(`${aiURL}/api/ml/forecast?days=7`, aiHeaders));
    if (pool) {
      await verify('Admin APIs', async () => {
        const admin = (await pool.request().query("SELECT TOP 1 u.id, r.role_name AS role FROM users u JOIN roles r ON u.role_id = r.id WHERE r.role_name = 'ADMIN'")).recordset[0];
        if (!admin) throw new Error('No admin account found');
        // Temporary local test token; never printed or saved.
        const headers = { Authorization: `Bearer ${jwt.sign(admin, JWT_SECRET, { expiresIn: '2m' })}` };
        for (const endpoint of ['inquiries', 'newsletter-subscribers', 'analytics/overview', 'analytics/conversion-funnel', 'analytics/search', 'analytics/top-products', 'ai/forecast', 'ai/model-performance']) {
          await verify(endpoint, () => check(`http://127.0.0.1:3000/api/v1/admin/${endpoint}`, headers));
        }
      });
    }
  } finally {
    if (pool) await pool.close();
  }
  console.log(`Connection checks complete: ${failures} failure(s).`);
  process.exitCode = failures ? 1 : 0;
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
