const fs = require('fs');
const path = require('path');
const { poolPromise, query } = require('../src/config/db');

async function applySqlFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const batches = content
    .split(/^\s*GO\s*$/im)
    .map(b => b.trim())
    .filter(b => b.length > 0 && !b.toUpperCase().startsWith('USE '));

  for (const batch of batches) {
    await query(batch);
  }
}

async function main() {
  const pool = await poolPromise;
  const migFile = path.resolve(__dirname, '../../database/migrations/20261112_behavior_and_ai_forecasting.sql');

  console.log('Running migration (pass 1)...');
  await applySqlFile(migFile);

  console.log('Running migration (pass 2 - idempotency check)...');
  await applySqlFile(migFile);

  const tables = await query(`
    SELECT name FROM sys.tables 
    WHERE name IN (
      'tracking_consents','user_sessions','user_events','user_search_history',
      'product_interactions','user_behavior_daily','ProductDailyMetrics',
      'ProductInventorySnapshots','MLModelVersions','MLTrainingLogs',
      'ProductForecasts','MLMonitoringAlerts'
    )
    ORDER BY name
  `);
  console.log(`Verified ${tables.recordset.length}/12 tables created:`, tables.recordset.map(t => t.name).join(', '));
  await pool.close();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

