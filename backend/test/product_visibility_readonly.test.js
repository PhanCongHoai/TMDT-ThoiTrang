// SELECT-only fixtures exercise the actual SQL queries without changing any tables.
const assert = require('node:assert/strict');
const db = require('../src/config/db');
const query = db.query;
const fixtures = `WITH products AS (
  SELECT id,category_id,is_active,CONCAT('Product ',id) AS name,CONCAT('product-',id) AS slug,
    'Description' AS description,CAST(100000 AS DECIMAL(18,2)) AS base_price,'NEW' AS tag,
    'Cotton' AS material,'Regular' AS fit,'' AS lining,'' AS hardware,'' AS origin
  FROM (VALUES(1,1,1),(2,1,1),(3,1,0),(4,1,1),(5,1,1),(6,1,1)) AS x(id,category_id,is_active)
), product_variants AS (
  SELECT * FROM (VALUES(11,1,3),(12,1,0),(21,2,0),(31,3,10),(51,5,-5),(52,5,2),(61,6,2),(62,6,3)) AS x(id,product_id,stock_quantity)
), categories AS (SELECT 1 AS id,'Fixture Category' AS name,'fixture' AS slug,'Description' AS description),
product_images AS (SELECT CAST(NULL AS INT) AS id,CAST(NULL AS INT) AS product_id,CAST(NULL AS NVARCHAR(100)) AS image_url,0 AS is_thumbnail WHERE 1=0),
product_reviews AS (SELECT CAST(NULL AS INT) AS id,CAST(NULL AS INT) AS product_id,CAST(NULL AS FLOAT) AS rating WHERE 1=0)
`;
db.query = (sql, inputs) => query(fixtures + sql, inputs);
const Repository = require('../src/modules/products/products.repository');
(async()=>{
  const pool=await db.poolPromise;
  try {
    const visible=await Repository.findAll({});
    assert.deepEqual(visible.map(p=>p.id),[1,6]);
    assert.deepEqual(visible.map(p=>p.stock_quantity),[3,5]);
    assert.ok(visible.every(p=>p.stock_quantity>0));
    console.log('PASS storefront excludes zero/missing/nonpositive stock and inactive products');
    const filtered=await Repository.findAll({category:'fixture',search:'Product',tag:'NEW'});
    assert.deepEqual(filtered.map(p=>p.id),[1,6]);
    const admin=await Repository.findAll({includeOutOfStock:true});
    assert.deepEqual(admin.map(p=>p.id),[1,2,4,5,6]);
    console.log('PASS search/category filters enforce stock while admin still sees out-of-stock products');
    assert.equal(await Repository.findById(2),null);
    assert.equal(await Repository.findById(4),null);
    assert.equal((await Repository.findById(1)).stock_quantity,3);
    const categories=await Repository.findAllCategories();
    assert.equal(categories[0].product_count,2);
    console.log('PASS product details and category counts follow the same availability rule');
    console.log('SELECT-only checks passed; no database records changed.');
  } finally {await pool.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
