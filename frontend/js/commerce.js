// Checkout helpers. Addresses and recipient snapshots stay in this browser; no DB migration.
(() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const token = () => sessionStorage.getItem('auralie_token');
  async function request(url, options = {}) {
    const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...options.headers } });
    const result = await response.json();
    if (!response.ok || result.status !== 'success') throw new Error(result.message || 'Không thể thực hiện yêu cầu.');
    return result.data;
  }
  function dialog(title, content, confirmText = 'Tiếp tục', setup = () => {}) {
    return new Promise(resolve => {
      const previous = document.activeElement;
      const overlay = document.createElement('div');
      overlay.className = 'commerce-overlay';
      overlay.innerHTML = `<section class="commerce-dialog" role="dialog" aria-modal="true" aria-labelledby="commerce-title" tabindex="-1"><button type="button" class="commerce-close" aria-label="Đóng">×</button><h2 id="commerce-title">${escape(title)}</h2><form>${content}<div class="commerce-actions"><button type="button" class="commerce-cancel">Quay lại</button>${confirmText ? `<button type="submit" class="btn-primary-luxury">${escape(confirmText)}</button>` : ''}</div></form></section>`;
      const oldOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.body.append(overlay);
      const form = overlay.querySelector('form');
      const close = value => {
        document.removeEventListener('keydown', onKey);
        overlay.remove();
        document.body.style.overflow = oldOverflow;
        previous?.focus();
        resolve(value);
      };
      const onKey = event => {
        if (event.key === 'Escape') close(null);
        if (event.key === 'Tab') {
          const nodes = [...overlay.querySelectorAll('button,input,select,textarea,a[href]')].filter(el => !el.disabled && el.offsetParent !== null);
          const first = nodes[0], last = nodes.at(-1);
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      };
      overlay.querySelector('.commerce-close').onclick = () => close(null);
      overlay.querySelector('.commerce-cancel').onclick = () => close(null);
      overlay.onclick = event => { if (event.target === overlay) close(null); };
      form.onsubmit = event => { event.preventDefault(); if (form.reportValidity()) close(Object.fromEntries(new FormData(form))); };
      document.addEventListener('keydown', onKey);
      setup(form, close);
      (form.querySelector('input,select,textarea') || overlay.querySelector('.commerce-dialog')).focus();
    });
  }
  const notify = message => dialog('Thông báo', `<p>${escape(message)}</p>`, 'Đã hiểu');
  async function requireUser(returnTo = 'cart.html') {
    try { if (token()) return await request('/api/v1/auth/me'); } catch (error) { /* Request login again. */ }
    sessionStorage.removeItem('auralie_token');
    sessionStorage.removeItem('auralie_user');
    const answer = await dialog('Yêu cầu đăng nhập', '<p>Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng và thanh toán.</p>', 'Đăng nhập');
    if (answer) {
      sessionStorage.setItem('commerce_return', returnTo);
      location.href = 'login.html';
    }
    return null;
  }
  const key = user => `auralie_shipping_${user.id}`;
  const draftKey = 'auralie_checkout_draft';
  const currentUserId = () => {
    try { return String(JSON.parse(sessionStorage.getItem('auralie_user'))?.id || 'guest'); } catch { return 'guest'; }
  };
  function normalizeCart(cart) {
    return cart.map(item => ({ ...item, cartKey: item.cartKey || crypto.randomUUID(), selected: item.selected === true }));
  }
  const selectedItems = () => {
    let cart;
    try { cart = window.getCart ? window.getCart() : JSON.parse(localStorage.getItem('auralie_cart') || '[]'); } catch { cart = []; }
    return Array.isArray(cart) ? cart.filter(item => item.selected === true) : [];
  };
  const selectionSignature = (items = selectedItems()) => JSON.stringify(items.map(item => [item.cartKey, Number(item.qty || 1), Number(item.price)]));
  function readDraft() {
    try {
      const draft = JSON.parse(sessionStorage.getItem(draftKey));
      return draft && draft.userId === currentUserId() ? draft : {};
    } catch { return {}; }
  }
  function saveDraft(extra = {}) {
    const previous = readDraft();
    const draft = { ...previous, userId: currentUserId(), items: selectedItems(), couponCode: 'appliedCouponCode' in window ? window.appliedCouponCode || '' : previous.couponCode || '', discount: 'appliedCouponDiscount' in window ? window.appliedCouponDiscount || 0 : previous.discount || 0, signature: selectionSignature(), ...extra };
    sessionStorage.setItem(draftKey, JSON.stringify(draft));
    return draft;
  }
  function restoreDraft() {
    const draft = readDraft();
    window.appliedCouponCode = draft.couponCode || null;
    window.appliedCouponDiscount = draft.signature === selectionSignature() ? draft.discount || 0 : 0;
    const input = document.getElementById('coupon-code-input');
    if (input) input.value = draft.couponCode || '';
    return draft;
  }
  let couponRevision = 0;
  async function refreshCoupon(strict = false) {
    const revision = ++couponRevision;
    const signature = selectionSignature();
    const items = selectedItems();
    const code = window.appliedCouponCode;
    window.appliedCouponDiscount = 0;
    if (!code || !items.length) { saveDraft(); window.renderCartPage?.(); return; }
    try {
      const subtotal = items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty || 1), 0);
      const result = await request('/api/v1/coupons/apply', { method: 'POST', body: JSON.stringify({ code, orderAmount: subtotal }) });
      if (revision !== couponRevision || signature !== selectionSignature()) {
        if (strict) throw new Error('Giỏ hàng vừa thay đổi. Vui lòng kiểm tra lại sản phẩm đã chọn.');
        return;
      }
      window.appliedCouponDiscount = Math.min(subtotal, Math.max(0, Number(result.discountAmount) || 0));
      window.couponMessage = '';
      saveDraft();
    } catch (error) {
      if (revision === couponRevision) { window.couponMessage = error.message; saveDraft(); }
      if (strict) throw error;
    } finally { window.renderCartPage?.(); renderCheckoutSummary(); }
  }
  function cartChanged() {
    window.appliedCouponDiscount = 0;
    saveDraft();
    void refreshCoupon();
  }
  async function applyCoupon(value) {
    if (!selectedItems().length) { await notify('Vui lòng tick chọn sản phẩm trước khi áp dụng mã giảm giá.'); return; }
    window.appliedCouponCode = value.trim().toUpperCase() || null;
    window.couponMessage = '';
    const button = document.getElementById('apply-coupon-btn');
    if (button) button.disabled = true;
    try {
      await refreshCoupon(true);
      await notify(window.appliedCouponCode ? `Đã áp dụng mã ${window.appliedCouponCode} cho các sản phẩm đã chọn.` : 'Đã bỏ mã giảm giá.');
    } catch (error) { await notify(error.message); }
    finally { if (button) button.disabled = false; }
  }
  function completePurchase(items) {
    const bought = new Map(items.map(item => [item.cartKey, Number(item.qty || 1)]));
    const remaining = window.getCart().flatMap(item => {
      if (!bought.has(item.cartKey)) return [item];
      const quantity = Number(item.qty || 1) - bought.get(item.cartKey);
      return quantity > 0 ? [{ ...item, qty: quantity, selected: false }] : [];
    });
    window.appliedCouponCode = null;
    window.appliedCouponDiscount = 0;
    window.couponMessage = '';
    sessionStorage.removeItem(draftKey);
    window.saveCart(remaining);
  }
  const normalizeName = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
  let divisionsPromise;
  function loadDivisions() {
    if (!divisionsPromise) divisionsPromise = fetch('assets/vn-addresses.json').then(response => {
      if (!response.ok) throw new Error('Không tải được danh sách địa chỉ. Vui lòng tải lại trang.');
      return response.json();
    }).then(data => {
      if (!Array.isArray(data) || !data.length || !data.every(p => Array.isArray(p.wards))) throw new Error('Danh sách địa chỉ không hợp lệ.');
      return data;
    }).catch(error => { divisionsPromise = null; throw error; });
    return divisionsPromise;
  }
  function addressFields(current = {}) {
    const id = `address-${crypto.randomUUID()}`;
    return `<div class="address-picker" data-picker-id="${id}">
      <label>Tỉnh / Thành phố<input name="province" list="${id}-provinces" autocomplete="shipping address-level1" required placeholder="Gõ để tìm tỉnh / thành phố" value="${escape(current.province || '')}"><datalist id="${id}-provinces"></datalist></label>
      <label>Phường / Xã<input name="ward" list="${id}-wards" autocomplete="shipping address-level2" required disabled placeholder="Chọn tỉnh / thành phố trước" value="${escape(current.ward || '')}"><datalist id="${id}-wards"></datalist></label>
      <label>Đường<input name="street" list="${id}-streets" autocomplete="shipping address-line1" required placeholder="Tìm đường đã lưu hoặc nhập tên đường" value="${escape(current.street || '')}"><datalist id="${id}-streets"></datalist></label>
      <label>Số nhà / Tòa nhà / Căn hộ<input name="houseNumber" autocomplete="shipping address-line2" required value="${escape(current.houseNumber || '')}"></label>
      <input type="hidden" name="provinceCode"><input type="hidden" name="wardCode"><input type="hidden" name="address">
      ${current.address && !current.provinceCode ? `<p class="address-legacy">Địa chỉ trước đây: ${escape(current.address)}. Vui lòng chọn lại tỉnh và phường/xã để lưu theo từng mục.</p>` : ''}
      <p class="address-picker-status" role="status">Đang tải danh sách tỉnh / thành phố…</p>
    </div>`;
  }
  async function mountAddressPicker(form, user, current = {}) {
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    const picker = form.querySelector('.address-picker');
    const status = picker.querySelector('.address-picker-status');
    try {
      const provinces = await loadDivisions();
      const provinceInput = form.elements.province, wardInput = form.elements.ward;
      picker.querySelector('datalist[id$="-provinces"]').innerHTML = provinces.map(p => `<option value="${escape(p.name)}"></option>`).join('');
      let activeCode = null;
      const findProvince = () => provinces.find(p => normalizeName(p.name) === normalizeName(provinceInput.value));
      function update() {
        const province = findProvince();
        if (activeCode !== province?.code) {
          wardInput.value = province?.code === Number(current.provinceCode) ? current.ward || '' : '';
          activeCode = province?.code;
        }
        provinceInput.setCustomValidity(province ? '' : 'Vui lòng chọn tỉnh / thành phố trong danh sách gợi ý.');
        wardInput.disabled = !province;
        wardInput.placeholder = province ? 'Gõ để tìm phường / xã' : 'Chọn tỉnh / thành phố trước';
        picker.querySelector('datalist[id$="-wards"]').innerHTML = (province?.wards || []).map(w => `<option value="${escape(w.name)}"></option>`).join('');
        const ward = province?.wards.find(w => normalizeName(w.name) === normalizeName(wardInput.value));
        wardInput.setCustomValidity(ward ? '' : 'Vui lòng chọn phường / xã thuộc tỉnh / thành phố đã chọn.');
        form.elements.provinceCode.value = province?.code || '';
        form.elements.wardCode.value = ward?.code || '';
        const streets = [...new Set(savedAddresses(user).filter(entry => Number(entry.provinceCode) === province?.code && Number(entry.wardCode) === ward?.code).map(entry => entry.street).filter(Boolean))];
        picker.querySelector('datalist[id$="-streets"]').innerHTML = streets.map(street => `<option value="${escape(street)}"></option>`).join('');
        form.elements.address.value = province && ward ? [form.elements.houseNumber.value.trim(), form.elements.street.value.trim(), ward.name, province.name].filter(Boolean).join(', ') : '';
      }
      for (const field of ['province', 'ward', 'street', 'houseNumber']) form.elements[field].addEventListener('input', update);
      update();
      status.textContent = 'Chọn tỉnh, phường/xã từ gợi ý. Tên đường có thể nhập mới.';
      submit.disabled = false;
      return true;
    } catch (error) { status.textContent = error.message; return false; }
  }
  const validShipping = value => Boolean(value && value.fullName?.trim() && value.fullName.length <= 100 && /^(0|\+84)[0-9]{8,11}$/.test(value.phone?.replace(/[\s.-]/g, '')) && value.address?.trim().length >= 5);
  function savedAddresses(user) {
    try { const addresses = JSON.parse(localStorage.getItem(key(user)) || '[]'); return Array.isArray(addresses) ? addresses.filter(validShipping) : []; } catch { return []; }
  }
  async function addresses(user) {
    const saved = savedAddresses(user);
    if (!saved.length) {
      const profile = await request('/api/v1/users/shipping-info');
      const entry = { fullName: profile.fullName, phone: profile.phone, address: profile.address };
      if (validShipping(entry)) saved.push(entry);
    }
    return saved;
  }
  let checkoutReady = false;
  let checkoutEntries = [];
  let checkoutAddressIndex = 0;
  const addressKey = entry => JSON.stringify([entry.fullName, entry.phone, entry.address]);
  function renderDeliveryCard() {
    const entry = checkoutEntries[checkoutAddressIndex];
    if (!entry) return;
    document.getElementById('checkout-recipient').innerHTML = `<div class="delivery-card" id="checkout-address">
      <div class="delivery-person"><span class="delivery-label">Người nhận</span><strong>${escape(entry.fullName)}</strong><span>${escape(entry.phone)}</span></div>
      <div class="delivery-location"><span class="delivery-label">Địa chỉ giao hàng</span><p>${escape(entry.address)}</p></div>
      <div class="delivery-actions"><button type="button" id="change-delivery-address">Thay đổi</button><a class="checkout-edit-address" href="shipping.html?checkout=1&addressIndex=${checkoutAddressIndex}">Sửa địa chỉ</a></div>
    </div>`;
    document.getElementById('change-delivery-address').onclick = async () => {
      const result = await dialog('Chọn địa chỉ nhận hàng', `<div class="address-book-list">${checkoutEntries.map((address, i) => `<label class="address-book-option"><input type="radio" name="addressIndex" value="${i}" ${i === checkoutAddressIndex ? 'checked' : ''} required><span class="address-book-content"><span class="address-book-person"><strong>${escape(address.fullName)}</strong><span>${escape(address.phone)}</span></span><span class="address-book-location">${escape(address.address)}</span>${i === checkoutAddressIndex ? '<span class="address-book-badge">Đang sử dụng</span>' : ''}</span></label>`).join('')}</div><a class="address-book-add" href="shipping.html?checkout=1&new=1"><span aria-hidden="true">＋</span> Thêm địa chỉ mới</a>`, 'Giao đến địa chỉ này');
      if (result && checkoutEntries[Number(result.addressIndex)]) {
        checkoutAddressIndex = Number(result.addressIndex);
        saveDraft({ addressKey: addressKey(checkoutEntries[checkoutAddressIndex]) });
        renderDeliveryCard();
      }
    };
  }
  function renderCheckoutSummary() {
    const container = document.getElementById('checkout-items');
    if (!container || !window.getCart) return;
    const items = selectedItems();
    const money = amount => Number(amount).toLocaleString('vi-VN') + ' ₫';
    const subtotal = items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty || 1), 0);
    const discount = Math.min(subtotal, window.appliedCouponDiscount || 0);
    container.innerHTML = items.length ? items.map(item => `<div class="checkout-line"><img src="${escape(item.img || 'assets/card_1.jpg')}" alt=""><div><strong>${escape(item.name)}</strong><p>${escape(item.size || '')} / ${escape(item.color || '')} · Số lượng: ${Number(item.qty || 1)}</p><p>${money(Number(item.price) * Number(item.qty || 1))}</p></div></div>`).join('') : '<p>Chưa chọn sản phẩm để thanh toán. <a href="cart.html">Quay lại giỏ hàng</a></p>';
    document.getElementById('checkout-subtotal').textContent = money(subtotal);
    document.getElementById('checkout-discount').textContent = '-' + money(discount);
    document.getElementById('checkout-total').textContent = money(Math.max(0, subtotal - discount));
    document.getElementById('coupon-status').textContent = window.couponMessage || '';
    const button = document.getElementById('btn-proceed-checkout');
    if (button.dataset.submitting !== '1') {
      button.disabled = !checkoutReady || !items.length;
      button.textContent = 'Xác nhận đặt hàng';
    }
  }
  async function checkoutPage() {
    if (!document.getElementById('checkout-page')) return;
    const container = document.getElementById('checkout-recipient');
    try {
      const user = await requireUser('checkout.html');
      if (!user) return;
      if (!selectedItems().length) { container.innerHTML = '<p>Vui lòng quay lại giỏ hàng và chọn sản phẩm cần mua.</p>'; renderCheckoutSummary(); return; }
      checkoutEntries = await addresses(user);
      if (checkoutEntries.length) {
        const savedIndex = checkoutEntries.findIndex(entry => addressKey(entry) === readDraft().addressKey);
        checkoutAddressIndex = savedIndex >= 0 ? savedIndex : 0;
        renderDeliveryCard();
      } else {
        container.innerHTML = `<p>Nhập thông tin người nhận để đặt hàng.</p><form id="checkout-shipping-form"><label>Họ tên người nhận<input name="fullName" required maxlength="100" autocomplete="shipping name" value="${escape(user.fullName)}"></label><label>Số điện thoại<input name="phone" type="tel" required autocomplete="shipping tel" pattern="(0|\\+84)[0-9]{8,11}"></label>${addressFields()}<button type="submit" hidden>Kiểm tra thông tin</button></form>`;
        const form = document.getElementById('checkout-shipping-form');
        form.onsubmit = event => { event.preventDefault(); document.getElementById('btn-proceed-checkout').click(); };
        if (!await mountAddressPicker(form, user)) return;
      }
      checkoutReady = true;
      await refreshCoupon();
      renderCheckoutSummary();
    } catch (error) { container.textContent = error.message; }
  }
  async function prepareCheckout(paymentMethod) {
    const initialItems = selectedItems();
    if (!initialItems.length) throw new Error('Vui lòng tick chọn ít nhất một sản phẩm để thanh toán.');
    const initialSignature = selectionSignature(initialItems);
    saveDraft({ paymentMethod });
    const user = await requireUser('checkout.html');
    if (!user) return null;
    if (!document.getElementById('checkout-page')) { location.href = 'checkout.html'; return null; }
    if (!checkoutReady) throw new Error('Vui lòng chờ tải thông tin nhận hàng.');
    let shipping;
    const form = document.getElementById('checkout-shipping-form');
    if (form) {
      if (!form.reportValidity()) return null;
      shipping = Object.fromEntries(new FormData(form));
      for (const field of Object.keys(shipping)) shipping[field] = shipping[field].trim();
      shipping.phone = shipping.phone.replace(/[\s.-]/g, '');
      if (!validShipping(shipping)) throw new Error('Vui lòng nhập đầy đủ thông tin nhận hàng hợp lệ.');
      const remaining = savedAddresses(user).filter(entry => entry.address !== shipping.address || entry.phone !== shipping.phone);
      localStorage.setItem(key(user), JSON.stringify([shipping, ...remaining].slice(0, 10)));
    } else shipping = checkoutEntries[checkoutAddressIndex];
    if (!shipping) throw new Error('Vui lòng chọn địa chỉ nhận hàng.');
    await refreshCoupon(true);
    if (initialSignature !== selectionSignature()) throw new Error('Giỏ hàng đã thay đổi. Vui lòng kiểm tra và xác nhận lại.');
    saveDraft({ paymentMethod });
    return { ...shipping, paymentMethod, userId: user.id, cartItems: initialItems };
  }
  function rememberOrder(order, shipping) {
    if (order?.orderCode) {
      try { localStorage.setItem(`auralie_recipient_${shipping.userId}_${order.orderCode}`, JSON.stringify(shipping)); } catch { /* Order remains valid if browser storage is full. */ }
    }
  }
  async function trackOrder(code, phone = '') {
    try {
      const order = await request(`/api/v1/orders/track/${encodeURIComponent(code)}?phone=${encodeURIComponent(phone)}`);
      let recipient;
      try { recipient = JSON.parse(localStorage.getItem(`auralie_recipient_${order.userId}_${order.orderCode}`) || 'null'); } catch { /* No local snapshot. */ }
      const statuses = { PENDING: 'Chờ thanh toán', CONFIRMED: 'Đã xác nhận', SHIPPED: 'Đang giao hàng', COMPLETED: 'Đã hoàn thành', CANCELLED: 'Đã hủy' };
      const name = order.isFullyVerified && recipient && recipient.phone === order.phoneNumber ? recipient.fullName : 'Chưa lưu tên người nhận riêng';
      await dialog(`Đơn hàng ${order.orderCode}`, `<dl class="commerce-details">
        <dt>Người nhận</dt><dd>${escape(name)}</dd><dt>Số điện thoại</dt><dd>${escape(order.phoneNumber || 'Chưa lưu')}</dd>
        <dt>Địa chỉ nhận hàng</dt><dd>${escape(order.shippingAddress || 'Chưa lưu')}</dd>
        <dt>Trạng thái</dt><dd>${escape(statuses[order.status] || order.status)}</dd>
        <dt>Thanh toán</dt><dd>${escape(order.paymentMethod)} — ${order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}</dd>
        <dt>Mã vận đơn</dt><dd>${escape(order.trackingCode || 'Chưa có')}</dd>
        <dt>Tổng tiền</dt><dd>${Number(order.totalAmount).toLocaleString('vi-VN')} ₫</dd></dl>
        ${!order.isFullyVerified ? '<p>Cung cấp số điện thoại đặt hàng để xem đầy đủ thông tin nhận hàng.</p>' : ''}
        <h3>Sản phẩm trong đơn</h3><ul>${order.items.map(item => `<li>${escape(item.name)} — ${escape(item.size)} / ${escape(item.color)} × ${Number(item.quantity)}</li>`).join('')}</ul>`, 'Đóng');
    } catch (error) { await notify(error.message); }
  }
  async function openTracker() {
    const result = await dialog('Tra cứu đơn hàng', '<label>Mã đơn hàng<input name="code" required maxlength="50" placeholder="Nhập mã đơn hàng"></label><label>Số điện thoại đặt hàng<input name="phone" type="tel" placeholder="Nhập để xem đầy đủ thông tin"></label>', 'Tra cứu');
    if (result) await trackOrder(result.code.trim(), result.phone.trim());
  }
  const reordering = new Set();
  async function reorder(id) {
    if (reordering.has(id)) return;
    reordering.add(id);
    try {
      if (!await requireUser('profile.html#orders')) return;
      const order = await request(`/api/v1/orders/${id}`);
      if (!order.items.length || order.items.some(item => !Number.isInteger(Number(item.variantId)) || Number(item.variantId) <= 0 || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0)) throw new Error('Một số sản phẩm trong đơn cũ không còn khả dụng. Vui lòng chọn lại sản phẩm.');
      // Sum duplicate lines only within the original order, never with the current cart.
      const orderedVariants = new Map();
      for (const item of order.items) {
        const variant = Number(item.variantId);
        const previous = orderedVariants.get(variant);
        orderedVariants.set(variant, { ...item, quantity: (previous?.quantity || 0) + Number(item.quantity) });
      }
      const sameVariant = (row, item) => {
        const variant = row.variantId || row.variant_id;
        if (variant) return Number(variant) === Number(item.variantId);
        return item.productId && Number(row.productId ?? row.id) === Number(item.productId)
          && String(row.size || '').trim() === String(item.size || '').trim()
          && String(row.color || '').trim() === String(item.color || '').trim();
      };
      const currentCart = window.getCart();
      const items = [...orderedVariants.values()];
      const remaining = currentCart.filter(row => !items.some(item => sameVariant(row, item))).map(row => ({ ...row, selected: false }));
      const reordered = items.map(item => {
        const existing = currentCart.find(row => sameVariant(row, item));
        const line = { ...existing, id: item.productId || `variant-${item.variantId}`, variantId: Number(item.variantId), name: item.productName, size: item.size, color: item.color, qty: item.quantity, price: item.price, selected: true, img: existing?.img || 'assets/card_1.jpg' };
        delete line.quantity;
        return line;
      });
      window.saveCart([...remaining, ...reordered]);
      location.href = 'checkout.html';
    } catch (error) { await notify(error.message); }
    finally { reordering.delete(id); }
  }
  async function editAddress(isNew = false) {
    const user = await requireUser('profile.html#orders');
    if (!user) return;
    try {
      const entries = await addresses(user);
      const current = !isNew && entries[0] ? entries[0] : { fullName: user.fullName, phone: '', address: '' };
      const value = await dialog(isNew ? 'Thêm thông tin nhận hàng' : 'Sửa thông tin nhận hàng', `
        <label>Họ tên người nhận<input name="fullName" required maxlength="100" value="${escape(current.fullName)}"></label>
        <label>Số điện thoại<input name="phone" type="tel" required pattern="(0|\\+84)[0-9]{8,11}" value="${escape(current.phone)}"></label>
        ${addressFields(current)}
        <p>Thông tin được lưu theo tài khoản trên trình duyệt này.</p>`, 'Lưu thông tin', form => { void mountAddressPicker(form, user, current); });
      if (!value) return;
      for (const field of Object.keys(value)) value[field] = value[field].trim();
      if (!validShipping(value)) throw new Error('Vui lòng nhập đầy đủ thông tin nhận hàng hợp lệ.');
      const remaining = savedAddresses(user).filter(entry => !(entry.phone === value.phone && entry.address === value.address) && (isNew || addressKey(entry) !== addressKey(current)));
      localStorage.setItem(key(user), JSON.stringify([value, ...remaining].slice(0, 10)));
      document.getElementById('address-display-text').textContent = value.address;
      document.getElementById('address-phone-text').textContent = 'SĐT: ' + value.phone;
      await notify('Đã lưu thông tin nhận hàng trên trình duyệt này.');
    } catch (error) { await notify(error.message); }
  }
  async function shippingPage() {
    const form = document.getElementById('shipping-form');
    if (!form) return;
    form.onsubmit = event => event.preventDefault();
    const checkout = new URLSearchParams(location.search).has('checkout');
    const backLink = document.getElementById('shipping-back-link');
    if (backLink && !checkout) { backLink.href = 'profile.html#address'; backLink.textContent = '← Quay lại sổ địa chỉ'; }
    const user = await requireUser(checkout ? 'shipping.html?checkout=1' : 'shipping.html');
    if (!user) { form.querySelector('button[type="submit"]').disabled = true; return; }
    try {
      const entries = await addresses(user);
      const params = new URLSearchParams(location.search);
      const index = Number(params.get('addressIndex') || 0);
      const current = !params.has('new') && entries[index] ? entries[index] : { fullName: user.fullName, phone: user.phone || '', address: user.address || '' };
      for (const field of ['fullName', 'phone']) form.elements[field].value = current[field] || '';
      form.querySelector('[data-address-fields]').innerHTML = addressFields(current);
      if (!await mountAddressPicker(form, user, current)) return;
      form.onsubmit = event => {
        event.preventDefault();
        const value = Object.fromEntries(new FormData(form));
        for (const field of Object.keys(value)) value[field] = value[field].trim();
        value.phone = value.phone.replace(/[\s.-]/g, '');
        if (!validShipping(value)) { notify('Vui lòng nhập họ tên, số điện thoại hợp lệ và địa chỉ tối thiểu 5 ký tự.'); return; }
        const saved = savedAddresses(user).filter(entry => !(entry.phone === value.phone && entry.address === value.address) && (params.has('new') || addressKey(entry) !== addressKey(current)));
        try { localStorage.setItem(key(user), JSON.stringify([value, ...saved].slice(0, 10))); }
        catch { notify('Không thể lưu địa chỉ trong trình duyệt. Vui lòng cho phép lưu trữ và thử lại.'); return; }
        if (checkout) saveDraft({ addressKey: addressKey(value) });
        location.href = checkout ? 'checkout.html' : 'profile.html#address';
      };
      form.querySelector('button[type="submit"]').disabled = false;
    } catch (error) { await notify(error.message); }
  }
  window.Commerce = { escape, request, dialog, notify, requireUser, prepareCheckout, rememberOrder, trackOrder, openTracker, reorder, shippingPage, savedAddresses, validShipping, editAddress, normalizeCart, selectedItems, readDraft, saveDraft, restoreDraft, refreshCoupon, cartChanged, completePurchase, applyCoupon, checkoutPage, renderCheckoutSummary };
  document.addEventListener('DOMContentLoaded', () => { shippingPage(); });
})();
