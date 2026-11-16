// Isolated tests: fake SQL transactions and image writes; never connect to the DB.
const assert = require('node:assert/strict');
const path = require('node:path');
const dbPath = require.resolve('../src/config/db');
const state = { products: [], images: [], commits:0, rollbacks:0, failImage:false };
class Transaction {
  async begin() { this.snapshot={products:[...state.products],images:[...state.images]}; }
  async commit() { state.commits++; }
  async rollback() { state.products=this.snapshot.products; state.images=this.snapshot.images; state.rollbacks++; }
}
class Request {
  constructor(transaction) { this.transaction=transaction; this.inputs={}; }
  input(key,...values) { this.inputs[key]=values.at(-1); return this; }
  async query(sql) {
    assert.ok(this.transaction instanceof Transaction);
    if(sql.includes('INSERT INTO products')) {
      const id=state.products.length+1; state.products.push({id,...this.inputs}); return {recordset:[{id}]};
    }
    if(sql.includes('INSERT INTO product_images')) {
      if(state.failImage) throw new Error('Simulated image insert failure');
      state.images.push({...this.inputs}); return {recordset:[]};
    }
    throw new Error('Unexpected SQL');
  }
}
require.cache[dbPath]={id:dbPath,filename:dbPath,loaded:true,exports:{sql:{Transaction,Request,Int:'Int',NVarChar:()=> 'NVarChar'},poolPromise:Promise.resolve({}),query:()=>{throw new Error('Unexpected DB access');}}};
const Repository = require('../src/modules/products/products.repository');
const Image = require('../src/modules/products/product-image');
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
async function main() {
  assert.equal(Image.parseImage(png).extension,'png');
  assert.throws(()=>Image.parseImage('data:image/svg+xml;base64,PHN2Zy8+'),e=>e.statusCode===400);
  assert.throws(()=>Image.parseImage('data:image/png;base64,'+Buffer.from('not a PNG').toString('base64')),e=>e.statusCode===400);
  assert.throws(()=>Image.parseImage('data:image/png;base64,'+Buffer.alloc(2*1024*1024+1).toString('base64')),e=>e.statusCode===400);
  console.log('PASS image type, file signature and size validation');
  const product=await Repository.create({name:'Test Product',categoryId:1,basePrice:100000,imageUrl:'/uploads/products/test.png'});
  assert.equal(state.products.length,1); assert.equal(state.images[0].id,product.id); assert.equal(state.commits,1);
  state.failImage=true;
  await assert.rejects(Repository.create({name:'Rollback Product',basePrice:100000,imageUrl:'/uploads/products/fail.png'}));
  assert.equal(state.products.length,1); assert.equal(state.images.length,1); assert.equal(state.rollbacks,1);
  console.log('PASS product and image commit together; image error rolls back the new product');
  const repositoryPath=require.resolve('../src/modules/products/products.repository');
  require.cache[repositoryPath].exports={create:async()=>{throw new Error('Simulated DB failure');}};
  const saved=[]; const removed=[];
  Image.save=async image=>{saved.push(image);return{file:'mock-image',url:'/uploads/products/mock.png'};};
  Image.remove=async image=>{removed.push(image);};
  const Service=require('../src/modules/products/products.service');
  await assert.rejects(Service.createProduct({name:'Failure',imageData:png}));
  assert.equal(saved.length,1); assert.equal(removed[0].file,'mock-image');
  console.log('PASS failed product creation cleans up the uploaded image');
  console.log('All isolated checks passed; no files or database records were created.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
