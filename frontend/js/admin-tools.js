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

  // ==============================================================
  // CẤU HÌNH THUỘC TÍNH THỰC TẾ RIÊNG BIỆT CHO TỪNG DANH MỤC (ADMIN)
  // ==============================================================
  const CATEGORY_ATTR_SCHEMES = {
    '1': { // Áo Vest & Blazer
      title: 'Thông Số Âu Phục & May Đo (Suits & Blazers)',
      badge: 'Haute Tailoring',
      fits: ['European Tailored Fit', 'Slim Structured Cut', 'Savile Row Regular Fit', 'Double-Breasted Tailored', 'Black Tie Velvet Tuxedo'],
      materials: ['100% Cashmere Lụa Ý', 'Len Cừu Merinos & Silk', '100% Italian Virgin Wool', 'Nhung Velvet Cashmere Cao Cấp'],
      linings: ['Lụa Cupro Thượng Hạng Nhập Ý', 'Lụa Satin Silk Họa Tiết Monogram', 'Lụa Tơ Tằm Tự Nhiên'],
      hardwares: ['Khuy Sừng Tự Nhiên Khắc Logo', 'Khuy Kim Loại Mạ Vàng 18K', 'Khuy Bọc Nhung Đồng Màu'],
      colors: ['Đen Tuyền (Jet Black)', 'Xanh Navy Ý', 'Xám Than Lịch Lãm', 'Đỏ Đô Burgundy', 'Vàng Hoàng Gia'],
      sizes: ['S', 'M', 'L', 'XL'],
      isBag: false,
      isShoe: false
    },
    '2': { // Váy & Đầm Dạ Hội
      title: 'Thông Số Váy & Đầm Dạ Hội (Evening Gowns)',
      badge: 'Haute Couture Gown',
      fits: ['Fitted Mermaid Silhouette (Đầm đuôi cá)', 'Floor-Length Evening Cut (Đầm dạ hội suông dài)', 'A-Line Pleated Silhouette (Đầm xòe chữ A dập ly)', 'One-Shoulder High Slit Cut (Lệch vai xẻ tà)', 'Cocktail Midi Cut (Đầm tiệc lửng)'],
      materials: ['100% Lụa Tơ Tằm Tự Nhiên (Mulberry Silk)', 'Nhung Lụa Pháp Thượng Hạng', 'Satin Duchesse Nhập Khẩu', 'Chiffon Dập Ly & Pha Lê Swarovski', 'Lụa Mikado Ý'],
      linings: ['Lụa Tơ Tằm Thoáng Mát', 'Lớp Lót Satin Mềm Mại', 'Lót Lưới Tạo Phom Xòe'],
      hardwares: ['Khóa Kéo Ẩn YKK Mạ Vàng', 'Đính Kết Pha Lê Thủ Công Atelier Đồng Khởi', 'Móc Khóa Bạc Đính Đá'],
      colors: ['Ngọc Lục Bảo (Emerald Green)', 'Đỏ Ruby Quý Phái', 'Xanh Đêm Midnight', 'Trắng Lụa Ngọc Trai', 'Hồng Phấn Nữ Tính'],
      sizes: ['S', 'M', 'L'],
      isBag: false,
      isShoe: false
    },
    '3': { // Áo Khoác Thu Đông
      title: 'Thông Số Áo Khoác Thu Đông (Winter Outerwear)',
      badge: 'Luxury Winter',
      fits: ['Long Trench Classic Cut (Trench coat dáng dài)', 'Straight Flowing Overcoat (Overcoat dạ ép suông)', 'Modern Cropped Tailored (Áo khoác dạ lửng)', 'Relaxed Oversized Fit (Form rộng áo len Cashmere)', 'Slim Longline Puffer (Áo phao lông vũ)'],
      materials: ['100% Cashmere Sợi Đôi Thượng Hạng', 'Len Lông Cừu Hai Mặt Double-Faced', 'Dạ Len Lông Cừu Dày Dặn Scotland', '90% Lông Vũ Ngỗng & Vải Kỹ Thuật Chống Thấm', 'Da Cừu Nappa & Lông Cừu Tự Nhiên'],
      linings: ['Lụa Cupro Thấm Hút & Giữ Nhiệt', 'Dạ Ép 2 Mặt Thủ Công (Không lót)', 'Lót Lông Cừu Tự Nhiên Ấm Áp'],
      hardwares: ['Đai Da Bò Thật Khóa Mạ Vàng', 'Khuy Sừng Tự Nhiên Khắc Logo', 'Khóa Đồng Cổ YKK'],
      colors: ['Nâu Camel (Camel Brown)', 'Kem Yến Mạch (Oatmeal Cream)', 'Xám Khói Heather Grey', 'Xanh Navy Cổ Điển', 'Xám Than'],
      sizes: ['S', 'M', 'L', 'FreeSize'],
      isBag: false,
      isShoe: false
    },
    '4': { // Túi Xách Da Cao Cấp
      title: 'Thông Số Túi Xách Da Cao Cấp (Không có size quần áo)',
      badge: 'Leather Craft',
      fits: ['Structured Luxury Handbag (Túi xách tay / Kelly)', 'Spacious Luxury Tote (Túi tote cỡ lớn)', 'Compact Flap Crossbody (Túi đeo chéo nắp gập)', 'Rigid Evening Clutch (Ví cầm tay dạ tiệc)', 'Curved Saddle Shoulder Bag (Túi yên ngựa)', 'Slim Shoulder Baguette (Túi kẹp nách)'],
      materials: ['Da Bê Hạt Mịn Caviar (Chống trầy)', 'Da Bò Thuộc Thảo Mộc Nappa Ý', 'Da Đà Điểu Nam Phi (Exotic Leather)', '100% Da Cừu Non Lambskin', 'Da Bò Ý Dập Vân Cá Sấu Nappa', 'Da Bò Thuộc Thảo Mộc Box Calf', 'Da Bò Dập Vân Thằn Lằn (Lizard)'],
      linings: ['Da Cừu Nappa Mềm Mại', 'Vải Canvas Dệt Jacquard Chống Thấm', 'Nhung Đỏ Sang Trọng'],
      hardwares: ['Khóa Xoay Hợp Kim Mạ Vàng 18K', 'Khóa Mạ Bạc Palladium Chống Xước', 'Khung Đồng Thau Chạm Khắc Cổ Điển'],
      colors: ['Đen Caviar (Caviar Black)', 'Nâu Di Sản (Heritage Tan)', 'Nâu Cognac Cổ Điển', 'Trắng Ngà Ivory', 'Đỏ Rượu Burgundy', 'Xanh Lục Bảo', 'Xám Taupe Thanh Lịch', 'Nâu Caramel'],
      dimensions: ['Mini (18cm x 12cm x 6cm)', 'Small (22cm x 15cm x 8cm)', 'Medium (28cm x 20cm x 10cm)', 'Large Tote (36cm x 28cm x 14cm)'],
      isBag: true,
      isShoe: false
    },
    '5': { // Giày & Phụ Kiện
      title: 'Thông Số Giày & Phụ Kiện Xa Xỉ (Footwear & Fine Acc)',
      badge: 'Footwear & Jewelry',
      fits: ['Giày Cao Gót Stiletto (Mũi nhọn 9cm)', 'Bốt Cổ Cao / Chelsea Boots Da Bê', 'Giày Lười Loafers Cổ Điển', 'Sandals Dạ Hội Quai Mảnh', 'Khăn Lụa Tơ Tằm Vuông 90cm x 90cm', 'Khuyên Khăn & Cufflinks Mạ Vàng 18K'],
      materials: ['Da Bê Ý Nhập Khẩu Nguyên Tấm', 'Da Lộn Suede Ý Cao Cấp', 'Da Bóng Patent Leather (Đế đỏ)', 'Lụa Satin Láng Mịn & Pha Lê Swarovski', '100% Lụa Tơ Tằm Twill', 'Đồng Thau Mạ Vàng 18K Khảm Xà Cừ'],
      linings: ['Lót Da Bê Êm Ái', 'Không Lớp Lót (Khăn lụa/Phụ kiện)', 'Lót Lụa Satin'],
      hardwares: ['Khóa Mạ Vàng 18K', 'Đế Đỏ Bóng Sơn Mài', 'Hợp Kim Chống Ô-xy Hóa'],
      colors: ['Đen Tuyền / Đen Bóng', 'Nâu Cognac Cổ Điển', 'Đỏ Mận / Đế Đỏ', 'Trắng Sữa Milky White', 'Vàng Hoàng Gia 18K'],
      sizes: ['36', '37', '38', '39', '40', '41', '42'],
      isShoe: true,
      isBag: false
    }
  };

  function renderCategoryAttributes(catId) {
    const container = document.getElementById('dynamic-category-fields');
    if (!container) return;
    const scheme = CATEGORY_ATTR_SCHEMES[String(catId)] || {
      title: 'Thông Số Đặc Trưng Sản Phẩm',
      badge: 'Couture Item',
      fits: ['Tiêu chuẩn', 'Regular Fit', 'Slim Fit'],
      materials: ['Vải cao cấp nhập khẩu', 'Lụa thượng hạng'],
      linings: ['Lụa lót cao cấp'],
      hardwares: ['Phụ kiện mạ vàng'],
      colors: ['Đen Tuyền', 'Trắng Sữa', 'Navy'],
      sizes: ['S', 'M', 'L', 'FreeSize'],
      isBag: false,
      isShoe: false
    };

    let sizeSectionHtml = '';
    if (scheme.isBag) {
      sizeSectionHtml = `
        <div style="background:#fff; padding:0.75rem; border:1px solid #e2e8f0; border-radius:6px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
            <label style="font-weight:700; color:var(--primary-dark);"><i class="fa-solid fa-ruler"></i> Kích Thước Túi (Dimensions)</label>
            <span style="font-size:0.75rem; color:#16a34a; font-weight:600;"><i class="fa-solid fa-check"></i> Không áp dụng size quần áo S/M/L</span>
          </div>
          <select id="attr-bag-dim" style="width:100%; padding:0.55rem; border:1px solid var(--border-light); border-radius:4px; outline:none; margin-bottom:0.6rem;">
            ${scheme.dimensions.map(d => `<option value="${d}">${d}</option>`).join('')}
          </select>
          <label style="font-weight:700; display:block; margin-bottom:0.25rem;">Số Lượng Tồn Kho Ban Đầu (Chiếc) *</label>
          <input type="number" id="attr-single-stock" value="10" min="1" required style="width:100%; padding:0.55rem; border:1px solid var(--border-light); border-radius:4px; outline:none;">
        </div>
      `;
    } else {
      sizeSectionHtml = `
        <div style="background:#fff; padding:0.75rem; border:1px solid #e2e8f0; border-radius:6px;">
          <label style="font-weight:700; display:block; margin-bottom:0.4rem; color:var(--primary-dark);">
            <i class="fa-solid ${scheme.isShoe ? 'fa-shoe-prints' : 'fa-ruler-combined'}"></i>
            ${scheme.isShoe ? 'Bảng Size Giày & Tồn Kho Ban Đầu (EU 36 - 42)' : 'Kích Cỡ & Số Lượng Tồn Kho Theo Size'}
          </label>
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(100px, 1fr)); gap:0.5rem;">
            ${scheme.sizes.map(s => `
              <div style="display:flex; align-items:center; gap:0.35rem; border:1px solid #cbd5e1; padding:0.3rem 0.5rem; border-radius:4px; background:#f8fafc;">
                <span style="font-weight:700; font-size:0.8rem; min-width:24px;">${s}:</span>
                <input type="number" class="attr-size-stock" data-size="${s}" value="5" min="0" style="width:100%; padding:0.25rem; font-size:0.8rem; border:1px solid #ccc; border-radius:3px; outline:none;">
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px dashed #cbd5e1; padding-bottom:0.4rem;">
        <span style="font-weight:700; color:var(--primary-dark); font-size:0.88rem;">
          <i class="fa-solid fa-sliders"></i> ${scheme.title}
        </span>
        <span style="background:var(--accent-gold); color:#000; font-size:0.68rem; font-weight:700; padding:2px 8px; border-radius:12px;">${scheme.badge}</span>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
        <div>
          <label style="font-weight:bold; display:block; margin-bottom:0.3rem;">Phom Dáng / Thiết Kế (Fit) *</label>
          <select id="attr-fit" style="width:100%; padding:0.55rem; border:1px solid var(--border-light); border-radius:4px; outline:none;">
            ${scheme.fits.map(f => `<option value="${f}">${f}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="font-weight:bold; display:block; margin-bottom:0.3rem;">Chất Liệu Cao Cấp *</label>
          <select id="attr-material" style="width:100%; padding:0.55rem; border:1px solid var(--border-light); border-radius:4px; outline:none;">
            ${scheme.materials.map(m => `<option value="${m}">${m}</option>`).join('')}
          </select>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
        <div>
          <label style="font-weight:bold; display:block; margin-bottom:0.3rem;">Lớp Lót (Lining)</label>
          <select id="attr-lining" style="width:100%; padding:0.55rem; border:1px solid var(--border-light); border-radius:4px; outline:none;">
            ${scheme.linings.map(l => `<option value="${l}">${l}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="font-weight:bold; display:block; margin-bottom:0.3rem;">Khóa / Chi Tiết (Hardware)</label>
          <select id="attr-hardware" style="width:100%; padding:0.55rem; border:1px solid var(--border-light); border-radius:4px; outline:none;">
            ${scheme.hardwares.map(h => `<option value="${h}">${h}</option>`).join('')}
          </select>
        </div>
      </div>

      <div>
        <label style="font-weight:bold; display:block; margin-bottom:0.3rem;">Tông Màu Sản Phẩm *</label>
        <select id="attr-color" style="width:100%; padding:0.55rem; border:1px solid var(--border-light); border-radius:4px; outline:none;">
          ${scheme.colors.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>

      ${sizeSectionHtml}
    `;
  }

  // Khởi tạo và lắng nghe thay đổi danh mục
  document.addEventListener('DOMContentLoaded', () => {
    const catSelect = document.getElementById('add-prod-category');
    if (catSelect) {
      catSelect.addEventListener('change', () => {
        renderCategoryAttributes(catSelect.value);
      });
      renderCategoryAttributes(catSelect.value || 1);
    }
  });

  async function addProduct(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (form.dataset.submitting === '1') return;
    const button = form.querySelector('button[type="submit"]');
    const label = button.innerHTML;
    form.dataset.submitting = '1'; button.disabled = true;
    try {
      const categoryId = document.getElementById('add-prod-category').value;
      const scheme = CATEGORY_ATTR_SCHEMES[String(categoryId)];

      const fit = document.getElementById('attr-fit')?.value || 'European Tailored Fit';
      const material = document.getElementById('attr-material')?.value || '100% Cashmere';
      const lining = document.getElementById('attr-lining')?.value || 'Lụa Cupro Thượng Hạng';
      const hardware = document.getElementById('attr-hardware')?.value || 'Khuy Sừng / Khóa Mạ Vàng';
      const color = document.getElementById('attr-color')?.value || 'Đen Tuyền';
      const origin = document.getElementById('add-prod-origin')?.value.trim() || 'Atelier AURALIÈ Đồng Khởi';

      const variants = [];
      if (scheme && scheme.isBag) {
        const stock = Number(document.getElementById('attr-single-stock')?.value) || 10;
        const dim = document.getElementById('attr-bag-dim')?.value || 'Medium';
        variants.push({ size: 'FreeSize', color: `${color} (${dim})`, stock });
      } else {
        const sizeInputs = document.querySelectorAll('.attr-size-stock');
        sizeInputs.forEach(inp => {
          const qty = Number(inp.value) || 0;
          if (qty > 0) {
            variants.push({ size: inp.dataset.size, color, stock: qty });
          }
        });
        if (variants.length === 0) {
          variants.push({ size: 'M', color, stock: 10 });
        }
      }

      const data = {
        name: document.getElementById('add-prod-name').value.trim(),
        categoryId: Number(categoryId),
        basePrice: document.getElementById('add-prod-price').value,
        tag: document.getElementById('add-prod-tag').value,
        origin,
        material,
        fit,
        lining,
        hardware,
        variants,
        color,
        description: document.getElementById('add-prod-desc').value.trim(),
        imageData: await readImage()
      };

      await Commerce.request('/api/v1/products', { method: 'POST', body: JSON.stringify(data) });
      window.closeAddProductModal();
      form.reset();
      resetImage();
      window.loadAdminProducts();
      window.refreshAdminStats?.();
      await Commerce.notify('Đã thêm thiết kế mới thành công với đầy đủ thuộc tính thực tế và tồn kho!');
    } catch (error) {
      await Commerce.notify(error.message);
    }
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
  window.renderCategoryAttributes = renderCategoryAttributes;
  window.AdminUI = { escape:esc, productRows, stockCell, deleteProduct, readImage, resetImage, addProduct, customerDetails, invoice, loadProductsData, productLoadError, adjustStock, renderCategoryAttributes };
})();
