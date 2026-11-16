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
  const setup = `(() => {
    const config = JSON.parse(localStorage.getItem('__commerce_test_config') || '{"auth":false}');
    window.__fixture = config;
    const user = { id: 918273, fullName: 'Test Customer', email: 'test@example.invalid', role: 'CUSTOMER', phone: '', address: '' };
    if (config.auth) { sessionStorage.setItem('auralie_token', 'mock-token'); sessionStorage.setItem('auralie_user', JSON.stringify(user)); localStorage.setItem('userRole','CUSTOMER'); localStorage.setItem('userName',user.fullName); }
    else { sessionStorage.removeItem('auralie_token'); localStorage.removeItem('userRole'); }
    navigator.sendBeacon = () => true;
    const order = { id:123, orderCode:'TEST-ORDER', userId:user.id, customerName:user.fullName, totalAmount:500000, status:'CONFIRMED', paymentStatus:'UNPAID', paymentMethod:'COD', phoneNumber:'0912345678', shippingAddress:'123 Test Street, Test City', isFullyVerified:true, trackingCode:null, items:[{id:1,variantId:12,productId:3,productName:'Test Dress',name:'Test Dress',quantity:2,price:250000,size:'M',color:'Black'}] };
    const assetFetch = window.fetch.bind(window);
    window.fetch = async (url, options = {}) => {
      const pathname = new URL(url, location.href).pathname;
      if (pathname === '/assets/vn-addresses.json') return assetFetch(url, options);
      const calls = JSON.parse(localStorage.getItem('__commerce_test_calls') || '[]');
      calls.push({path:pathname, method:options.method || 'GET', body:options.body ? JSON.parse(options.body) : null});
      localStorage.setItem('__commerce_test_calls', JSON.stringify(calls));
      let data = [], status = 200;
      if (pathname.endsWith('/auth/me')) { data=user; if (!config.auth) status=401; }
      else if (pathname.endsWith('/users/shipping-info')) data={fullName:user.fullName,phone:'',address:''};
      else if (pathname.endsWith('/users/profile')) data={...user,full_name:user.fullName,orders:[{id:123,order_code:'TEST-ORDER',status:'CONFIRMED',payment_method:'COD',payment_status:'UNPAID',total_amount:500000,created_at:'2026-11-15'}]};
      else if (pathname === '/api/v1/orders/123') data={...order,items:config.reorderItems || order.items};
      else if (pathname.includes('/orders/track/')) { data=order; if(config.trackFailure) status=500; }
      else if (pathname.endsWith('/orders') && options.method === 'POST') {
        if (config.orderFailure) status=400;
        data={orderCode:'MOCK-NEW-ORDER',totalAmount:500000,qrCodeUrl:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',bankInfo:{accountNumber:'000000',accountName:'Test',bankCode:'TEST',bankShortName:'TEST'}};
      }
      else if (pathname.includes('/payment-status')) data={isPaid:!!config.paid};
      else if (pathname.endsWith('/coupons/apply')) { data={discountAmount:JSON.parse(options.body).orderAmount * 0.1}; if(config.couponFailure) status=400; }
      else if (pathname.endsWith('/sepay/config')) data={bankCode:'TEST',accountNumber:'000000',accountName:'TEST'};
      else if (pathname.includes('/products')) data=[];
      return new Response(JSON.stringify({status:status===200?'success':'error',message:status===200?'OK':'Test API failure',data}), {status,headers:{'Content-Type':'application/json'}});
    };
  })();`;
  try {
    await call('Page.enable');
    await call('Runtime.enable');
    await call('Emulation.setDeviceMetricsOverride', {width:1440,height:1000,deviceScaleFactor:1,mobile:false});
    await call('Page.addScriptToEvaluateOnNewDocument', { source: setup });
    await navigate('cart.html');
    await evaluate("localStorage.clear(); sessionStorage.clear();");
    await navigate('cart.html');
    await evaluate("void addToCart({id:3,name:'Test Dress',price:250000});");
    await wait("!!document.querySelector('.commerce-overlay')");
    assert.equal(await evaluate('getCart().length'), 0);
    await evaluate("document.querySelector('.commerce-cancel').click()");
    console.log('PASS guest cannot add to cart');

    await evaluate("void Commerce.openTracker()");
    await wait("!!document.querySelector('input[name=code]')");
    await evaluate("document.querySelector('.commerce-close').click()");
    console.log('PASS order lookup opens a website modal');

    await navigate('wishlist.html');
    await evaluate("document.querySelector('a[href=\"cart.html\"].btn-primary-luxury').click()");
    await wait("!!document.querySelector('.commerce-overlay')");
    assert.equal(await evaluate('getCart().length'), 0);
    await evaluate("document.querySelector('.commerce-cancel').click()");
    console.log('PASS guest cannot add all wishlist products to cart');

    await evaluate("localStorage.setItem('__commerce_test_config',JSON.stringify({auth:true})); localStorage.setItem('auralie_cart',JSON.stringify([{id:3,name:'Test Dress',size:'M',color:'Black',qty:1,price:250000,img:'assets/card_1.jpg'},{id:8,name:'Keep In Cart',qty:2,price:100000}]));");
    await navigate('cart.html');
    assert.equal(await evaluate("document.getElementById('btn-proceed-checkout').disabled"), true);
    await evaluate('selectCartItem(0,true)');
    assert.equal(await evaluate('currentCartTotal'), 250000);
    await evaluate('selectAllCart(true)');
    assert.equal(await evaluate('currentCartTotal'), 450000);
    await evaluate('selectCartItem(1,false)');
    console.log('PASS ticked products determine the checkout subtotal');

    await evaluate("document.getElementById('coupon-code-input').value='TEST10'; document.getElementById('apply-coupon-btn').click()");
    await wait("!!document.querySelector('.commerce-dialog')?.textContent.includes('Đã áp dụng mã')");
    await evaluate("document.querySelector('.commerce-close').click(); document.getElementById('btn-proceed-checkout').click()");
    await wait("location.pathname.endsWith('/checkout.html') && !!document.getElementById('checkout-shipping-form') && !document.getElementById('btn-proceed-checkout').disabled");
    assert.equal(await evaluate("!!document.querySelector('.commerce-overlay')"), false);
    assert.equal(await evaluate("[...document.querySelectorAll('#payment-method-group .payment-method-card')].filter(c=>getComputedStyle(c).display!=='none' && c.offsetHeight>0).length"), 3);
    assert.equal(await evaluate("document.querySelectorAll('select[name=paymentMethod]').length"), 0);
    const countOrders = () => evaluate("JSON.parse(localStorage.getItem('__commerce_test_calls')).filter(c=>c.path==='/api/v1/orders' && c.method==='POST').length");
    assert.equal(await countOrders(), 0);
    console.log('PASS checkout opens a separate page with all three original payment cards visible');

    await evaluate("document.getElementById('btn-proceed-checkout').click()");
    await delay(200);
    assert.equal(await countOrders(), 0);
    await evaluate("const f=document.getElementById('checkout-shipping-form'); f.elements.fullName.value='Recipient Test'; f.elements.phone.value='0912345678'; f.elements.province.value=f.querySelector('datalist[id$=\"-provinces\"] option').value; f.elements.province.dispatchEvent(new Event('input')); f.elements.ward.value=f.querySelector('datalist[id$=\"-wards\"] option').value; f.elements.ward.dispatchEvent(new Event('input')); f.elements.street.value='Test Street'; f.elements.street.dispatchEvent(new Event('input')); f.elements.houseNumber.value='123'; f.elements.houseNumber.dispatchEvent(new Event('input'));");
    await evaluate("document.querySelector('[data-method=COD]').click()");
    assert.equal(await evaluate("document.querySelector('[data-method=COD]').getAttribute('aria-checked')"), 'true');
    assert.equal(await evaluate('appliedCouponCode'), 'TEST10');
    await evaluate("document.getElementById('btn-proceed-checkout').click()");
    await wait("getCart().length===1 && getCart()[0].id===8");
    let payload = await evaluate("JSON.parse(localStorage.getItem('__commerce_test_calls')).findLast(c=>c.path==='/api/v1/orders' && c.method==='POST').body");
    assert.equal(payload.items.length, 1);
    assert.equal(payload.items[0].id, 3);
    assert.equal(payload.paymentMethod, 'COD');
    assert.equal(payload.fullName, 'Recipient Test');
    assert.ok(payload.address.startsWith('123, Test Street,'));
    assert.equal(payload.couponCode, 'TEST10');
    assert.equal(await evaluate('getCart()[0].qty'), 2);
    console.log('PASS missing address is entered on checkout page; only explicit confirmation creates the selected order');

    await evaluate("const entries=JSON.parse(localStorage.getItem('auralie_shipping_918273')); entries.push({...entries[0],fullName:'Office Recipient',phone:'0987654321',street:'Office Street',houseNumber:'456',address:entries[0].address.replace('123, Test Street','456, Office Street')}); localStorage.setItem('auralie_shipping_918273',JSON.stringify(entries));");

    await navigate('cart.html');
    await evaluate("saveCart([{id:3,name:'Test Dress',size:'M',color:'Black',qty:1,price:250000,selected:true},{id:8,name:'Keep In Cart',qty:2,price:100000}]); document.getElementById('btn-proceed-checkout').click()");
    await wait("location.pathname.endsWith('/checkout.html') && !!document.getElementById('checkout-address') && !document.getElementById('btn-proceed-checkout').disabled");
    assert.equal(await countOrders(), 1);
    assert.equal(await evaluate("document.querySelectorAll('select[name=addressIndex]').length"), 0);
    assert.equal(await evaluate("document.querySelector('.checkout-delivery').getBoundingClientRect().top - document.querySelector('.checkout-heading').getBoundingClientRect().bottom <= 24"), true);
    await evaluate("document.getElementById('change-delivery-address').click()");
    await wait("document.querySelectorAll('.address-book-option').length === 2");
    const addressBook = await call('Page.captureScreenshot', {format:'png'});
    fs.writeFileSync(path.join(os.tmpdir(), 'auralie-address-book.png'), Buffer.from(addressBook.data, 'base64'));
    await evaluate("document.querySelector('.address-book-option input[value=\"1\"]').checked=true; document.querySelector('.commerce-cancel').click()");
    assert.equal(await evaluate("document.querySelector('.delivery-person strong').textContent"), 'Recipient Test');
    await evaluate("document.getElementById('change-delivery-address').click()");
    await wait("document.querySelectorAll('.address-book-option').length === 2");
    await evaluate("document.querySelector('.address-book-option input[value=\"1\"]').checked=true; document.querySelector('.commerce-dialog form').requestSubmit()");
    await wait("document.querySelector('.delivery-person strong')?.textContent === 'Office Recipient'");
    await navigate('checkout.html');
    await wait("document.querySelector('.delivery-person strong')?.textContent === 'Office Recipient' && !document.getElementById('btn-proceed-checkout').disabled");
    assert.equal(await countOrders(), 1);
    console.log('PASS grouped address cards support cancel, selection and restoration without creating orders');
    await evaluate("document.querySelector('[data-method=VISA]').click(); document.getElementById('coupon-code-input').value='TEST10'; document.getElementById('apply-coupon-btn').click()");
    await wait("!!document.querySelector('.commerce-dialog')?.textContent.includes('Đã áp dụng mã')");
    await evaluate("document.querySelector('.commerce-close').click(); document.querySelector('.checkout-edit-address').click()");
    await wait("location.pathname.endsWith('/shipping.html') && !!document.getElementById('shipping-form') && !document.querySelector('#shipping-form button[type=submit]').disabled");
    assert.equal(await evaluate("!!document.querySelector('.d-header') && !!document.querySelector('footer')"), true);
    assert.equal(await evaluate("const card=document.querySelector('.shipping-card').getBoundingClientRect(),button=document.querySelector('#shipping-form button[type=submit]').getBoundingClientRect(); Math.abs((button.left+button.right)/2-(card.left+card.right)/2)<2"), true);
    const shippingView = await call('Page.captureScreenshot', {format:'png',captureBeyondViewport:true});
    fs.writeFileSync(path.join(os.tmpdir(), 'auralie-shipping-page.png'), Buffer.from(shippingView.data, 'base64'));
    await evaluate("const f=document.getElementById('shipping-form'); f.elements.houseNumber.value='321'; f.elements.houseNumber.dispatchEvent(new Event('input')); f.requestSubmit();");
    await wait("location.pathname.endsWith('/checkout.html') && !!document.getElementById('checkout-address') && !document.getElementById('btn-proceed-checkout').disabled");
    assert.equal(await evaluate("document.querySelector('[data-method=VISA]').classList.contains('active')"), true);
    assert.equal(await evaluate('appliedCouponCode'), 'TEST10');
    assert.equal(await evaluate('Commerce.selectedItems().length'), 1);
    assert.equal(await evaluate("JSON.parse(localStorage.getItem('auralie_shipping_918273')).length"), 2);
    assert.equal(await countOrders(), 1);
    console.log('PASS address editing returns to checkout preserving selection, coupon and chosen payment card');

    const desktop = await call('Page.captureScreenshot', {format:'png',captureBeyondViewport:true});
    fs.writeFileSync(path.join(os.tmpdir(), 'auralie-checkout-page.png'), Buffer.from(desktop.data, 'base64'));
    await evaluate("document.getElementById('btn-proceed-checkout').click()");
    await wait("getCart().length===1 && getCart()[0].id===8");
    payload = await evaluate("JSON.parse(localStorage.getItem('__commerce_test_calls')).findLast(c=>c.path==='/api/v1/orders' && c.method==='POST').body");
    assert.equal(payload.paymentMethod, 'VISA');
    assert.ok(payload.address.startsWith('321, Office Street,'));
    assert.equal(payload.fullName, 'Office Recipient');
    assert.equal(payload.phone, '0987654321');
    console.log('PASS original VISA choice still submits through the existing payment flow');

    await navigate('checkout.html');
    await wait("!!document.getElementById('checkout-page')");
    assert.equal(await evaluate("document.getElementById('btn-proceed-checkout').disabled"), true);
    await navigate('cart.html');
    await evaluate("saveCart([{id:3,name:'Test Dress',qty:2,price:250000,selected:true},{id:8,name:'Keep In Cart',qty:2,price:100000}]); document.getElementById('btn-proceed-checkout').click()");
    await wait("location.pathname.endsWith('/checkout.html') && !!document.getElementById('checkout-address') && !document.getElementById('btn-proceed-checkout').disabled");
    await evaluate("window.__fixture.orderFailure=true; document.querySelector('[data-method=COD]').click(); document.getElementById('btn-proceed-checkout').click()");
    await wait("!!document.querySelector('.luxury-alert-overlay')");
    assert.equal(await evaluate('getCart().length'), 2);
    await evaluate("document.querySelector('.luxury-alert-overlay').remove(); window.__fixture.orderFailure=false; document.querySelector('[data-method=SEPAY_QR]').click(); document.getElementById('btn-proceed-checkout').click()");
    await wait("!!document.getElementById('sepay-checkout-modal')");
    assert.equal(await evaluate("document.getElementById('btn-proceed-checkout').disabled"), true);
    await evaluate("document.getElementById('close-sepay-modal').click()");
    const polls = await evaluate("JSON.parse(localStorage.getItem('__commerce_test_calls')).filter(c=>c.path.includes('/payment-status')).length");
    await delay(2800);
    assert.equal(await evaluate("JSON.parse(localStorage.getItem('__commerce_test_calls')).filter(c=>c.path.includes('/payment-status')).length"), polls);
    assert.equal(await evaluate('getCart().length'), 2);
    console.log('PASS failed orders preserve cart; QR opens normally, closes and stops polling');

    await evaluate("document.getElementById('btn-proceed-checkout').click()");
    await wait("!!document.getElementById('sepay-checkout-modal')");
    await evaluate("changeCartQty(0,1); window.__fixture.paid=true; document.getElementById('btn-sepay-manual-check').click()");
    await wait("getCart().find(item=>item.id===3)?.qty===1");
    assert.equal(await evaluate('getCart().find(item=>item.id===8).qty'), 2);
    await evaluate("document.getElementById('close-sepay-modal').click()");
    console.log('PASS paid QR removes purchased quantities and preserves unticked products');

    await evaluate("const config=JSON.parse(localStorage.getItem('__commerce_test_config')); config.reorderItems=[{variantId:12,productId:3,productName:'Test Dress',quantity:1,price:250000,size:'S',color:'Black'},{variantId:13,productId:3,productName:'Test Dress',quantity:2,price:250000,size:'M',color:'Black'}]; localStorage.setItem('__commerce_test_config',JSON.stringify(config)); saveCart([{id:3,variantId:12,name:'Test Dress',qty:7,quantity:7,price:250000,size:'S',color:'Black'},{id:3,name:'Test Dress',qty:3,price:250000,size:'S',color:'Black'},{id:3,variantId:13,name:'Test Dress',qty:9,price:250000,size:'M',color:'Black'},{id:3,variantId:99,name:'Other Size',qty:5,price:250000,size:'L',color:'Black'},{id:8,name:'Keep In Cart',qty:2,price:100000}]);");
    await navigate('profile.html#orders');
    await wait("!!document.querySelector('button[onclick*=\"Commerce.reorder\"]')");
    await evaluate("document.querySelector('button[onclick*=\"Commerce.reorder\"]').click()");
    await wait("location.pathname.endsWith('/checkout.html') && !!document.getElementById('checkout-address') && !document.getElementById('btn-proceed-checkout').disabled");
    assert.deepEqual(await evaluate('Commerce.selectedItems().map(item=>[item.variantId,item.qty])'), [[12,1],[13,2]]);
    assert.equal(await evaluate('getCart().filter(item=>item.variantId===12).length'), 1);
    assert.equal(await evaluate('getCart().find(item=>item.variantId===99).qty'), 5);
    assert.equal(await evaluate('getCart().find(item=>item.id===8).qty'), 2);
    assert.equal(await evaluate('Commerce.selectedItems().some(item=>item.quantity!==undefined)'), false);
    console.log('PASS reorder uses original quantities per size/color and replaces accumulated cart duplicates');

    await navigate('profile.html#orders');
    await wait("!!document.querySelector('button[onclick*=\"Commerce.reorder\"]')");
    await evaluate("document.querySelector('button[onclick*=\"Commerce.reorder\"]').click()");
    await wait("location.pathname.endsWith('/checkout.html') && !!document.getElementById('checkout-address') && !document.getElementById('btn-proceed-checkout').disabled");
    assert.deepEqual(await evaluate('Commerce.selectedItems().map(item=>[item.variantId,item.qty])'), [[12,1],[13,2]]);
    assert.equal(await evaluate('getCart().length'), 4);
    console.log('PASS repeating reorder keeps exact order quantities without accumulation');

    await call('Emulation.setDeviceMetricsOverride', {width:390,height:844,deviceScaleFactor:1,mobile:true});
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
    assert.equal(await evaluate("[...document.querySelectorAll('#payment-method-group .payment-method-card')].filter(c=>c.offsetHeight>0).length"), 3);
    const mobile = await call('Page.captureScreenshot', {format:'png',captureBeyondViewport:true});
    fs.writeFileSync(path.join(os.tmpdir(), 'auralie-checkout-page-mobile.png'), Buffer.from(mobile.data, 'base64'));
    console.log('PASS all original payment cards remain visible on mobile without horizontal overflow');

    assert.deepEqual(errors, [], 'Unexpected browser errors');
    console.log('All browser checks passed. APIs were mocked; database untouched.');
  } finally { socket.close(); }
}
main().catch(error => { console.error(error); process.exitCode=1; });
