(() => {
  const esc = value => Commerce.escape(value);
  const money = value => Number(value || 0).toLocaleString('vi-VN') + ' ₫';
  const text = value => value === null || value === undefined || value === '' ? 'Chưa cung cấp' : esc(value);
  const date = value => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleString('vi-VN') : 'Chưa cung cấp';
  const status = value => ({PENDING:'Chờ xử lý',CONFIRMED:'Đã xác nhận',PROCESSING:'Đang chuẩn bị',SHIPPED:'Đang giao',COMPLETED:'Hoàn thành',CANCELLED:'Đã hủy'}[value] || value || 'Chưa có');
  const productRows = new Map();
  async function getAdminArray(url, attempt = 0) {
    let response;
    try {
      response = await fetch(url, { cache:'no-store', signal:AbortSignal.timeout(10000), headers:{Authorization:`Bearer ${sessionStorage.getItem('auralie_token') || ''}`} });
    } catch (error) {
      if (attempt === 0) return getAdminArray(url, 1);
      throw new Error('Không kết nối được backend. Vui lòng kiểm tra máy chủ và bấm Tải lại dữ liệu.');
    }
    if (response.status === 401) {
      sessionStorage.removeItem('auralie_token'); sessionStorage.removeItem('auralie_user');
      location.href='login.html';
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    if (response.status === 403) throw new Error('Tài khoản hiện tại không có quyền quản trị sản phẩm.');
    if (response.status >= 500 && attempt === 0) return getAdminArray(url, 1);
    let result;
    try { result=await response.json(); }
    catch { throw new Error(`API trả dữ liệu không hợp lệ (HTTP ${response.status}). Vui lòng tải lại.`); }
    if (!response.ok || result.status !== 'success') throw new Error(result.message || `Yêu cầu không thành công (HTTP ${response.status}).`);
    if (!Array.isArray(result.data)) throw new Error('Dữ liệu danh sách từ API không đúng định dạng.');
    return result;
  }
  async function loadProductsData() {
    const [products, inventory]=await Promise.allSettled([getAdminArray('/api/v1/admin/products'),getAdminArray('/api/v1/admin/products/inventory')]);
    if (products.status === 'rejected') throw products.reason;
    return { result:products.value, inventoryResult:inventory.status === 'fulfilled' ? inventory.value : {status:'error',message:inventory.reason.message} };
  }
  function productLoadError(error, tbody) {
    tbody.innerHTML=`<tr><td colspan="8" class="admin-product-load-error"><strong>Không tải được danh sách sản phẩm</strong><p>${esc(error.message || 'Vui lòng thử tải lại dữ liệu.')}</p><button type="button" class="btn-primary-luxury" id="retry-admin-products">Thử lại</button></td></tr>`;
    tbody.querySelector('#retry-admin-products').onclick=()=>window.loadAdminProducts();
  }
  const deleting = new Set();
  async function deleteProduct(id) {
    if (deleting.has(id)) return;
    deleting.add(id);
    try {
      const product = productRows.get(Number(id));
      const confirmed = await Commerce.dialog('Xác nhận xóa sản phẩm', `<p>Bạn có chắc muốn xóa/ẩn sản phẩm <strong>${esc(product?.name || `#${id}`)}</strong>?</p><p>Sản phẩm sẽ ngừng hiển thị trong danh sách bán hàng.</p>`, 'Xác nhận xóa');
      if (!confirmed) return;
      await Commerce.request(`/api/v1/products/${id}`, {method:'DELETE'});
      await Commerce.notify('Đã xóa/ẩn sản phẩm thành công.');
      window.loadAdminProducts();
      window.refreshAdminStats?.();
    } catch (error) { await Commerce.notify(error.message); }
    finally { deleting.delete(id); }
  }
  function stockCell(inventory) {
    if (!inventory) return '<span class="admin-muted">Chưa tải được</span>';
    return `<strong class="stock-remaining">${Number(inventory.remaining_quantity).toLocaleString('vi-VN')}</strong><small class="stock-breakdown">Tổng: ${Number(inventory.total_quantity).toLocaleString('vi-VN')}<br>Đã đi đơn: ${Number(inventory.allocated_quantity).toLocaleString('vi-VN')}</small>`;
  }
  let stockDialogOpen=false;
  async function adjustStock() {
    if(stockDialogOpen)return;
    stockDialogOpen=true;
    const trigger=document.getElementById('btn-open-stock-modal');
    if(trigger)trigger.disabled=true;
    let removeBusyGuard=()=>{};
    try {
      const products=(await getAdminArray('/api/v1/admin/products')).data;
      if(!products.length){await Commerce.notify('Chưa có sản phẩm để điều chỉnh tồn kho. Vui lòng thêm sản phẩm trước.');return;}
      const result=await Commerce.dialog('Điều chỉnh tồn kho', `<div class="inventory-adjust-grid">
        <label class="inventory-full-row">Sản phẩm<select name="productId" required><option value="">Chọn sản phẩm</option>${products.map(p=>`<option value="${Number(p.id)}">#${Number(p.id)} — ${esc(p.name)}</option>`).join('')}</select></label>
        <label>Kích thước<input name="size" list="stock-size-options" required maxlength="20" placeholder="Chọn hoặc nhập kích thước" disabled><datalist id="stock-size-options"></datalist></label>
        <label>Màu sắc<input name="color" list="stock-color-options" required maxlength="100" placeholder="Chọn hoặc nhập màu sắc" disabled><datalist id="stock-color-options"></datalist></label>
        <label>Thao tác<select name="operation"><option value="IMPORT">Nhập kho (+)</option><option value="EXPORT">Xuất kho (−)</option></select></label>
        <label>Số lượng<input name="quantity" type="number" min="1" max="2147483647" step="1" value="1" required></label>
        <div class="inventory-preview inventory-full-row"><span>Tồn hiện tại<strong id="stock-current">—</strong></span><span>Sau điều chỉnh<strong id="stock-after">—</strong></span></div>
        <p id="stock-variant-note" class="inventory-full-row admin-muted" role="status">Chọn sản phẩm để tải kích thước, màu sắc và số tồn mới nhất.</p>
        <label class="inventory-full-row">Ghi chú nhập / xuất<textarea name="reason" maxlength="500" rows="2" placeholder="Ví dụ: Nhập hàng mới, xuất hàng hỏng..."></textarea></label>
        <p id="stock-adjust-error" class="inventory-full-row inventory-error" role="alert"></p>
      </div>`, 'Lưu điều chỉnh', (form,close)=>{
        const fields=form.elements,submit=form.querySelector('button[type=submit]');
        const overlay=form.closest('.commerce-overlay');overlay.id='admin-stock-modal';
        const errorNode=form.querySelector('#stock-adjust-error');
        let variants=[],loadedProductId=null,loading=false,busy=false,version=0,requestId=crypto.randomUUID();
        const normalize=value=>String(value||'').trim().normalize('NFC').toLowerCase();
        const state=()=>{
          const variant=variants.find(v=>normalize(v.size)===normalize(fields.size.value)&&normalize(v.color)===normalize(fields.color.value));
          const before=variant?Number(variant.stock_quantity):0,quantity=Number(fields.quantity.value);
          const after=before+(fields.operation.value==='IMPORT'?quantity:-quantity);
          const valid=!!loadedProductId&&!loading&&!busy&&!!fields.size.value.trim()&&!!fields.color.value.trim()&&Number.isInteger(quantity)&&quantity>0&&quantity<=2147483647&&after>=0&&after<=2147483647&&(fields.operation.value==='IMPORT'||!!variant);
          return{variant,before,quantity,after,valid};
        };
        const preview=()=>{
          const current=state();
          form.querySelector('#stock-current').textContent=loadedProductId&&!loading?current.before.toLocaleString('vi-VN'):'—';
          form.querySelector('#stock-after').textContent=loadedProductId&&!loading&&Number.isInteger(current.quantity)?current.after.toLocaleString('vi-VN'):'—';
          form.querySelector('#stock-after').classList.toggle('inventory-negative',current.after<0);
          form.querySelector('#stock-variant-note').textContent=loading?'Đang tải tồn kho...':!loadedProductId?'Chọn sản phẩm để tải tồn kho.':!fields.size.value.trim()||!fields.color.value.trim()?'Chọn kích thước và màu sắc. Khi nhập kho, có thể nhập size/màu mới.':current.variant?'Tồn kho của đúng kích thước và màu sắc đã chọn.':fields.operation.value==='IMPORT'?'Biến thể mới sẽ được tạo khi bạn xác nhận nhập kho.':'Chưa có biến thể này để xuất kho.';
          submit.disabled=!current.valid;
          fields.size.disabled=fields.color.disabled=!loadedProductId||loading||busy;
          for(const name of ['productId','operation','quantity','reason'])fields[name].disabled=busy;
          overlay.querySelector('.commerce-close').disabled=busy;
          overlay.querySelector('.commerce-cancel').disabled=busy;
        };
        const fillColors=()=>{form.querySelector('#stock-color-options').innerHTML=[...new Set(variants.filter(v=>normalize(v.size)===normalize(fields.size.value)).map(v=>v.color))].map(color=>`<option value="${esc(color)}"></option>`).join('');};
        const loadVariants=async(preserve=false,keepError=false)=>{
          const currentVersion=++version,productId=Number(fields.productId.value);
          loadedProductId=null;variants=[];loading=!!productId;
          if(!keepError)errorNode.textContent='';
          if(!preserve){fields.size.value='';fields.color.value='';}
          preview();
          if(!productId)return;
          try {
            const data=await Commerce.request(`/api/v1/admin/products/${productId}/variants`,{signal:AbortSignal.timeout(10000)});
            if(currentVersion!==version||!form.isConnected)return;
            if(!Array.isArray(data.variants))throw new Error('Không tải được dữ liệu biến thể sản phẩm.');
            variants=data.variants;loadedProductId=productId;
            form.querySelector('#stock-size-options').innerHTML=[...new Set(variants.map(v=>v.size))].map(size=>`<option value="${esc(size)}"></option>`).join('');
            fillColors();
          }catch(error){if(currentVersion===version&&form.isConnected)errorNode.textContent=error.message;}
          finally{if(currentVersion===version&&form.isConnected){loading=false;preview();}}
        };
        fields.productId.onchange=()=>{requestId=crypto.randomUUID();void loadVariants();};
        fields.size.oninput=()=>{fields.color.value='';fillColors();};
        form.oninput=()=>{if(!busy){requestId=crypto.randomUUID();errorNode.textContent='';preview();}};
        fields.operation.onchange=()=>{requestId=crypto.randomUUID();errorNode.textContent='';preview();};
        const busyGuard=event=>{if(busy&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();}};
        document.addEventListener('keydown',busyGuard,true);
        removeBusyGuard=()=>document.removeEventListener('keydown',busyGuard,true);
        overlay.onclick=event=>{if(event.target===overlay&&!busy)close(null);};
        form.onsubmit=async event=>{
          event.preventDefault();
          const current=state();
          if(!current.valid||!form.reportValidity())return;
          const payload={productId:loadedProductId,size:fields.size.value.trim(),color:fields.color.value.trim(),operation:fields.operation.value,quantity:current.quantity,expectedStock:current.before,reason:fields.reason.value.trim(),requestId};
          busy=true;preview();submit.textContent='Đang lưu...';
          try {
            const saved=await Commerce.request('/api/v1/admin/inventory/adjust',{method:'POST',body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
            close(saved);
          }catch(error){errorNode.textContent=error.message;if(form.isConnected)await loadVariants(true,true);}
          finally{busy=false;if(form.isConnected){submit.textContent='Lưu điều chỉnh';preview();}}
        };
        preview();
      });
      if(result){
        await window.loadAdminProducts();window.refreshAdminStats?.();
        await Commerce.notify(`Đã ${result.operation==='IMPORT'?'nhập':'xuất'} ${result.quantity} sản phẩm (${result.size} / ${result.color}). Tồn sau điều chỉnh: ${result.stockQuantity}.`);
      }
    }catch(error){await Commerce.notify(error.message);}
    finally{removeBusyGuard();stockDialogOpen=false;if(trigger)trigger.disabled=false;}
  }
  async function readImage() {
    const file = document.getElementById('add-prod-image')?.files[0];
    if (!file) return undefined;
    if (!['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error('Chỉ chọn ảnh PNG, JPEG hoặc WebP.');
    if (file.size > 2 * 1024 * 1024 || !file.size) throw new Error('Ảnh phải có dung lượng không quá 2 MB.');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Không đọc được ảnh, vui lòng chọn lại.'));
      reader.readAsDataURL(file);
    });
  }
  function resetImage() {
    const preview = document.getElementById('add-prod-image-preview');
    if (preview) { preview.hidden = true; preview.removeAttribute('src'); }
    const message = document.getElementById('add-prod-image-status');
    if (message) message.textContent = '';
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('add-prod-image')?.addEventListener('change', async () => {
      resetImage();
      const file = document.getElementById('add-prod-image').files[0];
      try {
        const image = await readImage();
        if (file !== document.getElementById('add-prod-image').files[0]) return;
        if (image) {
          const preview = document.getElementById('add-prod-image-preview');
          preview.src = image; preview.hidden = false;
          document.getElementById('add-prod-image-status').textContent = file.name;
        }
      } catch (error) { document.getElementById('add-prod-image-status').textContent = error.message; }
    });
  });
  async function addProduct(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (form.dataset.submitting === '1') return;
    const button = form.querySelector('button[type="submit"]');
    const label = button.innerHTML;
    form.dataset.submitting = '1'; button.disabled = true;
    try {
      const data = { name:document.getElementById('add-prod-name').value.trim(), categoryId:document.getElementById('add-prod-category').value, basePrice:document.getElementById('add-prod-price').value, tag:document.getElementById('add-prod-tag').value, material:document.getElementById('add-prod-material').value.trim(), fit:document.getElementById('add-prod-fit').value.trim(), description:document.getElementById('add-prod-desc').value.trim(), imageData:await readImage() };
      await Commerce.request('/api/v1/products', {method:'POST',body:JSON.stringify(data)});
      window.closeAddProductModal(); form.reset(); resetImage();
      window.loadAdminProducts();
      window.refreshAdminStats?.();
      await Commerce.notify('Đã thêm sản phẩm thành công.');
    } catch (error) { await Commerce.notify(error.message); }
    finally { delete form.dataset.submitting; button.disabled = false; button.innerHTML = label; }
  }
  let customerRequest = 0;
  async function customerDetails(id) {
    const requestId = ++customerRequest;
    try {
      const user = await Commerce.request(`/api/v1/users/profile?userId=${Number(id)}`);
      if (requestId !== customerRequest) return;
      const orders = user.orders || [];
      const fields = values => `<dl class="admin-detail-fields">${values.map(([name,value]) => `<dt>${esc(name)}</dt><dd>${text(value)}</dd>`).join('')}</dl>`;
      document.querySelector('#admin-customer-modal .commerce-close')?.click();
      void Commerce.dialog(`Hồ sơ khách hàng #${Number(user.id)}`, `<div class="customer-detail-grid">
        <section><h3>Thông tin cá nhân</h3>${fields([['Họ và tên',user.full_name],['Email',user.email],['Số điện thoại',user.phone],['Địa chỉ hồ sơ',user.address],['Vai trò',user.role_name],['Ngày tham gia',date(user.created_at)]])}</section>
        <section><h3>Hội viên & mua hàng</h3>${fields([['Hạng VIP',user.vip_tier],['Điểm VIP',user.vip_points],['Chi tiêu theo hồ sơ',money(user.total_spent)],['Tổng số đơn',orders.length],['Đơn đã hủy',orders.filter(o=>o.status==='CANCELLED').length]])}</section></div>
        <section class="customer-order-history"><h3>Lịch sử đơn hàng (${orders.length})</h3>${orders.length ? orders.map(order => `<details><summary><strong>${esc(order.order_code)}</strong> · ${esc(status(order.status))} · ${money(order.total_amount)}</summary><dl class="admin-detail-fields"><dt>Ngày đặt</dt><dd>${esc(date(order.created_at))}</dd><dt>Số điện thoại nhận</dt><dd>${text(order.phone_number)}</dd><dt>Địa chỉ nhận</dt><dd>${text(order.shipping_address)}</dd><dt>Thanh toán</dt><dd>${text(order.payment_method)} / ${text(order.payment_status)}</dd></dl></details>`).join('') : '<p>Chưa có đơn hàng.</p>'}</section>`, '', form => {
          const overlay = form.closest('.commerce-overlay'); overlay.id='admin-customer-modal';
          overlay.querySelector('.commerce-dialog').classList.add('admin-wide-dialog');
        });
    } catch (error) { await Commerce.notify(error.message); }
  }
  let invoiceRequest = 0;
  let printFrame;
  function printInvoice(article, button) {
    if (printFrame) return;
    button.disabled = true;
    const frame = document.createElement('iframe');
    printFrame = frame;
    frame.id='admin-invoice-print-frame';
    frame.title='Bản in hóa đơn';
    frame.style.cssText='position:fixed;width:0;height:0;border:0;bottom:0;left:0;';
    const cleanup = () => { if (printFrame === frame) printFrame = null; frame.remove(); if(button.isConnected)button.disabled=false; };
    frame.onload = () => {
      if (!button.isConnected) { cleanup(); return; }
      frame.contentWindow.addEventListener('afterprint', cleanup, {once:true});
      frame.contentWindow.focus(); frame.contentWindow.print();
    };
    frame.srcdoc = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Hóa đơn đơn hàng</title><style>@page{size:A4;margin:12mm}body{font:12px Arial,sans-serif;color:#222;margin:0}h1{font-size:22px}h2{font-size:16px}table{width:100%;border-collapse:collapse;margin:18px 0}th,td{padding:9px 5px;border-bottom:1px solid #ddd;text-align:left}thead{display:table-header-group}tr{break-inside:avoid}dl{display:grid;grid-template-columns:160px 1fr;gap:8px}dd{margin:0}footer{margin-top:25px}.invoice-totals{text-align:right}.invoice-totals p{margin:7px 0}</style></head><body>${article.outerHTML}</body></html>`;
    document.body.append(frame);
    return cleanup;
  }
  async function invoice(id) {
    const requestId = ++invoiceRequest;
    try {
      const order = await Commerce.request(`/api/v1/orders/${Number(id)}`);
      if (requestId !== invoiceRequest) return;
      document.querySelector('#admin-invoice-modal .commerce-close')?.click();
      let cleanup;
      await Commerce.dialog(`Hóa đơn ${order.orderCode}`, `<article class="invoice-document" id="printable-invoice-content"><header><h1>AURALIÈ HAUTE COUTURE</h1><h2>Hóa đơn đơn hàng ${esc(order.orderCode)}</h2></header>
        <dl class="admin-detail-fields"><dt>Ngày đặt hàng</dt><dd>${esc(date(order.createdAt))}</dd><dt>Người đặt (hồ sơ)</dt><dd>${text(order.customerName)}</dd><dt>Số điện thoại nhận</dt><dd>${text(order.phoneNumber)}</dd><dt>Địa chỉ nhận hàng</dt><dd>${text(order.shippingAddress)}</dd><dt>Thanh toán</dt><dd>${text(order.paymentMethod)} / ${text(order.paymentStatus)}</dd><dt>Trạng thái đơn</dt><dd>${esc(status(order.status))}</dd></dl>
        <div class="invoice-table-wrap"><table><thead><tr><th>Sản phẩm</th><th>Size / Màu</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>${order.items.map(item=>`<tr><td>${esc(item.productName)}</td><td>${esc(item.size || '—')} / ${esc(item.color || '—')}</td><td>${Number(item.quantity)}</td><td>${money(item.price)}</td><td>${money(Number(item.price)*Number(item.quantity))}</td></tr>`).join('')}</tbody></table></div>
        <div class="invoice-totals"><p>Tạm tính: <strong>${money(order.items.reduce((sum,item)=>sum+Number(item.price)*Number(item.quantity),0))}</strong></p><p>Giảm giá: ${money(order.discountAmount)}</p><p>Phí giao hàng: ${money(order.shippingFee)}</p><p>Tổng thanh toán: <strong>${money(order.totalAmount)}</strong></p></div><footer>Cảm ơn quý khách đã mua sắm tại AURALIÈ.</footer></article>
        <button type="button" class="btn-primary-luxury" id="admin-print-invoice">In / Tải PDF hóa đơn</button>`, '', form => {
          const overlay=form.closest('.commerce-overlay'); overlay.id='admin-invoice-modal';
          overlay.querySelector('.commerce-dialog').classList.add('admin-wide-dialog');
          form.querySelector('#admin-print-invoice').onclick=()=>{cleanup=printInvoice(form.querySelector('.invoice-document'),form.querySelector('#admin-print-invoice')) || cleanup;};
        });
      cleanup?.();
    } catch (error) { await Commerce.notify(error.message); }
  }
  window.AdminUI = { escape:esc, productRows, stockCell, deleteProduct, readImage, resetImage, addProduct, customerDetails, invoice, loadProductsData, productLoadError, adjustStock };
})();
