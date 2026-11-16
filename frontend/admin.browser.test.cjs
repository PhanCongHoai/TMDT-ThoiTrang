// Browser regression tests use mocked API responses exclusively. No database writes.
// Requires Chrome headless already listening on localhost:9223 and Vite on :3000.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const targets = await (await fetch('http://127.0.0.1:9223/json/list')).json();
  const target = targets.find(row => row.type === 'page');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  let nextId = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const task = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) task.reject(new Error(message.error.message)); else task.resolve(message.result);
    }
    if (message.method === 'Page.javascriptDialogOpening') errors.push('Native browser dialog');
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  });
  function call(method, params = {}) {
    const id = ++nextId;
    return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  }
  async function evaluate(expression) {
    const result = await call('Runtime.evaluate', { expression: `(0,eval)(${JSON.stringify(expression)})`, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
  async function wait(expression) {
    for (let attempt = 0; attempt < 120; attempt++) {
      try { if (await evaluate(expression)) return; } catch { /* Page may be navigating. */ }
      await delay(100);
    }
    throw new Error(`Timeout: ${expression}`);
  }
  async function navigate(page) {
    await call('Page.navigate', { url: `http://localhost:3000/${page}` });
    await delay(300);
    await wait("document.readyState === 'complete' && !!window.Commerce");
  }
  const source = `(() => {
    window.Chart=class { constructor(ctx,config){this.data=config.data;this.options=config.options;} update(){} destroy(){} };
    window.__printCalls=0; window.print=()=>{window.__printCalls++;};
    localStorage.setItem('userRole','ADMIN'); sessionStorage.setItem('auralie_token','mock-admin-token');
    window.__calls=[]; window.__fixture={};
    window.__stockVariants=[{id:11,size:'M',color:'Black',stock_quantity:7},{id:12,size:'M',color:'White',stock_quantity:0}];
    window.__stockAdjustments=new Map();
    const user={id:22,full_name:'Test <Customer>',email:'customer@example.invalid',phone:'',address:'',vip_tier:'SILVER VIP',vip_points:0,total_spent:460000,role_name:'CUSTOMER',created_at:'2026-11-01'};
    const order={id:17,order_code:'TEST-17',customer_name:user.full_name,phone_number:'0912345678',shipping_address:'123 Test Street',total_amount:460000,status:'CONFIRMED',payment_method:'COD',payment_status:'UNPAID',created_at:'2026-11-15'};
    const product={id:1,name:'Fixture Dress',category:'Test Category',price:250000,tag:'NEW ARRIVAL',img:'assets/card_1.jpg'};
    window.fetch=async(url,options={})=>{
      const pathname=new URL(url,location.href).pathname;
      const body=options.body ? JSON.parse(options.body) : null;
      window.__calls.push({path:pathname,method:options.method||'GET',body});
      let data=[],status=200;
      if(pathname==='/api/v1/products' && options.method==='POST') { data={id:3}; if(window.__fixture.addFailure)status=400; }
      else if(pathname==='/api/v1/products') data=[product];
      else if(pathname==='/api/v1/admin/products') {
        if(window.__fixture.productsNetworkOnce){window.__fixture.productsNetworkOnce=false;throw new TypeError('Failed to fetch');}
        data=[product]; if(window.__fixture.productsFailure)status=503;
      }
      else if(pathname==='/api/v1/products/1' && options.method==='DELETE') { data=null; if(window.__fixture.deleteFailure)status=400; }
      else if(pathname==='/api/v1/admin/products/inventory') {const count=window.__stockVariants.reduce((sum,v)=>sum+v.stock_quantity,0);data=window.__fixture.inventoryMalformed?{items:[]}:[{product_id:1,remaining_quantity:window.__fixture.outOfStock?0:count,allocated_quantity:3,total_quantity:window.__fixture.outOfStock?3:count+3}];}
      else if(pathname==='/api/v1/admin/products/1/variants') data={product:{id:1,name:product.name},variants:window.__stockVariants};
      else if(pathname==='/api/v1/admin/inventory/adjust') {
        if(window.__stockAdjustments.has(body.requestId))data=window.__stockAdjustments.get(body.requestId);
        else {
          let variant=window.__stockVariants.find(v=>v.size===body.size&&v.color===body.color);
          const before=variant?variant.stock_quantity:0;
          if(before!==body.expectedStock || (body.operation==='EXPORT'&&(!variant||before<body.quantity))){status=409;data=null;}
          else {
            if(!variant){variant={id:99,size:body.size,color:body.color,stock_quantity:0};window.__stockVariants.push(variant);}
            variant.stock_quantity+=body.operation==='IMPORT'?body.quantity:-body.quantity;
            data={productId:1,variantId:variant.id,size:body.size,color:body.color,operation:body.operation,quantity:body.quantity,previousStock:before,stockQuantity:variant.stock_quantity};
            window.__stockAdjustments.set(body.requestId,data);
            if(window.__fixture.stockLoseResponse){window.__fixture.stockLoseResponse=false;throw new TypeError('Failed to fetch');}
          }
        }
      }
      else if(pathname==='/api/v1/admin/stats') data={totalRevenue:460000,totalOrders:1,totalProducts:1,totalStock:7,totalCustomers:1,avgRating:5,categories:[]};
      else if(pathname==='/api/v1/orders') data={items:[order]};
      else if(pathname==='/api/v1/users') data=[user];
      else if(pathname==='/api/v1/users/profile') data={...user,orders:[order]};
      else if(pathname==='/api/v1/orders/17') data={id:17,orderCode:'TEST-17',customerName:user.full_name,phoneNumber:order.phone_number,shippingAddress:order.shipping_address,createdAt:order.created_at,paymentMethod:'COD',paymentStatus:'UNPAID',status:'CONFIRMED',discountAmount:10000,shippingFee:20000,totalAmount:460000,items:[{productName:'Actual Silk Dress',size:'S',color:'Black',quantity:2,price:100000},{productName:'Actual Jacket',size:'L',color:'White',quantity:1,price:250000}]};
      return new Response(JSON.stringify({status:status===200?'success':'error',message:status===200?'OK':'Fixture API error',data}),{status,headers:{'Content-Type':'application/json'}});
    };
  })();`;
  try {
    await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable');
    await call('Network.setBlockedURLs',{urls:['*cdn.jsdelivr.net/npm/chart.js*']});
    await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
    const bootstrap=await call('Page.addScriptToEvaluateOnNewDocument',{source});
    await navigate('admin.html');
    await wait("!!document.querySelector('#admin-products-tbody .stock-remaining')");
    assert.equal(await evaluate("document.querySelector('.stock-remaining').textContent"),'7');
    assert.ok((await evaluate("document.querySelector('.stock-breakdown').textContent")).includes('Tổng: 10'));
    assert.ok((await evaluate("document.querySelector('.stock-breakdown').textContent")).includes('Đã đi đơn: 3'));
    assert.equal(await evaluate("document.getElementById('kpi-products').textContent"),'7 sản phẩm');
    console.log('PASS inventory and KPI show remaining units with total/allocated quantities');
    await evaluate('window.__fixture.outOfStock=true;loadAdminProducts()');
    await wait("document.querySelector('.stock-remaining')?.textContent==='0'");
    assert.ok((await evaluate("document.getElementById('admin-products-tbody').textContent")).includes('Chưa hiển thị / Hết hàng'));
    await evaluate('window.__fixture.outOfStock=false;loadAdminProducts()');
    await wait("document.querySelector('.stock-remaining')?.textContent==='7'");
    console.log('PASS admin retains out-of-stock products with a hidden/out-of-stock status');
    await evaluate('window.__fixture.productsNetworkOnce=true;loadAdminProducts()');
    assert.equal(await evaluate("document.querySelector('.stock-remaining').textContent"),'7');
    console.log('PASS temporary product API connection failure retries and recovers');
    await evaluate('window.__fixture.inventoryMalformed=true;loadAdminProducts()');
    assert.ok((await evaluate("document.getElementById('admin-products-tbody').textContent")).includes('Fixture Dress'));
    assert.ok((await evaluate("document.getElementById('admin-products-tbody').textContent")).includes('Chưa tải được tồn kho'));
    assert.ok((await evaluate("document.getElementById('admin-products-notice').textContent")).includes('không đúng định dạng'));
    await evaluate('window.__fixture.inventoryMalformed=false;window.__fixture.productsFailure=true;loadAdminProducts()');
    assert.equal(await evaluate("!!document.getElementById('retry-admin-products')"),true);
    assert.ok(!(await evaluate("document.getElementById('admin-products-tbody').textContent")).includes('Lỗi kết nối tới cơ sở dữ liệu'));
    await evaluate("window.__fixture.productsFailure=false;document.getElementById('retry-admin-products').click()");
    await wait("document.querySelector('.stock-remaining')?.textContent==='7'");
    console.log('PASS inventory failure retains products; real product errors expose retry and recover');

    const deletes=()=>evaluate("__calls.filter(c=>c.method==='DELETE').length");
    await evaluate('void deleteProduct(1)');
    await wait("!!document.querySelector('.commerce-dialog')");
    assert.ok((await evaluate("document.querySelector('.commerce-dialog').textContent")).includes('Fixture Dress'));
    await evaluate("document.querySelector('.commerce-cancel').click()");
    assert.equal(await deletes(),0);
    await evaluate('void deleteProduct(1)');
    await wait("!!document.querySelector('.commerce-dialog')");
    await evaluate("document.querySelector('.commerce-dialog form').requestSubmit()");
    await wait("!!document.querySelector('.commerce-dialog')?.textContent.includes('Đã xóa/ẩn')");
    assert.equal(await deletes(),1);
    await evaluate("document.querySelector('.commerce-close').click()");
    await delay(100);
    console.log('PASS product deletion requires website confirmation; cancel sends no DELETE');

    async function openStock(size='M',color='Black') {
      await evaluate("document.getElementById('btn-open-stock-modal').click()");
      await wait("!!document.getElementById('admin-stock-modal')");
      await evaluate("const f=document.querySelector('#admin-stock-modal form');f.elements.productId.value='1';f.elements.productId.dispatchEvent(new Event('change'))");
      await wait("!document.querySelector('#admin-stock-modal input[name=size]').disabled");
      await evaluate(`const f=document.querySelector('#admin-stock-modal form');f.elements.size.value=${JSON.stringify(size)};f.elements.size.dispatchEvent(new Event('input',{bubbles:true}));f.elements.color.value=${JSON.stringify(color)};f.elements.color.dispatchEvent(new Event('input',{bubbles:true}));`);
    }
    const stockPosts=()=>evaluate("__calls.filter(c=>c.path==='/api/v1/admin/inventory/adjust'&&c.method==='POST')");
    await openStock();
    assert.equal(await evaluate("document.getElementById('stock-current').textContent"),'7');
    await evaluate("const f=document.querySelector('#admin-stock-modal form');f.elements.quantity.value='2';f.elements.quantity.dispatchEvent(new Event('input',{bubbles:true}))");
    assert.equal(await evaluate("document.getElementById('stock-after').textContent"),'9');
    await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    assert.equal(await evaluate("document.querySelector('#admin-stock-modal .commerce-dialog').getBoundingClientRect().right<=innerWidth"),true);
    const stockShot=await call('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(path.join(os.tmpdir(),'auralie-stock-adjust.png'),Buffer.from(stockShot.data,'base64'));
    await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
    await evaluate("const f=document.querySelector('#admin-stock-modal form');f.requestSubmit();f.requestSubmit()");
    await wait("!!document.querySelector('.commerce-dialog')?.textContent.includes('Đã nhập 2')");
    assert.equal((await stockPosts()).length,1);
    await evaluate("document.querySelector('.commerce-close').click()");
    await delay(50);
    await wait("document.querySelector('.stock-remaining')?.textContent==='9'");
    console.log('PASS stock modal selects product/size/color, previews import and prevents double submit');

    await openStock();
    await evaluate("const f=document.querySelector('#admin-stock-modal form');f.elements.operation.value='EXPORT';f.elements.operation.dispatchEvent(new Event('change'));f.elements.quantity.value='10';f.elements.quantity.dispatchEvent(new Event('input',{bubbles:true}))");
    assert.equal(await evaluate("document.querySelector('#admin-stock-modal button[type=submit]').disabled"),true);
    await evaluate("const f=document.querySelector('#admin-stock-modal form');f.elements.quantity.value='3';f.elements.quantity.dispatchEvent(new Event('input',{bubbles:true}));f.requestSubmit()");
    await wait("!!document.querySelector('.commerce-dialog')?.textContent.includes('Đã xuất 3')");
    assert.equal(await evaluate("window.__stockVariants[0].stock_quantity"),6);
    await evaluate("document.querySelector('.commerce-close').click()");
    await delay(50);
    console.log('PASS export blocks overselling and updates exact variant stock');

    await openStock('XL','Blue');
    assert.equal(await evaluate("document.getElementById('stock-current').textContent"),'0');
    assert.equal(await evaluate("document.querySelector('#admin-stock-modal button[type=submit]').disabled"),false);
    await evaluate("const f=document.querySelector('#admin-stock-modal form');f.elements.operation.value='EXPORT';f.elements.operation.dispatchEvent(new Event('change'))");
    assert.equal(await evaluate("document.querySelector('#admin-stock-modal button[type=submit]').disabled"),true);
    await evaluate("document.querySelector('#admin-stock-modal .commerce-cancel').click()");
    await delay(50);
    assert.equal((await stockPosts()).length,2);
    console.log('PASS new size/color is import-only and cancelling never changes stock');

    await openStock();
    await evaluate("window.__fixture.stockLoseResponse=true;document.querySelector('#admin-stock-modal form').requestSubmit()");
    await wait("!!document.getElementById('stock-adjust-error')?.textContent && document.getElementById('stock-current').textContent==='7' && !document.querySelector('#admin-stock-modal button[type=submit]').disabled");
    await evaluate("document.querySelector('#admin-stock-modal form').requestSubmit()");
    await wait("!!document.querySelector('.commerce-dialog')?.textContent.includes('Đã nhập 1')");
    const stockCalls=await stockPosts();
    assert.equal(stockCalls.at(-1).body.requestId,stockCalls.at(-2).body.requestId);
    assert.equal(await evaluate("window.__stockVariants[0].stock_quantity"),7);
    await evaluate("document.querySelector('.commerce-close').click()");
    await delay(50);
    console.log('PASS retry after lost response reuses request ID and does not import twice');

    await evaluate('void AdminUI.customerDetails(22)');
    await wait("!!document.getElementById('admin-customer-modal')");
    const customerText=await evaluate("document.getElementById('admin-customer-modal').textContent");
    assert.ok(customerText.includes('Test <Customer>'));
    assert.ok(customerText.includes('Chưa cung cấp'));
    assert.ok(customerText.includes('123 Test Street'));
    assert.ok(!customerText.includes('Landmark 81'));
    const profileShot=await call('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(path.join(os.tmpdir(),'auralie-admin-customer.png'),Buffer.from(profileShot.data,'base64'));
    await evaluate("document.querySelector('#admin-customer-modal .commerce-close').click()");
    console.log('PASS customer modal groups actual profile, VIP and stored order delivery details');

    await evaluate('openAddProductModal()');
    await evaluate("document.getElementById('add-prod-name').value='Added Fixture'; document.getElementById('add-prod-price').value='250000'; const file=new File(['<svg/>'],'bad.svg',{type:'image/svg+xml'}); const transfer=new DataTransfer(); transfer.items.add(file); const input=document.getElementById('add-prod-image'); input.files=transfer.files; input.dispatchEvent(new Event('change'));");
    await wait("document.getElementById('add-prod-image-status').textContent.includes('Chỉ chọn')");
    const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
    await evaluate(`const bytes=Uint8Array.from(atob('${png}'),c=>c.charCodeAt(0));const transfer=new DataTransfer();transfer.items.add(new File([bytes],'product.png',{type:'image/png'}));const input=document.getElementById('add-prod-image');input.files=transfer.files;input.dispatchEvent(new Event('change'));`);
    await wait("!document.getElementById('add-prod-image-preview').hidden");
    await evaluate("document.getElementById('admin-add-product-form').requestSubmit(); document.getElementById('admin-add-product-form').requestSubmit()");
    await wait("!!document.querySelector('.commerce-dialog')?.textContent.includes('Đã thêm sản phẩm')");
    const posts=await evaluate("__calls.filter(c=>c.path==='/api/v1/products' && c.method==='POST')");
    assert.equal(posts.length,1);
    assert.ok(posts[0].body.imageData.startsWith('data:image/png;base64,'));
    assert.equal(await evaluate("document.getElementById('admin-add-product-modal').classList.contains('active')"),false);
    assert.equal(await evaluate("document.getElementById('add-prod-image-preview').hidden"),true);
    await evaluate("document.querySelector('.commerce-close').click()");
    console.log('PASS image validation/preview and one product submission include the selected image');

    await evaluate('void generatePDFInvoice(17); void generatePDFInvoice(17)');
    await wait("!!document.getElementById('admin-invoice-modal')");
    assert.equal(await evaluate("document.querySelectorAll('#admin-invoice-modal').length"),1);
    assert.equal(await evaluate("document.querySelectorAll('.invoice-document tbody tr').length"),2);
    const invoiceText=await evaluate("document.querySelector('.invoice-document').textContent");
    assert.ok(invoiceText.includes('Actual Silk Dress') && invoiceText.includes('Actual Jacket'));
    assert.ok(invoiceText.includes('460.000'));
    assert.ok(!invoiceText.includes('Double-Breasted Tailored Suit Cashmere'));
    await evaluate("document.getElementById('admin-print-invoice').click()");
    await wait("document.getElementById('admin-invoice-print-frame')?.contentWindow.__printCalls === 1");
    assert.equal(await evaluate("document.getElementById('admin-invoice-print-frame').contentDocument.querySelectorAll('.invoice-document').length"),1);
    assert.equal(await evaluate("document.getElementById('admin-invoice-print-frame').contentDocument.querySelectorAll('.admin-layout,.commerce-overlay').length"),0);
    const printHTML=await evaluate("document.getElementById('admin-invoice-print-frame').srcdoc");
    await evaluate("document.getElementById('admin-print-invoice').click()");
    assert.equal(await evaluate("document.querySelectorAll('#admin-invoice-print-frame').length"),1);
    await evaluate("document.getElementById('admin-invoice-print-frame').contentWindow.dispatchEvent(new Event('afterprint'))");
    await wait("!document.getElementById('admin-invoice-print-frame')");
    assert.equal(await evaluate("document.getElementById('admin-print-invoice').disabled"),false);
    await evaluate("document.querySelector('#admin-invoice-modal .commerce-close').click()");
    console.log('PASS invoice uses real order lines; printing isolates one invoice and cleans up after printing');

    await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    await evaluate('void AdminUI.customerDetails(22)');
    await wait("!!document.getElementById('admin-customer-modal')");
    assert.equal(await evaluate("document.querySelector('#admin-customer-modal .commerce-dialog').getBoundingClientRect().right<=innerWidth"),true);
    console.log('PASS customer modal fits mobile viewport');
    assert.deepEqual(errors,[],'Unexpected browser errors');

    await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:bootstrap.identifier});
    await call('Emulation.setDeviceMetricsOverride',{width:1200,height:1000,deviceScaleFactor:1,mobile:false});
    await call('Page.navigate',{url:'data:text/html;charset=utf-8,'+encodeURIComponent(printHTML)});
    await wait("!!document.querySelector('.invoice-document')");
    const pdf=await call('Page.printToPDF',{printBackground:true,preferCSSPageSize:true});
    const pdfPath=path.join(os.tmpdir(),'auralie-admin-invoice-test.pdf');
    fs.writeFileSync(pdfPath,Buffer.from(pdf.data,'base64'));
    console.log('PDF verification artifact:',pdfPath);
    console.log('All admin browser tests passed; API writes were mocked.');
  } finally { socket.close(); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
