// In-memory transactions only. No SQL Server connection or real stock changes.
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const dbPath=require.resolve('../src/config/db');
let state={products:[{id:1,name:'Product One',base_price:100000,is_active:1},{id:2,name:'New Product',base_price:200000,is_active:1}],variants:[{id:11,product_id:1,size:'M',color:'Black',stock_quantity:7}],logs:[]};
let lock=Promise.resolve(),failLog=false;
class Transaction {
  async begin(){const previous=lock;lock=new Promise(resolve=>{this.release=resolve;});await previous;this.snapshot=structuredClone(state);}
  async commit(){this.release();}
  async rollback(){state=this.snapshot;this.release();}
}
class Request {
  constructor(transaction){this.transaction=transaction;this.inputs={};}
  input(key,...values){this.inputs[key]=values.at(-1);return this;}
  async query(sql){
    const p=this.inputs;
    if(sql.includes('FROM products WITH'))return{recordset:state.products.filter(x=>x.id===p.productId&&x.is_active)};
    if(sql.includes('FROM inventory_imports WITH'))return{recordset:state.logs.filter(x=>x.batch_code===p.batchCode)};
    if(sql.includes('FROM product_variants WITH'))return{recordset:state.variants.filter(x=>x.product_id===p.productId&&x.size.toLowerCase()===p.size.toLowerCase()&&x.color.toLowerCase()===p.color.toLowerCase()).map(x=>({...x}))};
    if(sql.includes('INSERT INTO product_variants')){const id=100+state.variants.length;state.variants.push({id,product_id:p.productId,size:p.size,color:p.color,stock_quantity:p.quantity});return{recordset:[{id}]};}
    if(sql.includes('UPDATE product_variants')){const v=state.variants.find(x=>x.id===p.variantId&&x.stock_quantity===p.before);if(v)v.stock_quantity=p.quantity;return{rowsAffected:[v?1:0]};}
    if(sql.includes('INSERT INTO inventory_imports')){if(failLog)throw Error('Simulated log failure');state.logs.push({batch_code:p.batchCode,total_quantity:p.quantity,notes:p.notes});return{recordset:[]};}
    throw Error('Unexpected SQL');
  }
}
require.cache[dbPath]={id:dbPath,filename:dbPath,loaded:true,exports:{sql:{Transaction,Request,Int:'Int',MAX:'MAX',NVarChar:()=> 'NVARCHAR',Decimal:()=> 'DECIMAL'},poolPromise:Promise.resolve({}),query:()=>{throw Error('Unexpected real DB call');}}};
const Service=require('../src/modules/admin/inventory.service');
const actor={id:1,role:'ADMIN'};
const input=(extra={})=>({productId:1,size:'M',color:'Black',operation:'IMPORT',quantity:3,expectedStock:7,reason:'Test adjustment',requestId:randomUUID(),...extra});
(async()=>{
  const first=input();const added=await Service.adjust(first,actor);
  assert.equal(added.stockQuantity,10);assert.equal(state.logs[0].total_quantity,3);
  const repeated=await Service.adjust(first,actor);
  assert.equal(repeated.stockQuantity,10);assert.equal(repeated.repeated,true);assert.equal(state.logs.length,1);
  await assert.rejects(Service.adjust({...first,quantity:4},actor),e=>e.statusCode===409);
  console.log('PASS import logs stock change once; duplicate requests are not applied twice');
  const exported=await Service.adjust(input({operation:'EXPORT',quantity:4,expectedStock:10}),actor);
  assert.equal(exported.stockQuantity,6);assert.equal(state.logs[1].total_quantity,-4);
  await assert.rejects(Service.adjust(input({operation:'EXPORT',quantity:7,expectedStock:6}),actor),e=>e.statusCode===400);
  assert.equal(state.variants[0].stock_quantity,6);
  console.log('PASS export subtracts the chosen quantity and blocks negative stock');
  const created=await Service.adjust(input({productId:2,size:'S',color:'Blue',quantity:2,expectedStock:0}),actor);
  assert.equal(created.stockQuantity,2);assert.equal(state.variants.length,2);
  await assert.rejects(Service.adjust(input({productId:2,size:'XL',color:'White',operation:'EXPORT',quantity:1,expectedStock:0}),actor),e=>e.statusCode===400);
  console.log('PASS import creates a missing size/color; export cannot create one');
  await assert.rejects(Service.adjust(input({expectedStock:7}),actor),e=>e.statusCode===409);
  for(const quantity of [0,-1,1.5,true,[1],' '])await assert.rejects(Service.adjust(input({quantity}),actor),e=>e.statusCode===400);
  await assert.rejects(Service.adjust(input(),{id:2,role:'CUSTOMER'}),e=>e.statusCode===403);
  console.log('PASS stale stock, invalid quantities and non-admin adjustments are rejected');
  const before=structuredClone(state);failLog=true;
  await assert.rejects(Service.adjust(input({expectedStock:6,quantity:1}),actor));
  assert.deepEqual(state,before);failLog=false;
  console.log('PASS log failure rolls back the stock mutation');
  const parallel=await Promise.allSettled([Service.adjust(input({operation:'EXPORT',quantity:4,expectedStock:6}),actor),Service.adjust(input({operation:'EXPORT',quantity:4,expectedStock:6}),actor)]);
  assert.equal(parallel.filter(x=>x.status==='fulfilled').length,1);
  assert.equal(parallel.find(x=>x.status==='rejected').reason.statusCode,409);
  assert.equal(state.variants[0].stock_quantity,2);
  console.log('PASS concurrent exports serialize and reject the stale second request');
  console.log('All inventory adjustment tests passed; real database unchanged.');
})().catch(e=>{console.error(e);process.exitCode=1;});
