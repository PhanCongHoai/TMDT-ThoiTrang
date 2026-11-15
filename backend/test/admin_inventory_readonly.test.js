// Executes SELECT-only fixture CTEs against SQL Server; no tables are changed.
const assert = require('node:assert/strict');
const db = require('../src/config/db');
const realQuery = db.query;
db.query = sql => {
  const fixtures = `WITH products AS (SELECT * FROM (VALUES(1,1),(2,1),(3,0)) AS x(id,is_active)),
    product_variants AS (SELECT * FROM (VALUES(11,1,7),(12,1,3),(31,3,50)) AS x(id,product_id,stock_quantity)),
    orders AS (SELECT * FROM (VALUES(1,'CONFIRMED'),(2,'PENDING'),(3,'COMPLETED'),(4,'CANCELLED'),(5,'SHIPPED'),(6,'PROCESSING')) AS x(id,status)),
    order_items AS (SELECT * FROM (VALUES(11,1,2),(12,2,1),(11,3,4),(11,4,100),(12,5,3),(12,6,1)) AS x(variant_id,order_id,quantity)), Stock AS (`;
  return realQuery(sql.replace('WITH Stock AS (', fixtures));
};
const Repository = require('../src/modules/products/products.repository');
(async()=>{
  const pool=await db.poolPromise;
  try {
    const rows=await Repository.getInventory();
    assert.equal(rows.length,2);
    assert.deepEqual(rows.find(row=>row.product_id===1),{product_id:1,remaining_quantity:10,allocated_quantity:11,total_quantity:21});
    assert.deepEqual(rows.find(row=>row.product_id===2),{product_id:2,remaining_quantity:0,allocated_quantity:0,total_quantity:0});
    console.log('PASS inventory totals exclude cancelled orders and inactive products, handle zero-stock products, and do not subtract reserved stock twice.');
    console.log('SELECT-only fixtures complete; database tables unchanged.');
  } finally {await pool.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
