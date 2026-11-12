const fs = require('fs');
const path = require('path');
const { poolPromise, query } = require('../src/config/db');

async function testMigration() {
  console.log('--- BẮT ĐẦU KIỂM THỬ MIGRATION SNAPSHOT ---');
  const pool = await poolPromise;

  // 1. Kiểm tra trạng thái cột trước khi chạy
  const beforeCols = await query(`
    SELECT name FROM sys.columns 
    WHERE object_id = OBJECT_ID('order_items') 
      AND name IN ('product_name', 'sku', 'size', 'color')
  `);
  console.log('Số cột snapshot trước migration:', beforeCols.recordset.length);

  // 2. Chạy lần 1
  console.log('Chạy migration lần 1...');
  await applyMigration();

  const afterCols1 = await query(`
    SELECT name FROM sys.columns 
    WHERE object_id = OBJECT_ID('order_items') 
      AND name IN ('product_name', 'sku', 'size', 'color')
  `);
  console.log('Số cột snapshot sau lần 1:', afterCols1.recordset.length);

  // 3. Chạy lần 2 (kiểm tra tính idempotent)
  console.log('Chạy migration lần 2 (Idempotency test)...');
  await applyMigration();

  const afterCols2 = await query(`
    SELECT name FROM sys.columns 
    WHERE object_id = OBJECT_ID('order_items') 
      AND name IN ('product_name', 'sku', 'size', 'color')
  `);
  console.log('Số cột snapshot sau lần 2:', afterCols2.recordset.length);

  // 4. Kiểm tra dữ liệu cũ đã được backfill chưa
  const backfilled = await query(`
    SELECT TOP 5 id, order_id, product_name, sku, size, color 
    FROM order_items
  `);
  console.log('Dữ liệu cũ sau khi backfill:', backfilled.recordset);

  // Kiểm tra còn dòng nào bị NULL product_name không
  const nullCheck = await query(`
    SELECT COUNT(*) AS null_count 
    FROM order_items 
    WHERE product_name IS NULL
  `);
  console.log('Số dòng chưa có product_name:', nullCheck.recordset[0].null_count);

  await pool.close();
}

async function applyMigration() {
  const sqlFile = path.resolve(__dirname, '../../database/migrations/20261105_add_order_items_snapshot.sql');
  const content = fs.readFileSync(sqlFile, 'utf8');

  // Tách các khối lệnh bởi GO
  const batches = content
    .split(/^\s*GO\s*$/im)
    .map(b => b.trim())
    .filter(b => b.length > 0 && !b.startsWith('USE '));

  for (const batch of batches) {
    await query(batch);
  }
}

testMigration().catch(err => {
  console.error('LỖI KIỂM THỬ MIGRATION:', err);
  process.exit(1);
});

