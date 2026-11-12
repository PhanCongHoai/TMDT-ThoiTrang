const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query, poolPromise } = require('../src/config/db');

async function main() {
  const pool = await poolPromise;
  const cols = await query(`
    SELECT name, max_length, is_nullable 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('order_items')
    ORDER BY column_id
  `);
  console.log('Columns in order_items:', cols.recordset);

  const sampleRows = await query(`
    SELECT TOP 5 id, order_id, variant_id, quantity, price
    FROM order_items
  `);
  console.log('Sample rows in order_items:', sampleRows.recordset);

  await pool.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

