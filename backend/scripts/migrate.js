const fs = require('fs');
const path = require('path');
const { sql, poolPromise } = require('../src/config/db');

async function main() {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const directory = path.resolve(__dirname, '../../database/migrations');
    const files = fs.readdirSync(directory)
      .filter(name => name.endsWith('.sql') && !name.includes('rollback')).sort();
    for (const file of files) {
      const batches = fs.readFileSync(path.join(directory, file), 'utf8')
        .split(/^\s*GO\s*$/im).filter(batch => batch.trim());
      for (const batch of batches) {
        await new sql.Request(transaction).batch(batch);
      }
      console.log(`[Migration] Applied ${file}`);
    }
    await transaction.commit();
    console.log('[Migration] Complete; existing data preserved.');
  } catch (error) {
    await transaction.rollback().catch(() => {});
    throw error;
  } finally {
    await pool.close();
  }
}

main().catch(error => {
  console.error('[Migration]', error.message);
  process.exitCode = 1;
});
