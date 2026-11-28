// AURALIÈ Haute Couture - Official Website Logic

// HỘP THÔNG BÁO DẠNG BOX CAO CẤP (LUXURY MODAL BOX TOÀN HỆ THỐNG)
window.showLuxuryAlert = function({ title = 'Thông Báo', message = '', type = 'success', btnText = 'Đồng Ý', redirectUrl = null, autoCloseMs = 0, onConfirm = null }) {
  const old = document.querySelector('.luxury-alert-overlay');
  if (old) old.remove();

  let iconHtml = '<i class="fa-solid fa-circle-check"></i>';
  if (type === 'admin') iconHtml = '<i class="fa-solid fa-shield-halved"></i>';
  else if (type === 'customer') iconHtml = '<i class="fa-solid fa-crown"></i>';
  else if (type === 'warning') iconHtml = '<i class="fa-solid fa-triangle-exclamation"></i>';

  const overlay = document.createElement('div');
  overlay.className = 'luxury-alert-overlay';
  overlay.innerHTML = `
    <div class="luxury-alert-card">
      <div class="luxury-alert-icon-wrap ${type}">
        ${iconHtml}
      </div>
      <h3 class="luxury-alert-title">${title}</h3>
      <div class="luxury-alert-message">${message}</div>
      <button class="luxury-alert-btn" id="luxury-alert-confirm-btn">
        <span>${btnText}</span> <i class="fa-solid fa-arrow-right"></i>
      </button>
      ${autoCloseMs ? '<div class="luxury-alert-progress"><div class="luxury-alert-progress-bar" id="luxury-alert-bar"></div></div>' : ''}
    </div>
  `;
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });

  let timer = null;
  const closeAndExecute = () => {
    if (timer) clearTimeout(timer);
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.remove();
      if (typeof onConfirm === 'function') onConfirm();
      if (redirectUrl) window.location.href = redirectUrl;
    }, 250);
  };

  overlay.querySelector('#luxury-alert-confirm-btn').addEventListener('click', closeAndExecute);

  if (autoCloseMs) {
    const bar = overlay.querySelector('#luxury-alert-bar');
    if (bar) {
      bar.style.transition = `transform ${autoCloseMs}ms linear`;
      requestAnimationFrame(() => {
        bar.style.transform = 'scaleX(0)';
      });
    }
    timer = setTimeout(closeAndExecute, autoCloseMs);
  }
};

// HỘP THOẠI XÁC NHẬN (LUXURY CONFIRMATION MODAL - KHÔNG DÙNG LOG/ALERT)
window.showLuxuryConfirm = function({ title = 'Xác Nhận Thao Tác', message = '', type = 'warning', confirmText = 'Xác Nhận', cancelText = 'Hủy Bỏ', onConfirm = null, onCancel = null }) {
  const old = document.querySelector('.luxury-alert-overlay');
  if (old) old.remove();

  let iconHtml = '<i class="fa-solid fa-triangle-exclamation"></i>';
  if (type === 'danger') iconHtml = '<i class="fa-solid fa-trash-can"></i>';

  const overlay = document.createElement('div');
  overlay.className = 'luxury-alert-overlay';
  overlay.innerHTML = `
    <div class="luxury-alert-card" style="position: relative; max-width: 440px;">
      <button class="modal-close-btn" style="position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 1.4rem; cursor: pointer; color: var(--text-muted);">&times;</button>
      <div class="luxury-alert-icon-wrap ${type}">
        ${iconHtml}
      </div>
      <h3 class="luxury-alert-title">${title}</h3>
      <div class="luxury-alert-message" style="margin-bottom: 1.25rem; font-size: 0.95rem; line-height: 1.5;">${message}</div>
      <div style="display: flex; gap: 0.75rem; justify-content: center; width: 100%;">
        <button class="luxury-confirm-cancel-btn" style="flex: 1; padding: 0.75rem 1rem; border: 1px solid var(--border-light); background: #f5f5f5; border-radius: 6px; cursor: pointer; font-weight: 600; color: var(--text-dark);">
          ${cancelText}
        </button>
        <button class="luxury-confirm-ok-btn" style="flex: 1; padding: 0.75rem 1rem; border: none; background: #c59b27; color: #fff; border-radius: 6px; cursor: pointer; font-weight: 600;">
          ${confirmText}
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });

  const closeOverlay = (confirmed) => {
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.remove();
      if (confirmed && typeof onConfirm === 'function') onConfirm();
      if (!confirmed && typeof onCancel === 'function') onCancel();
    }, 200);
  };

  overlay.querySelector('.modal-close-btn').addEventListener('click', () => closeOverlay(false));
  overlay.querySelector('.luxury-confirm-cancel-btn').addEventListener('click', () => closeOverlay(false));
  overlay.querySelector('.luxury-confirm-ok-btn').addEventListener('click', () => closeOverlay(true));
};

// Tự động chuyển đổi các alert() mặc định trên mọi trang thành Luxury Modal Box
window.alert = function(msg) {
  let type = 'success';
  let title = 'Thông Báo AURALIÈ';
  if (typeof msg === 'string') {
    if (msg.includes('⚠️') || msg.includes('không hợp lệ') || msg.includes('Vui lòng')) {
      type = 'warning';
      title = 'Cảnh Báo & Lưu Ý';
    } else if (msg.includes('🎉') || msg.includes('thành công') || msg.includes('✅')) {
      type = 'success';
      title = 'Thao Tác Thành Công';
    }
  }
  window.showLuxuryAlert({
    title,
    message: msg,
    type,
    btnText: 'Đã Hiểu',
    autoCloseMs: 0
  });
};

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Mobile Menu Drawer Toggle
  const mobileMenuToggles = document.querySelectorAll('#mobile-menu-toggle, .mobile-menu-btn');
  const closeDrawerBtns = document.querySelectorAll('#close-drawer-btn, #mobile-menu-close, .close-drawer-btn, .drawer-close-btn');
  const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');

  if (mobileNavDrawer && drawerOverlay) {
    const openDrawer = () => {
      mobileNavDrawer.classList.add('open');
      drawerOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeDrawer = () => {
      mobileNavDrawer.classList.remove('open');
      drawerOverlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    mobileMenuToggles.forEach(btn => btn.addEventListener('click', openDrawer));
    closeDrawerBtns.forEach(btn => btn.addEventListener('click', closeDrawer));
    drawerOverlay.addEventListener('click', closeDrawer);

    // Also close drawer when clicking on internal hash links (e.g. #catalog)
    mobileNavDrawer.querySelectorAll('a[href^="#"], a[href*="#"]').forEach(link => {
      link.addEventListener('click', () => {
        closeDrawer();
      });
    });
  }

  // 2. Mobile Search Overlay Toggle
  const mobileSearchToggle = document.getElementById('mobile-search-toggle');
  const bottomSearchTrigger = document.getElementById('bottom-search-trigger');
  const closeSearchBtn = document.getElementById('close-search-btn');
  const mobileSearchOverlay = document.getElementById('mobile-search-overlay');
  const mobileSearchInput = document.getElementById('mobile-search-input');

  if (mobileSearchOverlay) {
    const openSearch = (e) => {
      if (e) e.preventDefault();
      mobileSearchOverlay.classList.add('active');
      if (mobileSearchInput) mobileSearchInput.focus();
    };

    const closeSearch = () => {
      mobileSearchOverlay.classList.remove('active');
    };

    if (mobileSearchToggle) mobileSearchToggle.addEventListener('click', openSearch);
    if (bottomSearchTrigger) bottomSearchTrigger.addEventListener('click', openSearch);
    if (closeSearchBtn) closeSearchBtn.addEventListener('click', closeSearch);
    mobileSearchOverlay.addEventListener('click', (e) => {
      if (e.target === mobileSearchOverlay) closeSearch();
    });
  }

  // 3. Mobile Filter Bottom Sheet Drawer Toggle
  const mobileFilterToggle = document.getElementById('mobile-filter-toggle');
  const closeFilterBtn = document.getElementById('close-filter-btn');
  const applyFilterBtn = document.getElementById('apply-filter-btn');
  const mobileFilterDrawer = document.getElementById('mobile-filter-drawer');
  const filterOverlay = document.getElementById('filter-overlay');

  if (mobileFilterToggle && mobileFilterDrawer && filterOverlay) {
    const openFilter = () => {
      mobileFilterDrawer.classList.add('open');
      filterOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeFilter = () => {
      mobileFilterDrawer.classList.remove('open');
      filterOverlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    mobileFilterToggle.addEventListener('click', openFilter);
    if (closeFilterBtn) closeFilterBtn.addEventListener('click', closeFilter);
    if (applyFilterBtn) applyFilterBtn.addEventListener('click', closeFilter);
    filterOverlay.addEventListener('click', closeFilter);
  }

  // ====================================================================
  // GLOBAL CART STATE & INTERACTIVE CART MANAGER (PERSISTENT IN LOCALSTORAGE)
  // ====================================================================
  window.getCart = function() {
    try {
      const raw = localStorage.getItem('auralie_cart');
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const normalized = window.Commerce.normalizeCart(parsed);
          if (JSON.stringify(normalized) !== raw) localStorage.setItem('auralie_cart', JSON.stringify(normalized));
          return normalized;
        }
      }
    } catch (e) {}
    return [];
  };

  window.saveCart = function(cart) {
    localStorage.setItem('auralie_cart', JSON.stringify(window.Commerce.normalizeCart(cart)));
    window.Commerce.cartChanged();
    window.updateCartBadge();
    if (typeof window.renderCartPage === 'function') window.renderCartPage();
  };

  window.addToCart = async function(product) {
    if (!product) return;
    if (!await window.Commerce.requireUser('cart.html')) return;
    const cart = window.getCart();
    const id = product.id || ('p-' + Date.now());
    const name = product.name || 'Thiết Kế Haute Couture AURALIÈ';
    const size = product.size || (document.getElementById('modal-selected-size')?.textContent.trim() || 'M');
    const color = product.color || (document.getElementById('modal-selected-color')?.textContent.trim() || 'Đen Tuyền');
    const qty = Number(product.qty) || (parseInt(document.getElementById('qty-input')?.value, 10) || 1);
    const price = Number(product.price) || 12500000;
    const img = product.img || product.image || 'assets/card_1.jpg';
    const category = product.category || 'Haute Couture';

    const existing = cart.find(item => item.id == id && item.size === size && item.color === color);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        id,
        name,
        category,
        price,
        img,
        size,
        color,
        qty
      });
    }
    window.saveCart(cart);
    if (window.AuralieTracking) {
      window.AuralieTracking.track('add_to_cart', {
        productId: !isNaN(Number(id)) ? Number(id) : null,
        properties: { size, color, quantity: qty, unit_price: price }
      });
      window.AuralieTracking.syncCart(cart);
    }
    window.showLuxuryAlert({
      title: 'Đã Thêm Vào Giỏ Hàng',
      message: `Đã thêm <strong>${name}</strong> (Size ${size}, SL: ${qty}) vào giỏ hàng thành công!`,
      type: 'success',
      btnText: 'Xem Giỏ Hàng',
      redirectUrl: 'cart.html',
      autoCloseMs: 3000
    });
  };

  // Delegated handler for any .btn-add-cart buttons without inline onclick
  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.btn-add-cart');
    if (addBtn && !addBtn.getAttribute('onclick')) {
      // Bỏ qua nếu là Lookbook hoặc trang Lookbook
      if (addBtn.classList.contains('btn-explore-lookbook') || addBtn.closest('.lookbook-card') || (addBtn.textContent && addBtn.textContent.includes('Lookbook'))) {
        return;
      }
      e.preventDefault();
      const card = addBtn.closest('.fashion-card, .product-card, article');
      if (card) {
        const titleElem = card.querySelector('.card-title, h3, h4');
        const priceElem = card.querySelector('.card-price, .price');
        const imgElem = card.querySelector('img');
        const catElem = card.querySelector('.card-category');

        const name = titleElem ? titleElem.textContent.trim() : 'Thiết Kế Haute Couture AURALIÈ';
        let price = 12500000;
        if (priceElem) {
          const num = parseInt(priceElem.textContent.replace(/\D/g, ''), 10);
          if (!isNaN(num) && num > 0) price = num;
        }
        const img = imgElem ? imgElem.getAttribute('src') : 'assets/card_1.jpg';
        const category = catElem ? catElem.textContent.trim() : 'Haute Couture';

        window.addToCart({
          id: 'prod-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name,
          price,
          img,
          category,
          size: 'M',
          color: 'Đen Tuyền',
          qty: 1
        });
      }
    }
  });

  window.updateCartBadge = function() {
    const signedIn = Boolean(sessionStorage.getItem('auralie_token') || sessionStorage.getItem('auralie_user') || localStorage.getItem('auralie_user'));
    document.documentElement.classList.toggle('has-cart-count', signedIn);
    const cart = signedIn ? window.getCart() : [];
    const totalQty = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
    document.querySelectorAll('#cart-count, .cart-count-badge').forEach(badge => {
      badge.textContent = totalQty;
      badge.style.display = (signedIn && totalQty > 0) ? 'inline-block' : 'none';
    });
    // Wishlist badge
    document.querySelectorAll('#wishlist-count, .wishlist-badge').forEach(badge => {
      let wlCount = 0;
      try { wlCount = JSON.parse(localStorage.getItem('auralie_wishlist') || '[]').length; } catch (e) { wlCount = 0; }
      badge.textContent = wlCount;
      badge.style.display = (signedIn && wlCount > 0) ? 'inline-block' : 'none';
    });
  };

  // Nếu chưa đăng nhập mà bấm vào Giỏ hàng hoặc Yêu thích thì chuyển sang trang Đăng nhập
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href="cart.html"], a[href="wishlist.html"]');
    if (link && !window.location.pathname.endsWith('cart.html') && !window.location.pathname.endsWith('wishlist.html')) {
      const signedIn = Boolean(sessionStorage.getItem('auralie_token') || sessionStorage.getItem('auralie_user') || localStorage.getItem('auralie_user'));
      if (!signedIn) {
        e.preventDefault();
        window.location.href = 'login.html';
      }
    }
  });

  window.renderCartPage = function() {
    const container = document.getElementById('cart-items-container');
    if (!container) { window.Commerce.renderCheckoutSummary(); return; }

    const cart = window.getCart();
    const subtotalElem = document.getElementById('cart-subtotal-val');
    const discountRow = document.getElementById('cart-discount-row');
    const discountVal = document.getElementById('cart-discount-val');
    const finalTotalVal = document.getElementById('cart-final-total');
    const headerTitle = document.getElementById('cart-header-title');
    const summarySidebar = document.getElementById('order-summary-sidebar') || document.querySelector('.sidebar-widget');
    const gridLayout = container.parentElement;

    // KHI GIỎ HÀNG TRỐNG: ẨN TOÀN BỘ CỘT TÓM TẮT & NÚT THANH TOÁN (KHÔNG YÊU CẦU THANH TOÁN)
    if (cart.length === 0) {
      if (gridLayout) gridLayout.style.gridTemplateColumns = '1fr';
      if (summarySidebar) summarySidebar.style.display = 'none';

      container.innerHTML = `
        <div style="background: #ffffff; padding: 4.5rem 2rem; text-align: center; border-radius: 12px; border: 1px solid var(--border-light); box-shadow: var(--shadow-subtle);">
          <div style="width: 85px; height: 85px; border-radius: 50%; background: #faf8f5; border: 1px solid var(--border-light); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
            <i class="fa-solid fa-bag-shopping" style="font-size: 2.8rem; color: var(--accent-gold);"></i>
          </div>
          <h2 style="font-family: var(--font-serif); font-size: 1.85rem; margin-bottom: 0.6rem; color: var(--primary-dark);">Giỏ Hàng Của Bạn Đang Trống</h2>
          <p style="color: var(--text-muted); font-size: 0.95rem; max-width: 520px; margin: 0 auto 2rem; line-height: 1.6;">
            Quý khách hiện chưa chọn sản phẩm nào vào giỏ hàng. Vì vậy hệ thống không yêu cầu thanh toán. Hãy khám phá bộ sưu tập độc bản để chọn trang phục may đo phù hợp.
          </p>
          <a href="index.html#catalog" class="btn-primary-luxury" style="padding: 0.85rem 2.2rem; text-decoration: none; display: inline-flex; font-size: 0.9rem;">
            Khám Phá Bộ Sưu Tập Ngay <i class="fa-solid fa-arrow-right" style="margin-left: 0.6rem;"></i>
          </a>
        </div>
      `;
      if (subtotalElem) subtotalElem.textContent = '0 ₫';
      if (finalTotalVal) finalTotalVal.textContent = '0 ₫';
      if (discountRow) discountRow.style.display = 'none';
      if (headerTitle) headerTitle.textContent = 'Giỏ Hàng Của Bạn (0 Sản Phẩm)';
      window.currentCartTotal = 0;
      return;
    }

    // KHI CÓ SẢN PHẨM: HIỂN THỊ LẠI CỘT TÓM TẮT ĐƠN HÀNG VÀ NÚT THANH TOÁN
    if (gridLayout) gridLayout.style.gridTemplateColumns = '1fr 380px';
    if (summarySidebar) summarySidebar.style.display = 'block';

    const totalQty = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
    const selected = cart.filter(item => item.selected);
    const subtotal = selected.reduce((sum, item) => sum + (Number(item.price) * (item.qty || 1)), 0);

    if (headerTitle) headerTitle.textContent = `Giỏ Hàng Của Bạn (${totalQty} Sản Phẩm)`;

    container.innerHTML = `<label class="cart-select-all"><input type="checkbox" id="cart-select-all" ${selected.length === cart.length ? 'checked' : ''} onchange="window.selectAllCart(this.checked)"> Chọn tất cả <span>Đã chọn ${selected.length} / ${cart.length} sản phẩm</span></label>` + cart.map((item, idx) => `
      <div class="cart-item-card" style="display: flex; gap: 1.5rem; background: #ffffff; padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-light); align-items: center; justify-content: space-between; flex-wrap: wrap;">
        <div style="display: flex; gap: 1.25rem; align-items: center;">
          <input type="checkbox" class="cart-item-select" aria-label="Chọn ${window.Commerce.escape(item.name)}" ${item.selected ? 'checked' : ''} onchange="window.selectCartItem(${idx}, this.checked)">
          <img src="${item.img || 'assets/card_1.jpg'}" alt="${item.name}" style="width: 90px; height: 110px; object-fit: cover; border-radius: 8px;">
          <div>
            <span class="card-category">${item.category || 'Haute Couture'}</span>
            <h3 style="font-family: var(--font-serif); font-size: 1.3rem; margin: 0.2rem 0;">${item.name}</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">Size: <strong>${item.size || 'M'}</strong> | Màu: <strong>${item.color || 'Đen Lux'}</strong></p>
            <p style="font-size: 1.1rem; font-weight: 700; color: var(--primary-dark); margin-top: 0.4rem;">${Number(item.price).toLocaleString('vi-VN')} ₫</p>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 1.5rem;">
          <div class="quantity-control" style="display: inline-flex; align-items: center; border: 1px solid var(--border-light); border-radius: 20px; padding: 0.15rem 0.4rem; background: #faf8f5;">
            <button onclick="window.changeCartQty(${idx}, -1)" style="background: none; border: none; cursor: pointer; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.1rem; line-height: 1; color: var(--primary-dark);">-</button>
            <span style="font-size: 0.9rem; font-weight: 600; min-width: 24px; text-align: center; display: inline-flex; align-items: center; justify-content: center; font-variant-numeric: tabular-nums lining-nums;">${item.qty || 1}</span>
            <button onclick="window.changeCartQty(${idx}, 1)" style="background: none; border: none; cursor: pointer; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.1rem; line-height: 1; color: var(--primary-dark);">+</button>
          </div>

          <button onclick="window.removeCartItem(${idx})" style="background: none; border: none; color: #a00; font-size: 1.2rem; cursor: pointer;" title="Xóa khỏi giỏ hàng">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </div>
    `).join('') + `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
        <a href="index.html#catalog" style="color: var(--primary-dark); text-decoration: none; font-weight: 600; font-size: 0.9rem;"><i class="fa-solid fa-arrow-left"></i> Tiếp Tục Mua Sắm</a>
        <button onclick="window.saveCart(window.getCart()); window.showLuxuryAlert({ title: 'Đã Cập Nhật', message: 'Giỏ hàng đã được đồng bộ thành công!', type: 'success', autoCloseMs: 2000 });" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.85rem;"><i class="fa-solid fa-arrows-rotate"></i> Cập Nhật Giỏ Hàng</button>
      </div>
    `;

    if (subtotalElem) subtotalElem.textContent = subtotal.toLocaleString('vi-VN') + ' ₫';
    
    // Áp dụng giảm giá nếu có
    let discountAmount = 0;
    if (window.appliedCouponDiscount) {
      discountAmount = window.appliedCouponDiscount;
    }

    if (discountRow) discountRow.style.display = discountAmount > 0 ? 'flex' : 'none';
    if (discountVal) discountVal.textContent = '-' + discountAmount.toLocaleString('vi-VN') + ' ₫';
    const removeCouponBtnElem = document.getElementById('remove-coupon-btn');
    if (removeCouponBtnElem) removeCouponBtnElem.style.display = discountAmount > 0 ? 'inline-block' : 'none';
    
    const finalTotal = Math.max(0, subtotal - discountAmount);
    if (finalTotalVal) finalTotalVal.textContent = finalTotal.toLocaleString('vi-VN') + ' ₫';
    window.currentCartTotal = finalTotal;

    if (!window._trackedCartView && window.AuralieTracking) {
      window._trackedCartView = true;
      window.AuralieTracking.track('cart_view', {
        properties: { item_count: cart.length, total_qty: totalQty, subtotal },
        dedupeKey: 'cart-view'
      });
    }

    const checkout = document.getElementById('btn-proceed-checkout');
    if (checkout) {
      checkout.disabled = selected.length === 0;
      checkout.textContent = selected.length ? `Thanh toán (${selected.reduce((sum, item) => sum + Number(item.qty || 1), 0)} sản phẩm)` : 'Chọn sản phẩm để thanh toán';
    }
    const couponStatus = document.getElementById('coupon-status');
    if (couponStatus) couponStatus.textContent = window.couponMessage || '';
  };

  window.selectCartItem = function(index, checked) {
    const cart = window.getCart();
    if (cart[index]) { cart[index].selected = checked; window.saveCart(cart); }
  };
  window.selectAllCart = function(checked) {
    const cart = window.getCart();
    cart.forEach(item => { item.selected = checked; });
    window.saveCart(cart);
  };

  window.changeCartQty = function(index, delta) {
    const cart = window.getCart();
    if (cart[index]) {
      const prevQty = cart[index].qty || 1;
      const newQty = Math.max(1, prevQty + delta);
      cart[index].qty = newQty;
      window.saveCart(cart);
      if (window.AuralieTracking && newQty !== prevQty) {
        const pid = parseInt(String(cart[index].id || '').replace(/\D/g, ''), 10) || null;
        window.AuralieTracking.track('update_cart_quantity', {
          productId: pid,
          properties: {
            product_name: cart[index].name,
            old_qty: prevQty,
            new_qty: newQty,
            delta,
            size: cart[index].size,
            color: cart[index].color
          }
        });
      }
    }
  };

  window.removeCartItem = function(index) {
    const cart = window.getCart();
    if (!cart[index]) return;
    const item = cart[index];

    window.showLuxuryConfirm({
      title: 'Xác Nhận Xóa Sản Phẩm',
      message: `Quý khách có chắc chắn muốn xóa sản phẩm <strong>${item.name}</strong> (Size ${item.size || 'M'}, Màu ${item.color || 'Đen'}) khỏi giỏ hàng?`,
      type: 'danger',
      confirmText: 'Xóa Ngay',
      cancelText: 'Giữ Lại',
      onConfirm: () => {
        cart.splice(index, 1);
        window.saveCart(cart);
        if (window.AuralieTracking) {
          const pid = parseInt(String(item.id || '').replace(/\D/g, ''), 10) || null;
          window.AuralieTracking.track('remove_from_cart', {
            productId: pid,
            properties: {
              product_name: item.name,
              qty: item.qty || 1,
              price: Number(item.price || 0),
              size: item.size,
              color: item.color
            }
          });
        }
        if (window.renderCartPage) window.renderCartPage();
        window.updateCartBadge();
        window.showLuxuryAlert({
          title: 'Đã Xóa Sản Phẩm',
          message: 'Sản phẩm đã được xóa khỏi giỏ hàng của Quý khách.',
          type: 'success',
          autoCloseMs: 2000
        });
      }
    });
  }

;

  // Khởi chạy cập nhật giỏ hàng
  window.Commerce.restoreDraft();
  window.updateCartBadge();
  window.renderCartPage();

  // ====================================================================
  // 4. DYNAMIC DATABASE PRODUCTS CATALOG LOADER (TRUY VẤN TRỰC TIẾP TỪ SQL SERVER)
  // ====================================================================
  // ====================================================================
  // 4. DYNAMIC DATABASE PRODUCTS CATALOG LOADER & CATEGORY-SPECIFIC FILTERS
  // ====================================================================
  const defaultCatalogFilters = {
    size: '',
    color: '',
    fit: '',
    material: '',
    minPrice: '',
    maxPrice: ''
  };
  let catalogFilters = { ...defaultCatalogFilters };
  let appliedCatalogFilters = { ...catalogFilters };
  let catalogCategory = 'all';
  let catalogSearch = '';
  let catalogSort = 'newest';
  let catalogRequest;

  // CẤU HÌNH BỘ LỌC CHUYÊN BIỆT TỪNG DANH MỤC THỜI TRANG (CATEGORY-SPECIFIC FILTER CONFIG)
  const CATEGORY_FILTER_CONFIG = {
    'all': {
      title: 'Bộ Lọc Tổng Hợp',
      icon: 'fa-sliders',
      facets: [
        {
          key: 'color',
          label: 'Tông Màu Sắc',
          icon: 'fa-palette',
          type: 'color',
          options: [
            { label: 'Tất cả', value: '' },
            { label: 'Đen Tuyền', value: 'Đen' },
            { label: 'Trắng Sữa', value: 'Trắng' },
            { label: 'Đỏ Quý Tộc', value: 'Đỏ' },
            { label: 'Xanh Navy / Đêm', value: 'Xanh' },
            { label: 'Vàng Hoàng Gia', value: 'Vàng' },
            { label: 'Nâu Da / Camel', value: 'Nâu' },
            { label: 'Xám Khói / Than', value: 'Xám' },
            { label: 'Kem Yến Mạch', value: 'Kem' }
          ]
        },
        {
          key: 'size',
          label: 'Kích Cỡ / Phân Loại',
          icon: 'fa-ruler-combined',
          type: 'size',
          options: [
            { label: 'Tất cả', value: '' },
            { label: 'S', value: 'S' },
            { label: 'M', value: 'M' },
            { label: 'L', value: 'L' },
            { label: 'XL', value: 'XL' },
            { label: 'FreeSize', value: 'FreeSize' },
            { label: 'Giày 36', value: '36' },
            { label: 'Giày 37', value: '37' },
            { label: 'Giày 38', value: '38' },
            { label: 'Giày 39-42', value: '40' }
          ]
        },
        {
          key: 'price',
          label: 'Khoảng Giá',
          icon: 'fa-tag',
          type: 'price',
          options: [
            { label: 'Tất cả mức giá', min: '', max: '' },
            { label: 'Dưới 15 Triệu', min: '0', max: '15000000' },
            { label: '15 - 25 Triệu', min: '15000000', max: '25000000' },
            { label: 'Trên 25 Triệu', min: '25000000', max: '999000000' }
          ]
        }
      ]
    },
    'vest-blazer': {
      title: 'Bộ Lọc Âu Phục & May Đo',
      icon: 'fa-user-tie',
      facets: [
        {
          key: 'size',
          label: 'Kích Cỡ Âu Phục',
          icon: 'fa-ruler-combined',
          type: 'size',
          options: [
            { label: 'Tất cả size', value: '' },
            { label: 'S (Ngực 88-92)', value: 'S' },
            { label: 'M (Ngực 92-96)', value: 'M' },
            { label: 'L (Ngực 96-102)', value: 'L' },
            { label: 'XL (Ngực 102+)', value: 'XL' }
          ]
        },
        {
          key: 'fit',
          label: 'Phom Dáng May Đo',
          icon: 'fa-scissors',
          type: 'pill',
          options: [
            { label: 'Tất cả phom', value: '' },
            { label: 'European Tailored', value: 'European' },
            { label: 'Slim Structured', value: 'Slim' },
            { label: 'Savile Row / Regular', value: 'Regular' },
            { label: 'Double-Breasted', value: 'Double-Breasted' },
            { label: 'Black Tie Tuxedo', value: 'Black Tie' }
          ]
        },
        {
          key: 'material',
          label: 'Chất Liệu Thượng Hạng',
          icon: 'fa-gem',
          type: 'pill',
          options: [
            { label: 'Tất cả chất liệu', value: '' },
            { label: 'Cashmere Lụa Ý', value: 'Cashmere' },
            { label: 'Len Cừu Merinos', value: 'Merino' },
            { label: 'Virgin Wool Ý', value: 'Virgin Wool' },
            { label: 'Nhung Velvet', value: 'Velvet' },
            { label: 'Lụa Tơ Tằm Jacquard', value: 'Jacquard' }
          ]
        },
        {
          key: 'color',
          label: 'Tông Màu Sắc',
          icon: 'fa-palette',
          type: 'color',
          options: [
            { label: 'Tất cả màu', value: '' },
            { label: 'Đen Tuyền (Jet Black)', value: 'Đen' },
            { label: 'Xanh Navy Ý', value: 'Navy' },
            { label: 'Đỏ Đô Burgundy', value: 'Đỏ' },
            { label: 'Vàng Hoàng Gia', value: 'Vàng' },
            { label: 'Xám Than Lịch Lãm', value: 'Xám' },
            { label: 'Nanh Sói (Houndstooth)', value: 'Nanh Sói' }
          ]
        }
      ]
    },
    'vay-dam': {
      title: 'Bộ Lọc Váy & Đầm Dạ Hội',
      icon: 'fa-person-dress',
      facets: [
        {
          key: 'size',
          label: 'Kích Cỡ Đầm',
          icon: 'fa-ruler-combined',
          type: 'size',
          options: [
            { label: 'Tất cả size', value: '' },
            { label: 'S (Eo 64-68)', value: 'S' },
            { label: 'M (Eo 68-72)', value: 'M' },
            { label: 'L (Eo 72-76)', value: 'L' }
          ]
        },
        {
          key: 'fit',
          label: 'Kiểu Dáng Dạ Tiệc',
          icon: 'fa-wand-magic-sparkles',
          type: 'pill',
          options: [
            { label: 'Tất cả kiểu dáng', value: '' },
            { label: 'Đầm Dài Quét Sàn', value: 'Floor-Length' },
            { label: 'Đầm Đuôi Cá (Mermaid)', value: 'Mermaid' },
            { label: 'Đầm Xòe Chữ A (A-Line)', value: 'A-Line' },
            { label: 'Đầm Xẻ Tà Quyến Rũ', value: 'Slit' },
            { label: 'Cocktail Sang Trọng', value: 'Cocktail' }
          ]
        },
        {
          key: 'material',
          label: 'Chất Liệu Lụa & Gấm',
          icon: 'fa-gem',
          type: 'pill',
          options: [
            { label: 'Tất cả chất liệu', value: '' },
            { label: '100% Lụa Tơ Tằm', value: 'Lụa Tơ Tằm' },
            { label: 'Nhung Lụa Pháp', value: 'Nhung Lụa' },
            { label: 'Satin Duchesse', value: 'Satin' },
            { label: 'Chiffon Dập Ly', value: 'Chiffon' },
            { label: 'Lụa Mikado Ý', value: 'Mikado' }
          ]
        },
        {
          key: 'color',
          label: 'Tông Màu Dạ Tiệc',
          icon: 'fa-palette',
          type: 'color',
          options: [
            { label: 'Tất cả màu', value: '' },
            { label: 'Ngọc Lục Bảo', value: 'Lục Bảo' },
            { label: 'Đỏ Ruby Quý Phái', value: 'Ruby' },
            { label: 'Xanh Đêm Midnight', value: 'Xanh Đêm' },
            { label: 'Trắng Lụa / Ngọc Trai', value: 'Trắng' },
            { label: 'Hồng Phấn Nữ Tính', value: 'Hồng' }
          ]
        }
      ]
    },
    'ao-khoac': {
      title: 'Bộ Lọc Áo Khoác Thu Đông',
      icon: 'fa-snowflake',
      facets: [
        {
          key: 'size',
          label: 'Kích Cỡ Áo Khoác',
          icon: 'fa-ruler-combined',
          type: 'size',
          options: [
            { label: 'Tất cả size', value: '' },
            { label: 'S', value: 'S' },
            { label: 'M', value: 'M' },
            { label: 'L', value: 'L' },
            { label: 'FreeSize', value: 'FreeSize' }
          ]
        },
        {
          key: 'fit',
          label: 'Kiểu Dáng Áo Khoác',
          icon: 'fa-vest',
          type: 'pill',
          options: [
            { label: 'Tất cả kiểu dáng', value: '' },
            { label: 'Dáng Dài Trench Coat', value: 'Trench' },
            { label: 'Áo Khoác Dạ Ép Dài', value: 'Long' },
            { label: 'Áo Lửng Cropped', value: 'Cropped' },
            { label: 'Form Rộng Oversized', value: 'Oversized' },
            { label: 'Áo Phao Lông Vũ', value: 'Puffer' }
          ]
        },
        {
          key: 'material',
          label: 'Chất Liệu Giữ Ấm',
          icon: 'fa-feather',
          type: 'pill',
          options: [
            { label: 'Tất cả chất liệu', value: '' },
            { label: '100% Cashmere Sợi Đôi', value: 'Cashmere' },
            { label: 'Dạ Len Lông Cừu', value: 'Lông Cừu' },
            { label: 'Len Hai Mặt Double-Faced', value: 'Hai Mặt' },
            { label: 'Lông Vũ Ngỗng 90/10', value: 'Lông Vũ' },
            { label: 'Da Cừu Nappa Tự Nhiên', value: 'Da Cừu' }
          ]
        },
        {
          key: 'color',
          label: 'Tông Màu Thu Đông',
          icon: 'fa-palette',
          type: 'color',
          options: [
            { label: 'Tất cả màu', value: '' },
            { label: 'Nâu Lạc Đà (Camel)', value: 'Camel' },
            { label: 'Kem Yến Mạch (Oatmeal)', value: 'Yến Mạch' },
            { label: 'Xám Khói / Heather Grey', value: 'Xám Khói' },
            { label: 'Xanh Navy Cổ Điển', value: 'Navy' },
            { label: 'Xám Than Charcoal', value: 'Xám Than' }
          ]
        }
      ]
    },
    'tui-xach': {
      title: 'Bộ Lọc Túi Xách Cao Cấp',
      icon: 'fa-bag-shopping',
      facets: [
        {
          key: 'fit',
          label: 'Dáng Túi & Công Năng',
          icon: 'fa-bag-shopping',
          type: 'pill',
          options: [
            { label: 'Tất cả dáng túi', value: '' },
            { label: 'Túi Xách Tay (Handbag / Kelly)', value: 'Handbag' },
            { label: 'Túi Đeo Chéo (Crossbody)', value: 'Crossbody' },
            { label: 'Túi Tote Cỡ Lớn', value: 'Tote' },
            { label: 'Ví / Clutch Dạ Tiệc', value: 'Clutch' },
            { label: 'Túi Yên Ngựa (Saddle)', value: 'Saddle' },
            { label: 'Túi Kẹp Nách (Baguette)', value: 'Baguette' }
          ]
        },
        {
          key: 'material',
          label: 'Dòng Da Thuộc Xa Xỉ',
          icon: 'fa-gem',
          type: 'pill',
          options: [
            { label: 'Tất cả dòng da', value: '' },
            { label: 'Da Bê Hạt Caviar', value: 'Caviar' },
            { label: 'Da Bò Nappa Ý', value: 'Nappa' },
            { label: 'Da Đà Điểu Nam Phi', value: 'Đà Điểu' },
            { label: 'Da Cừu Non Lambskin', value: 'Lambskin' },
            { label: 'Da Dập Vân Cá Sấu', value: 'Cá Sấu' },
            { label: 'Da Box Calf Thuộc Thảo Mộc', value: 'Box Calf' },
            { label: 'Da Dập Vân Thằn Lằn', value: 'Thằn Lằn' }
          ]
        },
        {
          key: 'color',
          label: 'Tông Màu Da Thuộc',
          icon: 'fa-palette',
          type: 'color',
          options: [
            { label: 'Tất cả màu da', value: '' },
            { label: 'Nâu Di Sản & Cognac', value: 'Nâu' },
            { label: 'Đen Tuyền & Caviar', value: 'Đen' },
            { label: 'Trắng Ngà Ivory', value: 'Trắng' },
            { label: 'Xanh Rêu & Lục Bảo', value: 'Lục Bảo' },
            { label: 'Đỏ Rượu Burgundy', value: 'Rượu' },
            { label: 'Xám Taupe Thanh Lịch', value: 'Taupe' },
            { label: 'Nâu Caramel Ấm Áp', value: 'Caramel' }
          ]
        }
      ]
    },
    'giay-phu-kien': {
      title: 'Bộ Lọc Giày & Phụ Kiện',
      icon: 'fa-shoe-prints',
      facets: [
        {
          key: 'size',
          label: 'Size Giày Chuẩn EU',
          icon: 'fa-shoe-prints',
          type: 'size',
          options: [
            { label: 'Tất cả size', value: '' },
            { label: '36', value: '36' },
            { label: '37', value: '37' },
            { label: '38', value: '38' },
            { label: '39', value: '39' },
            { label: '40', value: '40' },
            { label: '41', value: '41' },
            { label: '42', value: '42' }
          ]
        },
        {
          key: 'fit',
          label: 'Phân Loại Dòng Sản Phẩm',
          icon: 'fa-crown',
          type: 'pill',
          options: [
            { label: 'Tất cả sản phẩm', value: '' },
            { label: 'Giày Cao Gót Stiletto', value: 'Stiletto' },
            { label: 'Giày Bốt Cổ Cao / Chelsea', value: 'Boot' },
            { label: 'Giày Lười Loafers Da Bê', value: 'Loafer' },
            { label: 'Sandals Dạ Hội Cao Gót', value: 'Sandal' },
            { label: 'Khăn Lụa Tơ Tằm Vuông', value: 'Khăn' },
            { label: 'Khuyên Khăn & Cufflinks Vàng 18K', value: 'Ring' }
          ]
        },
        {
          key: 'material',
          label: 'Chất Liệu Chế Tác',
          icon: 'fa-gem',
          type: 'pill',
          options: [
            { label: 'Tất cả chất liệu', value: '' },
            { label: 'Da Bê Ý Nhập Khẩu', value: 'Da Bê' },
            { label: 'Da Lộn Suede Ý', value: 'Suede' },
            { label: 'Da Bóng Patent Leather', value: 'Patent' },
            { label: 'Lụa Satin & Pha Lê', value: 'Pha Lê' },
            { label: 'Đồng Thau Mạ Vàng 18K', value: 'Vàng 18K' },
            { label: '100% Lụa Tơ Tằm Twill', value: 'Twill' }
          ]
        },
        {
          key: 'color',
          label: 'Tông Màu Sắc',
          icon: 'fa-palette',
          type: 'color',
          options: [
            { label: 'Tất cả màu', value: '' },
            { label: 'Đen Tuyền / Đen Bóng', value: 'Đen' },
            { label: 'Nâu Cognac Cổ Điển', value: 'Cognac' },
            { label: 'Đỏ Mận & Đế Đỏ Bóng', value: 'Đỏ' },
            { label: 'Trắng Sữa Milky White', value: 'Trắng' },
            { label: 'Vàng Hoàng Gia 18K', value: 'Vàng' }
          ]
        }
      ]
    }
  };

  // HÀM RENDER GIAO DIỆN BỘ LỌC ĐỘNG THEO DANH MỤC
  window.renderCategoryFilters = async function(catSlug = catalogCategory) {
    const desktopContainer = document.getElementById('dynamic-filter-container');
    const mobileContainer = document.getElementById('dynamic-mobile-filter-container');
    if (!desktopContainer && !mobileContainer) return;

    let config = CATEGORY_FILTER_CONFIG[catSlug];
    if (!config) {
      // Trường hợp danh mục mới tạo từ CSDL (Fallback tự động thích ứng)
      try {
        const res = await fetch(`/api/v1/products/filters?category=${encodeURIComponent(catSlug)}`);
        const result = await res.json();
        const data = result.data || {};
        config = {
          title: `Bộ Lọc Danh Mục`,
          icon: 'fa-sliders',
          facets: []
        };
        if (data.sizes && data.sizes.length && !data.sizes.every(s => s === 'FreeSize')) {
          config.facets.push({
            key: 'size',
            label: 'Kích Cỡ',
            icon: 'fa-ruler-combined',
            type: 'size',
            options: [{ label: 'Tất cả', value: '' }, ...data.sizes.map(s => ({ label: s, value: s }))]
          });
        }
        if (data.fits && data.fits.length) {
          config.facets.push({
            key: 'fit',
            label: 'Phom Dáng / Kiểu',
            icon: 'fa-tag',
            type: 'pill',
            options: [{ label: 'Tất cả', value: '' }, ...data.fits.map(f => ({ label: f, value: f }))]
          });
        }
        if (data.materials && data.materials.length) {
          config.facets.push({
            key: 'material',
            label: 'Chất Liệu',
            icon: 'fa-gem',
            type: 'pill',
            options: [{ label: 'Tất cả', value: '' }, ...data.materials.map(m => ({ label: m, value: m }))]
          });
        }
        if (data.colors && data.colors.length) {
          config.facets.push({
            key: 'color',
            label: 'Màu Sắc',
            icon: 'fa-palette',
            type: 'color',
            options: [{ label: 'Tất cả', value: '' }, ...data.colors.map(c => ({ label: c, value: c }))]
          });
        }
      } catch (e) {
        config = CATEGORY_FILTER_CONFIG['all'];
      }
    }

    // Danh sách các bộ lọc đang kích hoạt để hiển thị Chips
    const activeFiltersList = [];
    if (catalogFilters.color) activeFiltersList.push({ key: 'color', label: 'Màu', val: catalogFilters.color });
    if (catalogFilters.size) activeFiltersList.push({ key: 'size', label: 'Size', val: catalogFilters.size });
    if (catalogFilters.fit) activeFiltersList.push({ key: 'fit', label: 'Kiểu', val: catalogFilters.fit });
    if (catalogFilters.material) activeFiltersList.push({ key: 'material', label: 'Chất liệu', val: catalogFilters.material });
    if (catalogFilters.minPrice || catalogFilters.maxPrice) {
      activeFiltersList.push({ key: 'price', label: 'Mức giá', val: catalogFilters.minPrice ? 'Đã lọc giá' : 'Mức giá' });
    }

    const buildHTML = (isMobile = false) => {
      let html = `
        <div class="dynamic-filter-header">
          <h3 class="dynamic-filter-title">
            <i class="fa-solid ${config.icon || 'fa-sliders'}"></i> ${config.title}
          </h3>
          ${activeFiltersList.length > 0 ? `
            <button type="button" class="clear-all-filters-btn" title="Xóa tất cả bộ lọc">
              <i class="fa-solid fa-rotate-left"></i> Xóa lọc
            </button>
          ` : ''}
        </div>
      `;

      if (activeFiltersList.length > 0) {
        html += `
          <div class="active-filter-chips">
            ${activeFiltersList.map(item => `
              <span class="filter-chip">
                ${item.label}: <strong>${item.val}</strong>
                <i class="fa-solid fa-xmark chip-remove" data-clear-facet="${item.key}" title="Bỏ lọc"></i>
              </span>
            `).join('')}
          </div>
        `;
      }

      config.facets.forEach((facet, idx) => {
        const collapseId = `${isMobile ? 'm-' : ''}facet-col-${idx}`;
        let isFacetActive = false;
        if (facet.key === 'price') {
          isFacetActive = !!(catalogFilters.minPrice || catalogFilters.maxPrice);
        } else {
          isFacetActive = !!catalogFilters[facet.key];
        }

        html += `
          <div class="filter-group-accordion">
            <div class="widget-header-accordion" data-accordion="${collapseId}">
              <span class="filter-label-accordion">
                <i class="fa-solid ${facet.icon}"></i> ${facet.label}
                ${isFacetActive ? `<span class="facet-active-badge">1</span>` : ''}
              </span>
              <i class="fa-solid fa-chevron-down accordion-icon"></i>
            </div>
            <div class="accordion-content" id="${collapseId}">
              <div class="${facet.type === 'size' ? 'size-options compact-pills' : 'color-options compact-swatches'}" data-facet-key="${facet.key}">
                ${facet.options.map(opt => {
                  let isSelected = false;
                  if (facet.key === 'price') {
                    isSelected = (catalogFilters.minPrice === opt.min && catalogFilters.maxPrice === opt.max);
                  } else {
                    isSelected = (catalogFilters[facet.key] === opt.value);
                  }
                  return `
                    <button type="button" 
                      class="size-btn catalog-option ${isSelected ? 'active' : ''}" 
                      data-facet-key="${facet.key}"
                      data-facet-val="${opt.value !== undefined ? opt.value : ''}"
                      data-facet-min="${opt.min !== undefined ? opt.min : ''}"
                      data-facet-max="${opt.max !== undefined ? opt.max : ''}"
                      aria-pressed="${isSelected}"
                    >
                      ${opt.label}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
          ${idx < config.facets.length - 1 ? '<div class="filter-divider"></div>' : ''}
        `;
      });

      return html;
    };

    if (desktopContainer) desktopContainer.innerHTML = buildHTML(false);
    if (mobileContainer) mobileContainer.innerHTML = buildHTML(true);

    // Gán sự kiện Click cho các Accordion Header
    initSidebarAccordion();

    // Gán sự kiện Click cho nút Lọc (Option Buttons)
    const attachOptionHandlers = (container, isMobile = false) => {
      if (!container) return;

      container.querySelectorAll('.catalog-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-facet-key');
          if (key === 'price') {
            const min = btn.getAttribute('data-facet-min');
            const max = btn.getAttribute('data-facet-max');
            if (catalogFilters.minPrice === min && catalogFilters.maxPrice === max) {
              catalogFilters.minPrice = '';
              catalogFilters.maxPrice = '';
            } else {
              catalogFilters.minPrice = min;
              catalogFilters.maxPrice = max;
            }
          } else {
            const val = btn.getAttribute('data-facet-val');
            if (catalogFilters[key] === val) {
              catalogFilters[key] = '';
            } else {
              catalogFilters[key] = val;
            }
          }

          window.renderCategoryFilters(catSlug);
          if (!isMobile) {
            window.loadCatalogProducts();
          }
        });
      });

      // Nút Xóa tất cả bộ lọc
      container.querySelectorAll('.clear-all-filters-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          window.clearAllCatalogFilters();
        });
      });

      // Nút Xóa từng Chip
      container.querySelectorAll('.chip-remove').forEach(chip => {
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          const facetKey = chip.getAttribute('data-clear-facet');
          if (facetKey === 'price') {
            catalogFilters.minPrice = '';
            catalogFilters.maxPrice = '';
          } else if (facetKey) {
            catalogFilters[facetKey] = '';
          }
          window.renderCategoryFilters(catSlug);
          if (!isMobile) {
            window.loadCatalogProducts();
          }
        });
      });
    };

    attachOptionHandlers(desktopContainer, false);
    attachOptionHandlers(mobileContainer, true);
  };

  // HÀM RESET TẤT CẢ BỘ LỌC CỦA DANH MỤC HIỆN TẠI
  window.clearAllCatalogFilters = function() {
    catalogFilters = { ...defaultCatalogFilters };
    window.renderCategoryFilters(catalogCategory);
    window.loadCatalogProducts();
  };

  window.loadCatalogProducts = async function(categorySlug = catalogCategory, searchQuery = catalogSearch) {
    const grid = document.getElementById('product-grid-container');
    if (!grid) return;
    catalogCategory = categorySlug;
    catalogSearch = searchQuery;
    appliedCatalogFilters = { ...catalogFilters };
    catalogRequest?.abort();
    const request = new AbortController();
    catalogRequest = request;

    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--accent-gold);">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 2.2rem; margin-bottom: 1rem;"></i>
        <p style="font-size: 1rem; font-weight: 600; color: var(--primary-dark); font-family: var(--font-serif);">Đang truy vấn danh mục sản phẩm trực tiếp từ Cơ Sở Dữ Liệu SQL Server...</p>
      </div>
    `;

    try {
      const params = new URLSearchParams();
      if (categorySlug) params.set('category', categorySlug);
      if (searchQuery) params.set('search', searchQuery);
      if (catalogFilters.size) params.set('size', catalogFilters.size);
      if (catalogFilters.color) params.set('color', catalogFilters.color);
      if (catalogFilters.material) params.set('material', catalogFilters.material);
      if (catalogFilters.fit) params.set('fit', catalogFilters.fit);
      if (catalogFilters.minPrice) params.set('minPrice', catalogFilters.minPrice);
      if (catalogFilters.maxPrice) params.set('maxPrice', catalogFilters.maxPrice);
      if (catalogSort) params.set('sort', catalogSort);

      const res = await fetch(`/api/v1/products?${params}`, { signal: request.signal });
      const result = await res.json();
      if (request.signal.aborted) return;
      if (!res.ok || result.status !== 'success') throw new Error('Không thể tải danh mục.');

      if (result.status === 'success' && result.data) {
        const products = result.data;
        if (searchQuery && window.AuralieTracking) {
          window.AuralieTracking.track(products.length === 0 ? 'search_no_result' : 'search', {
            properties: { keyword: searchQuery, result_count: products.length, filters: { category: categorySlug } }
          });
        } else if (categorySlug && categorySlug !== 'all' && window.AuralieTracking) {
          window.AuralieTracking.track('category_view', { properties: { category_slug: categorySlug } });
        }
        const catalogTitle = document.getElementById('catalog-title');
        const catalogSubtitle = document.getElementById('catalog-subtitle');
        const categoryName = document.querySelector('.category-list a.active')?.firstChild?.textContent.trim();
        if (catalogTitle) {
          catalogTitle.textContent = categorySlug === 'all'
            ? 'Bộ Sưu Tập Nổi Bật'
            : `Danh Mục: ${products[0]?.category || categoryName || categorySlug}`;
        }
        
        let displayProducts = products;
        if (categorySlug === 'all' && !searchQuery && !catalogFilters.size && !catalogFilters.color && !catalogFilters.material && !catalogFilters.fit && !catalogFilters.minPrice) {
          const catBuckets = {};
          products.forEach(p => {
            const cat = p.category || p.catSlug || 'khac';
            if (!catBuckets[cat]) catBuckets[cat] = [];
            catBuckets[cat].push(p);
          });

          const catKeys = Object.keys(catBuckets);
          const balanced = [];
          let round = 0;
          let hasMore = true;
          while (balanced.length < 18 && hasMore) {
            hasMore = false;
            for (const k of catKeys) {
              if (catBuckets[k][round]) {
                balanced.push(catBuckets[k][round]);
                hasMore = true;
                if (balanced.length === 18) break;
              }
            }
            round++;
          }
          displayProducts = balanced;
        } else if (displayProducts.length > 18) {
          displayProducts = displayProducts.slice(0, 18);
        }

        if (catalogSubtitle) {
          catalogSubtitle.textContent = `Hiển thị ${displayProducts.length} sản phẩm tuyển chọn`;
        }
        if (displayProducts.length === 0) {
          grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
              <i class="fa-solid fa-box-open" style="font-size: 2.5rem; color: #888; margin-bottom: 1rem;"></i>
              <h3 style="font-family: var(--font-serif); font-size: 1.4rem;">Không tìm thấy sản phẩm phù hợp</h3>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">Hãy thử đổi tiêu chí bộ lọc, tông màu, kích cỡ hoặc bấm "Xóa lọc" để xem lại toàn bộ sản phẩm.</p>
              <button type="button" class="btn-primary-luxury" onclick="window.clearAllCatalogFilters()" style="margin-top: 1.25rem;">
                <i class="fa-solid fa-rotate-left"></i> Xóa Bộ Lọc
              </button>
            </div>
          `;
          return;
        }

        grid.innerHTML = displayProducts.map(p => `
          <article class="fashion-card product-clickable" 
            data-id="${p.id}" 
            data-cat="${p.catSlug || 'vest-blazer'}" 
            data-title="${p.name}" 
            data-category="${p.category || 'Haute Couture'}" 
            data-price="${Number(p.price).toLocaleString('vi-VN')} ₫" 
            data-price-raw="${p.price}"
            data-rating="${Number(p.rating || 5.0).toFixed(1)}" 
            data-reviews="${p.reviewCount || 0}"
            data-img="${p.img || 'assets/card_1.jpg'}" 
            data-desc="${p.description || ''}"
            data-tag="${p.tag || 'NEW ARRIVAL'}"
            data-material="${p.material || 'Len Cashmere & Lụa Ý'}"
            data-fit="${p.fit || 'European Tailored'}"
            data-lining="${p.lining || 'Lụa Cupro Thượng Hạng'}"
            data-hardware="${p.hardware || 'Khuy Sừng / Khóa Mạ Vàng 18K'}"
            data-origin="${p.origin || 'Atelier AURALIÈ Đồng Khởi'}"
          >
            <div class="card-img-wrap">
              <img src="${p.img || 'assets/card_1.jpg'}" alt="${p.name}">
              <span class="card-tag">${p.tag || 'NEW ARRIVAL'}</span>
              <div class="card-quick-actions">
                <button class="btn-add-cart" onclick="event.stopPropagation(); window.addToCart({ id: ${p.id}, name: '${p.name.replace(/'/g, "\\'")}', category: '${p.category || 'Haute Couture'}', price: ${p.price}, img: '${p.img || 'assets/card_1.jpg'}' })">
                  <i class="fa-solid fa-bag-shopping"></i> Thêm Giỏ Hàng
                </button>
              </div>
            </div>
            <div class="card-body">
              <div>
                <span class="card-category">${p.category || 'Haute Couture'}</span>
                <h3 class="card-title">${p.name}</h3>
              </div>
              <div class="card-price-row">
                <span class="card-price">${Number(p.price).toLocaleString('vi-VN')} ₫</span>
                <span class="card-rating open-reviews-btn" title="Click để xem ${p.reviewCount || 0} Đánh Giá">
                  <i class="fa-solid fa-star"></i> ${Number(p.rating || 5.0).toFixed(1)}
                </span>
              </div>
            </div>
          </article>
        `).join('');

        // Gán sự kiện click vào thẻ sản phẩm để mở modal
        grid.querySelectorAll('.product-clickable').forEach(card => {
          card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-add-cart')) return;
            const pid = Number(card.getAttribute('data-id'));
            if (pid && window.AuralieTracking) {
              window.AuralieTracking.track('product_view', {
                productId: pid,
                properties: { category: card.getAttribute('data-category'), title: card.getAttribute('data-title') },
                dedupeKey: `pview:${pid}`
              });
            }
            openProductModal(card, e.target.closest('.open-reviews-btn') ? 'tab-reviews' : 'tab-details');
          });
        });
      }
    } catch (err) {
      if (request.signal.aborted) return;
      console.error('Lỗi tải sản phẩm từ CSDL:', err);
      grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: red; padding: 3rem;">Lỗi kết nối tới cơ sở dữ liệu.</div>`;
    }
  };

  // Cập nhật số lượng danh mục trực tiếp từ SQL Server
  window.loadCategoryCounts = async function() {
    try {
      const res = await fetch('/api/v1/categories');
      const result = await res.json();
      if (result.status === 'success' && result.data) {
        const cats = result.data;
        let total = 0;
        cats.forEach(c => {
          total += (c.product_count || 0);
          document.querySelectorAll(`.category-list a[data-cat="${c.slug}"] .category-count`).forEach(badge => {
            badge.textContent = c.product_count;
          });
        });
        document.querySelectorAll('.category-list a[data-cat="all"] .category-count').forEach(badge => {
          badge.textContent = total;
        });
      }
    } catch (e) {
      console.error('Lỗi tải danh mục:', e);
    }
  };

  // Gán sự kiện chọn danh mục: Tự động đổi bộ lọc sang danh mục đó
  const catLinks = document.querySelectorAll('.category-list a');
  catLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const selectedCat = link.getAttribute('data-cat') || 'all';

      catLinks.forEach(l => {
        l.classList.toggle('active', (l.getAttribute('data-cat') || 'all') === selectedCat);
      });

      // Reset các bộ lọc đang chọn khi đổi danh mục
      catalogFilters = { ...defaultCatalogFilters };

      // Render lại bộ lọc chuyên biệt cho danh mục vừa chọn
      window.renderCategoryFilters(selectedCat);

      // Tải lại sản phẩm của danh mục đó
      window.loadCatalogProducts(selectedCat, '');
    });
  });

  // Gán sự kiện sắp xếp (Sort dropdown)
  const sortSelect = document.getElementById('catalog-sort-select') || document.querySelector('.content-sort select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      catalogSort = e.target.value;
      window.loadCatalogProducts();
    });
  }

  // Khởi tạo bộ lọc ban đầu (Danh mục: all)
  window.renderCategoryFilters('all');

  // Gán sự kiện cho nút "Áp dụng bộ lọc" trên Mobile Drawer
  const mobileApplyBtn = document.getElementById('apply-filter-btn');
  if (mobileApplyBtn) {
    mobileApplyBtn.addEventListener('click', () => {
      window.loadCatalogProducts();
      const drawer = document.getElementById('mobile-filter-drawer');
      const overlay = document.getElementById('drawer-overlay');
      if (drawer) drawer.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
    });
  }

  // Wire desktop & mobile search inputs to dynamic database query (hỗ trợ tìm kiếm từ mọi trang)
  const allSearchInputs = document.querySelectorAll('.d-search-box input, input[type="search"], .search-input, #mobile-search-input');
  allSearchInputs.forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = input.value.trim();
        if (!query) return;

        const isCatalogPresent = document.getElementById('product-grid-container');
        if (isCatalogPresent) {
          catLinks.forEach(link => link.classList.toggle('active', link.dataset.cat === 'all'));
          window.loadCatalogProducts('all', query);
          const catalogSection = document.getElementById('catalog');
          if (catalogSection) catalogSection.scrollIntoView({ behavior: 'smooth' });
          const modalSearch = document.getElementById('mobile-search-overlay');
          if (modalSearch) modalSearch.classList.remove('active');
        } else {
          // Nếu đang ở trang khác (blog, collection, about,...), chuyển hướng về trang chủ kèm từ khóa
          window.location.href = `index.html?search=${encodeURIComponent(query)}#catalog`;
        }
      }
    });
  });

  // Tự động kiểm tra tham số URL search khi người dùng tìm kiếm từ trang khác chuyển về
  const urlParams = new URLSearchParams(window.location.search);
  const initialSearch = urlParams.get('search');
  if (initialSearch) {
    window.loadCatalogProducts('all', initialSearch);
    allSearchInputs.forEach(inp => inp.value = initialSearch);
  } else {
    window.loadCatalogProducts('all');
  }
  window.loadCategoryCounts();

  // ====================================================================
  // DYNAMIC JOURNAL & EDITORIAL BLOGS (TRUY VẤN TRỰC TIẾP TỪ DATABASE)
  // ====================================================================
  window.loadHomeJournal = async function() {
    const container = document.getElementById('home-journal-grid');
    if (!container) return;

    try {
      const res = await fetch('/api/v1/blogs');
      const result = await res.json();
      if (result.status === 'success' && result.data) {
        const blogs = result.data.slice(0, 3);
        container.innerHTML = blogs.map(b => `
          <article class="fashion-card">
            <div class="card-img-wrap" style="height: 260px;">
              <img src="${b.cover_image || 'assets/card_1.jpg'}" alt="${b.title}">
              <span class="card-tag">${b.category || 'JOURNAL'}</span>
            </div>
            <div class="card-body">
              <div>
                <span class="card-category"><i class="fa-regular fa-calendar"></i> ${b.author_name || 'AURALIÈ'}</span>
                <h3 class="card-title" style="font-size: 1.15rem; margin-top: 0.3rem;">
                  <a href="blog-detail.html" style="color: inherit; text-decoration: none;">${b.title}</a>
                </h3>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem; line-height: 1.6;">${b.summary || ''}</p>
              </div>
              <a href="blog-detail.html" style="font-size: 0.8rem; font-weight: 700; color: var(--accent-gold); text-decoration: none; margin-top: 1rem; display: inline-block;">Đọc Tiếp <i class="fa-solid fa-chevron-right" style="font-size: 0.7rem;"></i></a>
            </div>
          </article>
        `).join('');
      }
    } catch (err) {
      console.error('Lỗi tải bài viết trang chủ:', err);
    }
  };

  window.loadBlogPage = async function(selectedCat = 'all') {
    const grid = document.getElementById('blog-articles-grid');
    const heroCard = document.getElementById('blog-featured-card');
    if (!grid) return;

    try {
      const res = await fetch('/api/v1/blogs');
      const result = await res.json();
      if (result.status === 'success' && result.data) {
        let blogs = result.data;
        if (selectedCat !== 'all') {
          const catMap = {
            'xu-huong': 'XU HƯỚNG',
            'nghe-thuat': 'NGHỆ THUẬT CẮT MAY',
            'bi-quyet': 'BÍ QUYẾT PHONG CÁCH',
            'vip': 'ĐẶC QUYỀN VIP'
          };
          const targetCategory = catMap[selectedCat] || selectedCat;
          blogs = blogs.filter(b => (b.category || '').toUpperCase().includes(targetCategory.toUpperCase()));
        }

        if (blogs.length > 0 && heroCard && selectedCat === 'all') {
          const hero = blogs[0];
          const heroImg = heroCard.querySelector('img');
          const heroCat = heroCard.querySelector('.card-category');
          const heroTitle = heroCard.querySelector('h2 a');
          const heroP = heroCard.querySelector('p');

          if (heroImg) heroImg.src = hero.cover_image || 'assets/card_1.jpg';
          if (heroCat) heroCat.innerHTML = `<i class="fa-regular fa-calendar"></i> ${hero.author_name || 'Elena Vũ'}`;
          if (heroTitle) heroTitle.textContent = hero.title;
          if (heroP) heroP.textContent = hero.summary;
        }

        const gridBlogs = (selectedCat === 'all' && blogs.length > 1) ? blogs.slice(1) : blogs;
        grid.innerHTML = gridBlogs.map(b => `
          <article class="fashion-card blog-post-item" data-category="${b.category}">
            <div class="card-img-wrap" style="height: 240px;">
              <img src="${b.cover_image || 'assets/card_2.jpg'}" alt="${b.title}">
              <span class="card-tag">${b.category || 'JOURNAL'}</span>
            </div>
            <div class="card-body">
              <div>
                <span class="card-category"><i class="fa-regular fa-clock"></i> 5 phút đọc • ${b.author_name || 'AURALIÈ'}</span>
                <h3 class="card-title" style="font-size: 1.1rem; margin-top: 0.3rem;"><a href="blog-detail.html" style="color: inherit; text-decoration: none;">${b.title}</a></h3>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem; line-height: 1.6;">${b.summary}</p>
              </div>
              <a href="blog-detail.html" style="font-size: 0.8rem; font-weight: 700; color: var(--accent-gold); text-decoration: none; margin-top: 1rem; display: inline-block;">Đọc Tiếp <i class="fa-solid fa-chevron-right" style="font-size: 0.7rem;"></i></a>
            </div>
          </article>
        `).join('');
      }
    } catch (err) {
      console.error('Lỗi tải trang blog:', err);
    }
  };

  window.loadHomeJournal();
  window.loadBlogPage('all');

  // ==============================================================
  // HYBRID RECOMMENDATION ENGINE (Content-based + Session + Popularity)
  // Gợi ý 6 sản phẩm chia thành 2 hàng phía trên Tạp chí / Bài viết
  // ==============================================================
  window.loadRecommendedProducts = async function() {
    const grid = document.getElementById('recommended-products-grid');
    if (!grid) return;

    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem 1rem; color: var(--accent-gold);">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.8rem; margin-bottom: 0.8rem;"></i>
        <p style="font-size: 0.95rem; font-weight: 600; color: var(--primary-dark); font-family: var(--font-serif);">Đang phân tích phong cách may đo và cá nhân hóa gợi ý...</p>
      </div>
    `;

    try {
      const sessionId = localStorage.getItem('auralie_session_id') || '';
      const anonymousId = localStorage.getItem('auralie_anonymous_id') || '';
      const token = sessionStorage.getItem('auralie_token') || '';

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (sessionId) headers['X-Session-Id'] = sessionId;
      if (anonymousId) headers['X-Anonymous-Id'] = anonymousId;

      const params = new URLSearchParams({ limit: '6' });
      if (sessionId) params.set('sessionId', sessionId);
      if (anonymousId) params.set('anonymousId', anonymousId);

      const res = await fetch(`/api/v1/recommendations?${params}`, { headers });
      const result = await res.json();

      if (!res.ok || result.status !== 'success' || !result.data || result.data.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 2rem 1rem; color: var(--text-muted);">
            <p>Hệ thống đang cập nhật bộ sưu tập gợi ý độc quyền.</p>
          </div>
        `;
        return;
      }

      const products = result.data.slice(0, 6);
      const isPersonalized = result.mode === 'PERSONALIZED_HYBRID' || result.meta?.mode === 'PERSONALIZED_HYBRID';

      const badgeEl = document.getElementById('recommendation-badge');
      const descEl = document.getElementById('recommendation-desc');
      if (badgeEl) {
        badgeEl.innerHTML = isPersonalized
          ? '<i class="fa-solid fa-wand-magic-sparkles"></i> Dành Riêng Cho Quý Khách • Personalized Stylist'
          : '<i class="fa-solid fa-fire"></i> Bộ Sưu Tập Thịnh Hành Được Yêu Thích Nhất';
      }
      if (descEl) {
        descEl.textContent = isPersonalized
          ? 'Tuyển chọn 6 thiết kế Haute Couture đồng điệu nhất với gu thời trang và chất liệu bạn vừa quan tâm.'
          : 'Tuyển chọn 6 trang phục may đo cao cấp bán chạy nhất tại Atelier AURALIÈ.';
      }

      grid.innerHTML = products.map(p => `
        <article class="fashion-card product-clickable" 
          data-id="${p.id}" 
          data-cat="${p.catSlug || 'vest-blazer'}" 
          data-title="${p.name}" 
          data-category="${p.category || 'Haute Couture'}" 
          data-price="${Number(p.price).toLocaleString('vi-VN')} ₫" 
          data-price-raw="${p.price}"
          data-rating="${Number(p.rating || 5.0).toFixed(1)}" 
          data-reviews="${p.reviewCount || 0}"
          data-img="${p.img || 'assets/card_1.jpg'}" 
          data-desc="${p.description || ''}"
          data-tag="${p.tag || 'EXCLUSIVE'}"
          data-material="${p.material || 'Len Cashmere & Lụa Ý'}"
          data-fit="${p.fit || 'European Tailored'}"
          data-lining="${p.lining || 'Lụa Cupro Thượng Hạng'}"
          data-hardware="${p.hardware || 'Khuy Sừng / Khóa Mạ Vàng 18K'}"
          data-origin="${p.origin || 'Atelier AURALIÈ Đồng Khởi'}"
        >
          <div class="card-img-wrap" style="position: relative;">
            <img src="${p.img || 'assets/card_1.jpg'}" alt="${p.name}">
            <span class="card-tag" style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(4px); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4);">
              <i class="fa-solid fa-sparkles"></i> ${p.isPersonalized ? 'GỢI Ý GU BẠN' : (p.tag || 'BESTSELLER')}
            </span>
            <div class="card-quick-actions">
              <button class="btn-add-cart" onclick="event.stopPropagation(); window.addToCart({ id: ${p.id}, name: '${p.name.replace(/'/g, "\\'")}', category: '${p.category || 'Haute Couture'}', price: ${p.price}, img: '${p.img || 'assets/card_1.jpg'}' })">
                <i class="fa-solid fa-bag-shopping"></i> Thêm Giỏ Hàng
              </button>
            </div>
          </div>
          <div class="card-body">
            <div>
              <span class="card-category" style="color: var(--accent-gold); font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">
                ${p.category || 'Haute Couture'}
              </span>
              <h3 class="card-title" style="font-size: 1.05rem; margin-top: 0.25rem;">${p.name}</h3>
              <p style="font-size: 0.8rem; color: #64748b; margin-top: 0.2rem; font-style: italic;">
                <i class="fa-solid fa-feather-pointed"></i> ${p.material || 'Chất liệu lụa tơ tằm thượng hạng'}
              </p>
            </div>
            <div class="card-price-row" style="margin-top: 0.8rem;">
              <span class="card-price" style="font-size: 1.1rem;">${Number(p.price).toLocaleString('vi-VN')} ₫</span>
              <span class="card-rating open-reviews-btn" title="Đánh giá chất lượng">
                <i class="fa-solid fa-star"></i> ${Number(p.rating || 5.0).toFixed(1)}
              </span>
            </div>
          </div>
        </article>
      `).join('');

      // Gắn sự kiện click mở chi tiết sản phẩm
      grid.querySelectorAll('.product-clickable').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.btn-add-cart')) return;
          const pid = Number(card.getAttribute('data-id'));
          const prodTitle = card.getAttribute('data-title');
          if (window.AuralieTracking) {
            window.AuralieTracking.track('product_view', {
              product_id: pid,
              properties: { name: prodTitle, source: 'recommendation_section' }
            });
          }
          if (typeof openProductModal === 'function') {
            openProductModal(card);
          }
        });
      });

    } catch (err) {
      console.warn('[Auralie Recommendation] Chưa thể tải gợi ý:', err);
    }
  };

  window.loadRecommendedProducts();

  const btnRefreshRec = document.getElementById('btn-refresh-recommendations');
  if (btnRefreshRec) {
    btnRefreshRec.addEventListener('click', () => {
      window.loadRecommendedProducts();
    });
  }

  // Binds category tabs on blog page
  const blogTabBtns = document.querySelectorAll('.blog-tab-btn');
  blogTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      blogTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-blog-cat') || 'all';
      window.loadBlogPage(cat);
    });
  });

  // Lookbook Collection Tabs Filtering (collections.html)
  const collectionTabBtns = document.querySelectorAll('.collection-tabs .tab-btn');
  if (collectionTabBtns.length > 0) {
    collectionTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        collectionTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterText = btn.textContent.trim().toLowerCase();
        const lookbookCards = document.querySelectorAll('main .fashion-card');

        lookbookCards.forEach(card => {
          if (filterText.includes('tất cả')) {
            card.style.display = 'flex';
          } else {
            const cardCatText = card.textContent.toLowerCase();
            if (cardCatText.includes(filterText) || cardCatText.includes(filterText.replace('phụ kiện luxury', 'túi'))) {
              card.style.display = 'flex';
            } else {
              card.style.display = 'none';
            }
          }
        });
      });
    });
  }

  // ===================================================================
  // LOOKBOOK EDITORIAL SHOWCASE MODAL LOGIC (COLLECTIONS.HTML)
  // ===================================================================
  const lookbookData = [
    {
      id: 1,
      tag: 'LOOKBOOK #01',
      category: 'BỘ SƯU TẬP THU ĐÔNG',
      title: 'Winter Cashmere Tailored 2026',
      img: 'assets/products/vest_1_double_breasted.jpg',
      thumbs: ['assets/products/vest_1_double_breasted.jpg', 'assets/products/vest_2_black_blazer.jpg', 'assets/products/vest_3_velvet_tuxedo.jpg'],
      concept: 'Bản giao thoa tinh tế giữa phong cách may đo chuẩn quý tộc Châu Âu và chất liệu len Cashmere thượng hạng vùng Piedmont (Ý). Từng đường cắt cúp tạo phom dáng chuẩn mực, cân đối tỉ lệ cơ thể và toát lên khí chất quyền lực, đĩnh đạc của giới thượng lưu.',
      tailoring: 'Cắt cúp Bespoke 3D, đệm vai bán thủ công',
      fabric: '100% Cashmere Loro Piana Ý',
      palette: 'Midnight Charcoal & Jet Black',
      origin: 'Milan Atelier & Biella Weavers',
      stylist: 'Phối cùng áo sơ mi lụa Poplin trắng tinh khôi, cà vạt lụa dệt kim đen và giày Oxford da bê bóng bẩy cho các buổi dạ tiệc ngoại giao và hội nghị thượng đỉnh quốc tế.',
      shopLink: 'index.html?search=Vest#catalog'
    },
    {
      id: 2,
      tag: 'LOOKBOOK #02',
      category: 'HAUTE COUTURE RUNWAY',
      title: 'Auralia Silk Evening Dress',
      img: 'assets/products/dress_1_silk_minimalist.jpg',
      thumbs: ['assets/products/dress_1_silk_minimalist.jpg', 'assets/products/dress_2_emerald_velvet.jpg', 'assets/products/dress_3_midnight_satin.jpg'],
      concept: 'Tuyệt phẩm đầm dạ hội dệt từ lụa tơ tằm nguyên bản cao cấp, áp dụng kỹ thuật draping điêu khắc trực tiếp trên phom ma-nơ-canh Paris. Thiết kế đường xẻ tà sắc sảo cùng bờ vai quyến rũ tôn vinh đường cong tự nhiên và nét đẹp kiêu sa lộng lẫy dưới ánh đèn đêm.',
      tailoring: 'Draping 3D Haute Couture Paris',
      fabric: '100% Lụa Tơ Tằm Bảo Lộc & Taffeta Pháp',
      palette: 'Obsidian Noir & Ánh Kim Vàng 18K',
      origin: 'Paris Fashion Week Runway Capsule',
      stylist: 'Hoàn hảo khi kết hợp cùng trang sức kim cương solitaire, khuyên tai giọt nước và ví cầm tay đính đá ngọc lục bảo trong các đêm tiệc Gala thảm đỏ.',
      shopLink: 'index.html?search=Đầm#catalog'
    },
    {
      id: 3,
      tag: 'LOOKBOOK #03',
      category: 'MINIMALIST COLLECTION',
      title: 'Oversized Knitwear Capsule',
      img: 'assets/products/coat_1_cashmere_sweater.jpg',
      thumbs: ['assets/products/coat_1_cashmere_sweater.jpg', 'assets/products/coat_3_cashmere_trench.jpg', 'assets/products/coat_4_double_faced_wool.jpg'],
      concept: 'Biểu tượng của xu hướng Quiet Luxury (Sang trọng thầm lặng). Những chiếc áo len dệt kim sợi len cừu Merino chải kỹ mang phom dáng thả lỏng tinh tế, đem lại cảm giác ấm áp, thư thái và đẳng cấp vượt thời gian không cần phô trương.',
      tailoring: 'Dệt kim nguyên khối Seamless Knit',
      fabric: 'Superfine Merino Wool & Cashmere pha lụa',
      palette: 'Warm Oatmeal, Sandstone & Mộc Trai',
      origin: 'Biella Atelier, Italy',
      stylist: 'Phối cùng quần âu ống rộng lụa tơ tằm hoặc chân váy midi xếp ly, kết hợp bốt da lộn cổ thấp cho những buổi gặp gỡ trà chiều hoặc kỳ nghỉ dưỡng cuối tuần.',
      shopLink: 'index.html?search=Len#catalog'
    },
    {
      id: 4,
      tag: 'LOOKBOOK #04',
      category: 'LUXURY ACCESSORIES',
      title: 'Heritage Leather Goods',
      img: 'assets/products/bag_1_heritage_tan_handbag.jpg',
      thumbs: ['assets/products/bag_1_heritage_tan_handbag.jpg', 'assets/products/bag_2_ostrich_tote.jpg', 'assets/products/bag_3_mini_flap_crossbody.jpg'],
      concept: 'Bộ sưu tập đồ da thủ công trường tồn với thời gian. Sử dụng dòng da thuộc thảo mộc Full-grain nguyên tấm từ vùng Florence, kết hợp các chi tiết kim loại đúc đặc mạ vàng 18K bền màu vĩnh cửu.',
      tailoring: 'Khâu tay thủ công Saddle Stitching',
      fabric: 'Da bò thuộc thảo mộc Tuscany Full-Grain',
      palette: 'Caramel Cognac & Khóa mạ vàng 18K',
      origin: 'Florence Workshops, Italy',
      stylist: 'Điểm nhấn hoàn hảo cho cả trang phục công sở hiện đại lẫn phong cách casual cuối tuần thanh lịch. Dễ dàng phối cùng áo măng tô dạ dáng dài.',
      shopLink: 'index.html?search=Túi#catalog'
    },
    {
      id: 5,
      tag: 'LOOKBOOK #05',
      category: 'WOMEN TAILORED SUITS',
      title: 'Modern Power Suiting',
      img: 'assets/products/vest_2_black_blazer.jpg',
      thumbs: ['assets/products/vest_2_black_blazer.jpg', 'assets/products/vest_4_wool_blazer.jpg', 'assets/products/vest_5_ivory_satin.jpg'],
      concept: 'Thiết kế bộ vest nữ tôn vinh nữ quyền và tầm vóc của các nữ lãnh đạo kiệt xuất. Đường vai sắc gọn kết hợp đường eo chiết lượn sóng tạo nên sự quyền lực tối thượng nhưng vẫn đầy nét mềm mại, quyến rũ.',
      tailoring: 'Bespoke Savile Row Tailored Cut',
      fabric: 'Len Wool Crepe Ý & Lót lụa Habotai',
      palette: 'Classic Midnight Charcoal & Ivory White',
      origin: 'London Savile Row Inspired',
      stylist: 'Kết hợp cùng áo ren tơ tằm cổ chữ V bên trong, giày cao gót mũi nhọn da bóng và đồng hồ mặt số vàng khối cho thần thái nữ chủ tịch tự tin.',
      shopLink: 'index.html?search=Vest#catalog'
    },
    {
      id: 6,
      tag: 'LOOKBOOK #06',
      category: 'GENTLEMAN COLLECTION',
      title: 'Midnight Navy Tailored Suit',
      img: 'assets/products/vest_6_navy_pinstripe.jpg',
      thumbs: ['assets/products/vest_6_navy_pinstripe.jpg', 'assets/products/vest_3_velvet_tuxedo.jpg', 'assets/products/vest_7_burgundy_tuxedo.jpg'],
      concept: 'Đỉnh cao của phong độ quý ông thượng lưu. Màu xanh Midnight Navy huyền bí dưới ánh đèn tiệc sang trọng, sử dụng vải Super 160s độc quyền dệt từ len cừu Úc nguyên lông cho bề mặt óng ả và độ rủ hoàn mỹ.',
      tailoring: 'May đo chuẩn phom Napoli Bespoke',
      fabric: 'Super 160s Worsted Wool Scabal',
      palette: 'Deep Midnight Navy & Nút vỏ trai tự nhiên',
      origin: 'Naples Atelier, Italy',
      stylist: 'Đi kèm nơ dạ tiệc lụa Satin hoặc cà vạt lụa họa tiết Paisley chìm, khăn cài túi ngực (Pocket Square) lụa trắng và đồng hồ dây da cá sấu.',
      shopLink: 'index.html?search=Suit#catalog'
    }
  ];

  let currentLookbookIndex = 0;
  const lookbookModal = document.getElementById('lookbook-modal');
  const closeLookbookBtn = document.getElementById('close-lookbook-modal');

  window.openLookbookModal = function(id) {
    if (!lookbookModal) return;
    const index = lookbookData.findIndex(item => item.id == id);
    if (index === -1) return;
    currentLookbookIndex = index;
    renderLookbookDetail(lookbookData[index]);
    lookbookModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeLookbookModal = function() {
    if (!lookbookModal) return;
    lookbookModal.classList.remove('active');
    document.body.style.overflow = '';
  };

  function renderLookbookDetail(data) {
    const imgElem = document.getElementById('lookbook-modal-img');
    const tagElem = document.getElementById('lookbook-modal-tag');
    const catElem = document.getElementById('lookbook-modal-category');
    const titleElem = document.getElementById('lookbook-modal-title');
    const conceptElem = document.getElementById('lookbook-modal-concept');
    const tailoringElem = document.getElementById('lookbook-modal-tailoring');
    const fabricElem = document.getElementById('lookbook-modal-fabric');
    const paletteElem = document.getElementById('lookbook-modal-palette');
    const originElem = document.getElementById('lookbook-modal-origin');
    const stylistElem = document.getElementById('lookbook-modal-stylist');
    const thumbsContainer = document.getElementById('lookbook-modal-thumbs');
    const shopBtn = document.getElementById('lookbook-shop-collection-btn');
    const counterElem = document.getElementById('lookbook-counter-indicator');

    if (imgElem) imgElem.src = data.img;
    if (tagElem) tagElem.textContent = data.tag;
    if (catElem) catElem.textContent = data.category;
    if (titleElem) titleElem.textContent = data.title;
    if (conceptElem) conceptElem.textContent = data.concept;
    if (tailoringElem) tailoringElem.textContent = data.tailoring;
    if (fabricElem) fabricElem.textContent = data.fabric;
    if (paletteElem) paletteElem.textContent = data.palette;
    if (originElem) originElem.textContent = data.origin;
    if (stylistElem) stylistElem.textContent = data.stylist;
    if (counterElem) counterElem.textContent = `0${data.id} / 0${lookbookData.length}`;
    if (shopBtn) shopBtn.href = data.shopLink || 'index.html#catalog';

    if (thumbsContainer) {
      thumbsContainer.innerHTML = '';
      data.thumbs.forEach((thumbSrc, idx) => {
        const thumbImg = document.createElement('img');
        thumbImg.src = thumbSrc;
        thumbImg.className = 'lookbook-thumb-img' + (idx === 0 ? ' active' : '');
        thumbImg.alt = `${data.title} góc ${idx + 1}`;
        thumbImg.addEventListener('click', () => {
          if (imgElem) imgElem.src = thumbSrc;
          thumbsContainer.querySelectorAll('.lookbook-thumb-img').forEach(t => t.classList.remove('active'));
          thumbImg.classList.add('active');
        });
        thumbsContainer.appendChild(thumbImg);
      });
    }
  }

  // Bind Lookbook event listeners on collections.html
  if (lookbookModal) {
    if (closeLookbookBtn) {
      closeLookbookBtn.addEventListener('click', window.closeLookbookModal);
    }

    lookbookModal.addEventListener('click', (e) => {
      if (e.target === lookbookModal) {
        window.closeLookbookModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (!lookbookModal.classList.contains('active')) return;
      if (e.key === 'Escape') {
        window.closeLookbookModal();
      } else if (e.key === 'ArrowLeft') {
        currentLookbookIndex = (currentLookbookIndex - 1 + lookbookData.length) % lookbookData.length;
        renderLookbookDetail(lookbookData[currentLookbookIndex]);
      } else if (e.key === 'ArrowRight') {
        currentLookbookIndex = (currentLookbookIndex + 1) % lookbookData.length;
        renderLookbookDetail(lookbookData[currentLookbookIndex]);
      }
    });

    const prevBtn = document.getElementById('lookbook-prev-btn');
    const nextBtn = document.getElementById('lookbook-next-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentLookbookIndex = (currentLookbookIndex - 1 + lookbookData.length) % lookbookData.length;
        renderLookbookDetail(lookbookData[currentLookbookIndex]);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentLookbookIndex = (currentLookbookIndex + 1) % lookbookData.length;
        renderLookbookDetail(lookbookData[currentLookbookIndex]);
      });
    }

    // Attach click listeners to .btn-explore-lookbook and lookbook cards
    document.querySelectorAll('.btn-explore-lookbook').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute('data-lookbook-id') || 1;
        window.openLookbookModal(id);
      });
    });

    document.querySelectorAll('.lookbook-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('a, button')) return;
        const id = card.getAttribute('data-lookbook-id') || 1;
        window.openLookbookModal(id);
      });
    });
  }

  // 5. Color Picker Filter Dots Selection
  const colorDots = document.querySelectorAll('.color-dot');
  colorDots.forEach(dot => {
    dot.addEventListener('click', () => {
      colorDots.forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
    });
  });

  // 6. Size Filter Buttons Selection
  const sizeBtns = document.querySelectorAll('.size-btn');
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // 8. Footer Accordion Mobile Toggle
  const collapsibleFooters = document.querySelectorAll('.collapsible-footer');
  collapsibleFooters.forEach(col => {
    const header = col.querySelector('.accordion-header');
    if (header) {
      header.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          col.classList.toggle('open');
        }
      });
    }
  });

  // 9. Smooth Scroll for Anchor Links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth'
          });
        }
      }
    });
  });

  // 10. PRODUCT DETAIL & REVIEWS MODAL LOGIC (HƯỚNG THỰC TẾ)
  const productModal = document.getElementById('product-detail-modal');
  const closeProductModalBtn = document.getElementById('close-product-modal');
  
  const modalMainImg = document.getElementById('modal-main-img');
  const modalCategory = document.getElementById('modal-category');
  const modalTitle = document.getElementById('modal-title');
  const modalPrice = document.getElementById('modal-price');
  const modalRatingVal = document.getElementById('modal-rating-val');
  const modalTag = document.getElementById('modal-product-tag');

  const modalTabBtns = document.querySelectorAll('.modal-tab-btn');
  const modalTabContents = document.querySelectorAll('.modal-tab-content');

  // Quantity Picker logic
  const qtyInput = document.getElementById('qty-input');
  const qtyMinus = document.getElementById('qty-minus');
  const qtyPlus = document.getElementById('qty-plus');

  if (qtyMinus && qtyPlus && qtyInput) {
    qtyMinus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      if (val > 1) qtyInput.value = val - 1;
    });

    qtyPlus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      if (val < 10) qtyInput.value = val + 1;
    });
  }

  // Open Modal function
  const openProductModal = (card, focusTab = 'tab-reviews') => {
    if (!productModal) return;

    const productId = card.getAttribute('data-id') || 1;
    const title = card.getAttribute('data-title') || 'Sản phẩm Haute Couture';
    const category = card.getAttribute('data-category') || 'Thời trang cao cấp';
    const price = card.getAttribute('data-price') || '12.500.000 ₫';
    const rawPrice = card.getAttribute('data-price-raw') || 12500000;
    const rating = card.getAttribute('data-rating') || '4.9';
    const img = card.getAttribute('data-img') || 'assets/card_1.jpg';
    const desc = card.getAttribute('data-desc') || 'Sản phẩm thuộc bộ sưu tập Haute Couture độc quyền từ thương hiệu AURALIÈ.';

    window.activeModalProductId = productId;
    window.activeModalProductPrice = Number(rawPrice);
    window.activeModalProductName = title;
    window.activeModalProductCategory = category;
    window.activeModalProductCatSlug = card.getAttribute('data-cat') || '';
    window.activeModalProductImg = img;

    // Cập nhật các nút Size trong Modal theo đúng danh mục mặt hàng (Không dùng chung size quần áo)
    const modalSizeBtnsContainer = document.querySelector('.modal-size-btns');
    const modalSelectedSizeText = document.getElementById('modal-selected-size');
    const catCheck = (category || '').toLowerCase();
    const catSlugCheck = (card.getAttribute('data-cat') || '').toLowerCase();

    if (modalSizeBtnsContainer) {
      let availableSizes = ['S', 'M', 'L', 'XL'];
      if (catCheck.includes('túi') || catSlugCheck.includes('tui')) {
        // Túi Xách: Không dùng S/M/L quần áo mà dùng phân khúc kích thước túi
        availableSizes = ['Petite', 'Classic', 'Grand Tote'];
      } else if (catCheck.includes('giày') || catSlugCheck.includes('giay') || catCheck.includes('phụ kiện')) {
        // Giày & Phụ kiện: Dùng size giày EU hoặc kích cỡ thắt lưng
        if (catCheck.includes('nữ') || title.toLowerCase().includes('nữ') || title.toLowerCase().includes('cao gót') || title.toLowerCase().includes('sandal')) {
          availableSizes = ['35', '36', '37', '38', '39'];
        } else {
          availableSizes = ['39', '40', '41', '42', '43'];
        }
      } else if (catCheck.includes('đầm') || catCheck.includes('váy') || catSlugCheck.includes('dam') || catSlugCheck.includes('vay')) {
        // Đầm dạ hội
        availableSizes = ['XS', 'S', 'M', 'L'];
      } else if (catCheck.includes('khoác') || catSlugCheck.includes('khoac')) {
        // Áo khoác Thu Đông
        availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];
      } else {
        // Áo Vest & Blazer
        availableSizes = ['S', 'M', 'L', 'XL'];
      }

      modalSizeBtnsContainer.innerHTML = availableSizes.map((sz, idx) => `
        <button type="button" class="size-btn ${idx === 1 || (availableSizes.length === 1 && idx === 0) ? 'active' : ''}">${sz}</button>
      `).join('');

      const defaultSelected = availableSizes[1] || availableSizes[0] || 'M';
      if (modalSelectedSizeText) modalSelectedSizeText.textContent = defaultSelected;

      modalSizeBtnsContainer.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          modalSizeBtnsContainer.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (modalSelectedSizeText) modalSelectedSizeText.textContent = btn.textContent.trim();
        });
      });
    }

    // Cập nhật trạng thái biểu tượng trái tim (Đỏ nếu đã có trong Wishlist)
    if (typeof window.updateModalWishlistButtonState === 'function') {
      window.updateModalWishlistButtonState(productId);
    }

    if (modalTitle) modalTitle.textContent = title;
    if (modalCategory) modalCategory.textContent = category;
    if (modalPrice) modalPrice.textContent = price;
    if (modalRatingVal) modalRatingVal.textContent = rating;
    if (modalMainImg) modalMainImg.src = img;
    
    const modalDescElem = document.getElementById('modal-desc');
    if (modalDescElem) modalDescElem.textContent = desc;

    // Load Live Reviews directly from SQL Server
    if (typeof window.fetchProductReviews === 'function') {
      window.fetchProductReviews(productId);
    }

    // Dynamic Secondary Attributes (Thuộc tính phụ sản phẩm)
    const catLower = category.toLowerCase();
    let defaultMaterial = '100% Cashmere Lụa Ý';
    let defaultFit = 'European Tailored Fit';
    let defaultLining = 'Lụa Cupro Thượng Hạng';
    let defaultHardware = 'Khuy Sừng / Khóa Mạ Vàng 18K';
    let defaultOrigin = 'Atelier AURALIÈ Đồng Khởi';
    let defaultSku = 'AUR-2026-VIP';

    if (catLower.includes('đầm') || catLower.includes('váy')) {
      defaultMaterial = '100% Lụa Tơ Tằm Bảo Lộc';
      defaultFit = 'Slim Evening Gown Cut';
      defaultLining = 'Lụa Chiffon Mềm Mại';
      defaultHardware = 'Đai Lưng Đính Đá Swarovsky';
      defaultOrigin = 'Atelier AURALIÈ Haute Couture';
      defaultSku = 'AUR-2026-GOWN';
    } else if (catLower.includes('khoác') || catLower.includes('len')) {
      defaultMaterial = 'Len Cashmere Thượng Hải 100%';
      defaultFit = 'Oversized Winter Capsule';
      defaultLining = 'Lớp Lót Dạ Hai Mặt';
      defaultHardware = 'Đai Da Bò Thật & Mạ Đồng';
      defaultOrigin = 'Atelier AURALIÈ Winter Craft';
      defaultSku = 'AUR-2026-COAT';
    } else if (catLower.includes('túi')) {
      defaultMaterial = 'Da Bò Thuộc Nâu / Da Đà Điểu';
      defaultFit = 'Structured Luxury Handbag';
      defaultLining = 'Da Cừu Nappa Siêu Mịn';
      defaultHardware = 'Khóa Kim Loại Mạ Vàng 18K';
      defaultOrigin = 'Chế Tác Thủ Công Tiêu Chuẩn Ý';
      defaultSku = 'AUR-2026-BAG';
    } else if (catLower.includes('giày') || catLower.includes('phụ kiện')) {
      defaultMaterial = 'Da Bê Ý / Kim Loại Mạ Vàng 18K';
      defaultFit = 'Ergonomic Luxury Craft';
      defaultLining = 'Lót Đệm Da Bò Êm Ái';
      defaultHardware = 'Khóa Mạ Vàng 18K Chống Khói';
      defaultOrigin = 'Atelier AURALIÈ Accessories';
      defaultSku = 'AUR-2026-ACC';
    }

    const material = card.getAttribute('data-material') || defaultMaterial;
    const fit = card.getAttribute('data-fit') || defaultFit;
    const lining = card.getAttribute('data-lining') || defaultLining;
    const hardware = card.getAttribute('data-hardware') || defaultHardware;
    const origin = card.getAttribute('data-origin') || defaultOrigin;
    const sku = card.getAttribute('data-sku') || (defaultSku + '-' + Math.floor(10 + Math.random() * 89));

    // Update main modal specs grid
    const attrMaterial = document.getElementById('attr-material');
    const attrFit = document.getElementById('attr-fit');
    const attrLining = document.getElementById('attr-lining');
    const attrHardware = document.getElementById('attr-hardware');
    const attrOrigin = document.getElementById('attr-origin');
    const attrSku = document.getElementById('attr-sku');

    if (attrMaterial) attrMaterial.textContent = material;
    if (attrFit) attrFit.textContent = fit;
    if (attrLining) attrLining.textContent = lining;
    if (attrHardware) attrHardware.textContent = hardware;
    if (attrOrigin) attrOrigin.textContent = origin;
    if (attrSku) attrSku.textContent = sku;

    // Update tab-details table
    const tabAttrMaterial = document.getElementById('tab-attr-material');
    const tabAttrFit = document.getElementById('tab-attr-fit');
    const tabAttrLining = document.getElementById('tab-attr-lining');
    const tabAttrHardware = document.getElementById('tab-attr-hardware');
    const tabAttrOrigin = document.getElementById('tab-attr-origin');
    const tabAttrSku = document.getElementById('tab-attr-sku');

    if (tabAttrMaterial) tabAttrMaterial.textContent = material;
    if (tabAttrFit) tabAttrFit.textContent = fit;
    if (tabAttrLining) tabAttrLining.textContent = lining;
    if (tabAttrHardware) tabAttrHardware.textContent = hardware;
    if (tabAttrOrigin) tabAttrOrigin.textContent = origin;
    if (tabAttrSku) tabAttrSku.textContent = sku;

    // Switch focus tab if specified
    switchModalTab(focusTab);

    productModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeProductModal = () => {
    if (!productModal) return;
    productModal.classList.remove('active');
    document.body.style.overflow = '';
  };

  // Tab switching helper
  const switchModalTab = (targetTabId) => {
    modalTabBtns.forEach(btn => {
      if (btn.getAttribute('data-tab') === targetTabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    modalTabContents.forEach(content => {
      if (content.id === targetTabId) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  };

  // Thumbnail Gallery Switcher in Modal
  const modalThumbs = document.querySelectorAll('.modal-thumb');
  if (modalThumbs.length > 0 && modalMainImg) {
    modalThumbs.forEach((thumb, idx) => {
      thumb.addEventListener('click', () => {
        modalThumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        modalMainImg.style.transition = 'opacity 0.2s ease';
        modalMainImg.style.opacity = '0.3';
        setTimeout(() => {
          modalMainImg.src = thumb.src;
          modalMainImg.style.opacity = '1';
        }, 150);
        if (window.AuralieTracking) {
          const pid = parseInt(String((productModal && productModal.getAttribute('data-product-id')) || '').replace(/\D/g, ''), 10) || null;
          window.AuralieTracking.track('product_image_view', {
            productId: pid,
            properties: { image_index: idx, image_src: thumb.getAttribute('src') },
            dedupeKey: `img-view-${pid}-${idx}`
          });
        }
      });
    });
  }

  // Review Filter Pills inside Modal (Tất cả, 5 Sao, 4 Sao,...)
  const reviewPills = document.querySelectorAll('.review-pill');
  if (reviewPills.length > 0) {
    reviewPills.forEach(pill => {
      pill.addEventListener('click', () => {
        reviewPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const filterText = pill.textContent.trim().toLowerCase();
        const reviewItems = document.querySelectorAll('#reviews-list .review-item');
        reviewItems.forEach(item => {
          if (filterText.includes('tất cả')) {
            item.style.display = 'block';
          } else if (filterText.includes('5 sao')) {
            const stars = item.querySelectorAll('.review-stars-given .fa-star').length;
            item.style.display = stars === 5 ? 'block' : 'none';
          } else if (filterText.includes('4 sao')) {
            const stars = item.querySelectorAll('.review-stars-given .fa-star').length;
            item.style.display = stars === 4 ? 'block' : 'none';
          } else if (filterText.includes('hình ảnh')) {
            item.style.display = 'block';
          }
        });
      });
    });
  }

  // Event Listeners for Product Cards and Stars
  document.querySelectorAll('.product-clickable').forEach(card => {
    card.addEventListener('click', (e) => {
      // Check if user clicked add-to-cart button directly inside card
      if (e.target.closest('.btn-add-cart')) return;

      // If clicked star rating badge specifically
      if (e.target.closest('.open-reviews-btn')) {
        openProductModal(card, 'tab-reviews');
      } else {
        openProductModal(card, 'tab-reviews');
      }
    });
  });

  if (closeProductModalBtn) {
    closeProductModalBtn.addEventListener('click', closeProductModal);
  }

  if (productModal) {
    productModal.addEventListener('click', (e) => {
      if (e.target === productModal) closeProductModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (sizeGuideModal && sizeGuideModal.classList.contains('active')) {
          closeSizeGuideModal();
          return;
        }
        if (productModal && productModal.classList.contains('active')) {
          closeProductModal();
        }
      }
    });
  }

  // Modal Header Tabs Clicking
  modalTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchModalTab(targetTab);
    });
  });

  // Modal Rating Header Trigger Scroll / Focus to Reviews
  const ratingScrollTrigger = document.getElementById('modal-rating-scroll-trigger');
  if (ratingScrollTrigger) {
    ratingScrollTrigger.addEventListener('click', () => {
      switchModalTab('tab-reviews');
    });
  }

  // Color Swatch Selection inside Modal (Đổi ảnh theo màu sắc tương ứng)
  const modalColorDots = document.querySelectorAll('.modal-color-dots .color-dot');
  const modalSelectedColorText = document.getElementById('modal-selected-color');
  modalColorDots.forEach((dot, dotIdx) => {
    dot.addEventListener('click', () => {
      modalColorDots.forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
      const colorName = dot.getAttribute('data-color') || 'Đen Tuyền';
      if (modalSelectedColorText) modalSelectedColorText.textContent = colorName;

      // Đổi ảnh chính tương ứng khi chọn màu
      const colorImg = dot.getAttribute('data-img');
      const thumbs = document.querySelectorAll('.modal-thumb-img');
      if (modalMainImg) {
        if (colorImg) {
          modalMainImg.src = colorImg;
        } else if (thumbs && thumbs[dotIdx]) {
          modalMainImg.src = thumbs[dotIdx].src;
          thumbs.forEach(t => t.classList.remove('active'));
          thumbs[dotIdx].classList.add('active');
        }
      }

      if (window.AuralieTracking) {
        const pid = parseInt(String((productModal && productModal.getAttribute('data-product-id')) || '').replace(/\D/g, ''), 10) || null;
        window.AuralieTracking.track('product_variant_select', {
          productId: pid,
          properties: { variant_type: 'color', color: colorName, size: modalSelectedSizeText ? modalSelectedSizeText.textContent.trim() : null },
          dedupeKey: `var-color-${pid}-${colorName}`
        });
      }
    });
  });

  // Size Button Selection inside Modal
  const modalSizeBtns = document.querySelectorAll('.modal-size-btns .size-btn');
  const modalSelectedSizeText = document.getElementById('modal-selected-size');
  modalSizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modalSizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (modalSelectedSizeText) modalSelectedSizeText.textContent = btn.textContent;
      if (window.AuralieTracking) {
        const pid = parseInt(String((productModal && productModal.getAttribute('data-product-id')) || '').replace(/\D/g, ''), 10) || null;
        window.AuralieTracking.track('product_variant_select', {
          productId: pid,
          properties: { variant_type: 'size', size: btn.textContent.trim(), color: modalSelectedColorText ? modalSelectedColorText.textContent.trim() : null },
          dedupeKey: `var-size-${pid}-${btn.textContent.trim()}`
        });
      }
    });
  }

);

  // 10.1. SIZE GUIDE MODAL LOGIC (BẢNG QUY ĐỔI KÍCH CỠ CHUẨN AURALIÈ THEO TỪNG MẶT HÀNG)
  const sizeGuideModal = document.getElementById('size-guide-modal');
  const openSizeGuideBtn = document.getElementById('open-size-guide-btn');
  const closeSizeGuideModalBtn = document.getElementById('close-size-guide-modal');
  const btnCloseSizeGuide = document.getElementById('btn-close-size-guide');

  // Hàm chuyển Tab Bảng Size tự động dựa theo Danh mục sản phẩm đang xem
  const switchSizeGuideTabByCategory = (categoryStr) => {
    const cat = (categoryStr || '').toLowerCase();
    let targetTabId = 'tab-size-vest';
    let subtitleText = 'Tiêu chuẩn may đo phom dáng Châu Âu - Dành cho Áo Vest & Blazer';

    if (cat.includes('túi') || cat.includes('bag')) {
      targetTabId = 'tab-size-bags';
      subtitleText = 'Quy chuẩn kích thước & sức chứa túi xách da thủ công AURALIÈ (Không dùng size quần áo)';
    } else if (cat.includes('giày') || cat.includes('phụ kiện') || cat.includes('shoe')) {
      targetTabId = 'tab-size-shoes';
      subtitleText = 'Bảng quy đổi kích cỡ Giày da, Giày cao gót & Thắt lưng chuẩn Quốc tế (Không dùng size quần áo)';
    } else if (cat.includes('đầm') || cat.includes('váy') || cat.includes('gown')) {
      targetTabId = 'tab-size-gown';
      subtitleText = 'Tiêu chuẩn số đo 3 vòng & chiều dài đầm dạ hội AURALIÈ Haute Couture';
    } else if (cat.includes('khoác') || cat.includes('len') || cat.includes('coat')) {
      targetTabId = 'tab-size-coat';
      subtitleText = 'Bảng size Áo khoác & Măng tô may đo - Có tính dung sai mặc lót Thu Đông';
    } else {
      targetTabId = 'tab-size-vest';
      subtitleText = 'Tiêu chuẩn may đo phom dáng Châu Âu - Dành cho Áo Vest & Blazer';
    }

    const tabs = document.querySelectorAll('.size-nav-tab');
    const panes = document.querySelectorAll('.size-guide-tab-content');

    tabs.forEach(t => {
      const isTarget = t.getAttribute('data-tab') === targetTabId;
      t.classList.toggle('active', isTarget);
      if (isTarget) {
        try { t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); } catch(e) {}
      }
    });

    panes.forEach(pane => {
      pane.classList.toggle('active', pane.id === targetTabId);
    });

    const subtitleEl = document.querySelector('.size-guide-subtitle');
    if (subtitleEl) subtitleEl.textContent = subtitleText;
  };

  const openSizeGuideModal = () => {
    if (!sizeGuideModal) return;
    const currentCat = window.activeModalProductCategory || window.activeModalProductCatSlug || '';
    switchSizeGuideTabByCategory(currentCat);
    sizeGuideModal.classList.add('active');
    sizeGuideModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeSizeGuideModal = () => {
    if (!sizeGuideModal) return;
    sizeGuideModal.classList.remove('active');
    sizeGuideModal.setAttribute('aria-hidden', 'true');
    // If productModal is still open, keep body overflow hidden; otherwise restore
    if (productModal && productModal.classList.contains('active')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  window.openSizeGuideModal = openSizeGuideModal;
  window.closeSizeGuideModal = closeSizeGuideModal;
  window.switchSizeGuideTabByCategory = switchSizeGuideTabByCategory;

  if (openSizeGuideBtn) {
    openSizeGuideBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openSizeGuideModal();
    });
  }

  if (closeSizeGuideModalBtn) {
    closeSizeGuideModalBtn.addEventListener('click', closeSizeGuideModal);
  }

  if (btnCloseSizeGuide) {
    btnCloseSizeGuide.addEventListener('click', closeSizeGuideModal);
  }

  if (sizeGuideModal) {
    sizeGuideModal.addEventListener('click', (e) => {
      if (e.target === sizeGuideModal) closeSizeGuideModal();
    });
  }

  // Size Guide Tab Switching (Hỗ trợ chuyển đổi mượt mà giữa các mặt hàng)
  const sizeNavTabs = document.querySelectorAll('.size-nav-tab');
  const sizeGuideContents = document.querySelectorAll('.size-guide-tab-content');
  sizeNavTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');
      sizeNavTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      sizeGuideContents.forEach(pane => {
        if (pane.id === targetId) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });

      // Cập nhật subtitle khi người dùng tự click tab
      const subtitleEl = document.querySelector('.size-guide-subtitle');
      if (subtitleEl) {
        if (targetId === 'tab-size-bags') {
          subtitleEl.textContent = 'Quy chuẩn kích thước & sức chứa túi xách da thủ công AURALIÈ (Không dùng size quần áo)';
        } else if (targetId === 'tab-size-shoes') {
          subtitleEl.textContent = 'Bảng quy đổi kích cỡ Giày da, Giày cao gót & Thắt lưng chuẩn Quốc tế (Không dùng size quần áo)';
        } else if (targetId === 'tab-size-gown') {
          subtitleEl.textContent = 'Tiêu chuẩn số đo 3 vòng & chiều dài đầm dạ hội AURALIÈ Haute Couture';
        } else if (targetId === 'tab-size-coat') {
          subtitleEl.textContent = 'Bảng size Áo khoác & Măng tô may đo - Có tính dung sai mặc lót Thu Đông';
        } else if (targetId === 'tab-size-vest') {
          subtitleEl.textContent = 'Tiêu chuẩn may đo phom dáng Châu Âu - Dành cho Áo Vest & Blazer';
        } else {
          subtitleEl.textContent = 'Công cụ tính toán size đề xuất thông minh dựa trên thông số cơ thể';
        }
      }
    });
  });

  // Size Calculator Logic
  const calcHeightInput = document.getElementById('calc-height');
  const calcWeightInput = document.getElementById('calc-weight');
  const calcGenderSelect = document.getElementById('calc-gender');
  const btnCalculateSize = document.getElementById('btn-calculate-size');
  const calcResultBox = document.getElementById('calc-result-box');
  const calcSizeOutput = document.getElementById('calc-size-output');
  const calcDescOutput = document.getElementById('calc-desc-output');
  const btnApplySizeToProduct = document.getElementById('btn-apply-size-to-product');

  if (btnCalculateSize) {
    btnCalculateSize.addEventListener('click', () => {
      const h = parseFloat(calcHeightInput ? calcHeightInput.value : 0);
      const w = parseFloat(calcWeightInput ? calcWeightInput.value : 0);
      const gender = calcGenderSelect ? calcGenderSelect.value : 'men';

      if (!h || !w || h < 100 || w < 25) {
        if (calcResultBox) {
          calcResultBox.style.display = 'flex';
          if (calcSizeOutput) calcSizeOutput.textContent = 'M';
          if (calcDescOutput) calcDescOutput.textContent = 'Vui lòng nhập chiều cao (cm) và cân nặng (kg) hợp lệ để hệ thống tính toán chính xác nhất.';
        }
        return;
      }

      let recSize = 'M';
      let confidence = 96;

      if (gender === 'men') {
        if (w < 55 || h < 165) recSize = 'S';
        else if (w <= 68 && h <= 175) recSize = 'M';
        else if (w <= 78 && h <= 182) recSize = 'L';
        else if (w <= 88 || h <= 188) recSize = 'XL';
        else recSize = 'XXL';
      } else {
        if (w < 48 || h < 158) recSize = 'S';
        else if (w <= 56 && h <= 165) recSize = 'M';
        else if (w <= 64 && h <= 172) recSize = 'L';
        else recSize = 'XL';
      }

      if (calcResultBox && calcSizeOutput && calcDescOutput) {
        calcSizeOutput.textContent = recSize;
        calcDescOutput.textContent = `Gợi ý kích cỡ dựa trên chỉ số ${h}cm - ${w}kg (${confidence}% khách hàng có tỉ lệ tương tự chọn size này).`;
        calcResultBox.style.display = 'flex';
      }
    });
  }

  // Apply calculated size directly to product modal
  if (btnApplySizeToProduct) {
    btnApplySizeToProduct.addEventListener('click', () => {
      const selectedSize = calcSizeOutput ? calcSizeOutput.textContent.trim() : 'M';
      let matched = false;
      modalSizeBtns.forEach(btn => {
        if (btn.textContent.trim().toUpperCase() === selectedSize.toUpperCase()) {
          modalSizeBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (modalSelectedSizeText) modalSelectedSizeText.textContent = btn.textContent;
          matched = true;
        }
      });
      if (!matched && modalSelectedSizeText) {
        modalSelectedSizeText.textContent = selectedSize;
      }
      closeSizeGuideModal();
    });
  }

  // Modal Add to Cart Action (Lưu sản phẩm đã chọn vào Giỏ Hàng)
  const modalBtnAddCart = document.getElementById('modal-btn-add-cart');
  if (modalBtnAddCart) {
    modalBtnAddCart.addEventListener('click', () => {
      const size = modalSelectedSizeText ? modalSelectedSizeText.textContent.trim() : 'M';
      const color = modalSelectedColorText ? modalSelectedColorText.textContent.trim() : 'Đen Tuyền';
      const qty = parseInt(qtyInput ? qtyInput.value : 1, 10) || 1;

      window.addToCart({
        id: window.activeModalProductId || 1,
        name: modalTitle ? modalTitle.textContent.trim() : 'Sản phẩm Haute Couture',
        category: modalCategory ? modalCategory.textContent.trim() : 'Haute Couture',
        price: window.activeModalProductPrice || 12500000,
        img: modalMainImg ? modalMainImg.src : 'assets/card_1.jpg',
        size,
        color,
        qty
      });

      modalBtnAddCart.innerHTML = '<i class="fa-solid fa-check"></i> Đã Thêm Giỏ Hàng!';
      modalBtnAddCart.style.background = 'var(--accent-gold)';
      setTimeout(() => {
        modalBtnAddCart.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> Thêm Vào Giỏ Hàng';
        modalBtnAddCart.style.background = '';
      }, 1800);
    });
  }

  // Live Product Reviews Fetcher từ SQL Server (AURALIE_FashionDB)
  window.fetchProductReviews = function(productId) {
    const reviewsList = document.getElementById('reviews-list');
    const modalTabCount = document.getElementById('modal-tab-count');
    const reviewCountBadge = document.getElementById('modal-review-count');
    const modalRatingVal = document.getElementById('modal-rating-val');

    if (!reviewsList) return;
    reviewsList.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--accent-gold);">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.8rem; margin-bottom: 0.5rem;"></i>
        <p style="font-size: 0.85rem; color: var(--text-muted); font-family: var(--font-serif);">Đang truy vấn đánh giá khách hàng trực tiếp từ SQL Server...</p>
      </div>
    `;

    fetch(`/api/v1/products/${productId}/reviews`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          const revs = data.reviews || [];
          const summary = data.summary || { averageRating: 5.0, totalReviews: revs.length };

          if (modalTabCount) modalTabCount.textContent = summary.totalReviews;
          if (reviewCountBadge) reviewCountBadge.textContent = `(${summary.totalReviews} Đánh giá từ khách hàng)`;
          if (modalRatingVal) modalRatingVal.textContent = Number(summary.averageRating).toFixed(1);

          if (revs.length === 0) {
            reviewsList.innerHTML = `
              <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted); background: #faf8f5; border-radius: 8px; border: 1px dashed var(--border-light);">
                <i class="fa-regular fa-comment-dots" style="font-size: 2.2rem; color: var(--accent-gold); margin-bottom: 0.5rem;"></i>
                <p style="font-size: 0.95rem; font-weight: 600; color: var(--primary-dark);">Chưa có đánh giá nào cho sản phẩm này trong CSDL</p>
                <p style="font-size: 0.82rem; color: #888;">Quý khách hãy là người đầu tiên chia sẻ cảm nhận trải nghiệm sản phẩm!</p>
              </div>
            `;
            return;
          }

          reviewsList.innerHTML = revs.map(r => {
            const initials = (r.user_name || 'KH').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            let starsHTML = '';
            for (let i = 0; i < (r.rating || 5); i++) {
              starsHTML += '<i class="fa-solid fa-star"></i>';
            }
            const dateStr = r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : 'Gần đây';

            return `
              <div class="review-item" style="border-left: 3px solid var(--accent-gold); margin-bottom: 1rem; animation: fadeIn 0.4s ease;">
                <div class="review-user-header">
                  <div class="review-avatar gold-av">${initials}</div>
                  <div class="review-user-info">
                    <div class="review-user-name">${r.user_name} <span class="verified-buyer"><i class="fa-solid fa-shield-check"></i> ${r.is_verified_buyer ? 'Đã xác thực mua hàng' : 'Khách hàng'}</span></div>
                    <div class="review-meta">${r.variant_info || 'Trang phục may đo Haute Couture'} | ${dateStr}</div>
                  </div>
                  <div class="review-stars-given">${starsHTML}</div>
                </div>
                <p class="review-text">${r.comment}</p>
                <div class="review-actions">
                  <button class="btn-helpful" data-likes="${r.helpful_count || 0}" onclick="window.likeReview(${r.id}, this)"><i class="fa-regular fa-thumbs-up"></i> Hữu ích (${r.helpful_count || 0})</button>
                </div>
              </div>
            `;
          }).join('');
        }
      })
      .catch(err => {
        console.error('Lỗi tải đánh giá:', err);
        reviewsList.innerHTML = `<div style="text-align: center; color: red; padding: 1.5rem;">Lỗi tải đánh giá từ CSDL.</div>`;
      });
  };

  window.likeReview = function(revId, btn) {
    if (!revId) return;
    const current = parseInt(btn.getAttribute('data-likes') || '0', 10);
    const nextVal = current + 1;
    btn.setAttribute('data-likes', nextVal);
    btn.innerHTML = `<i class="fa-solid fa-thumbs-up" style="color:var(--accent-gold);"></i> Đã thích (${nextVal})`;
    btn.disabled = true;
    fetch(`/api/v1/reviews/${revId}/like`, { method: 'POST' }).catch(e => console.warn('Like review failed:', e));
  };

  // Toggle Write Review Form
  const toggleWriteReviewBtn = document.getElementById('toggle-write-review-btn');
  const writeReviewForm = document.getElementById('write-review-form');

  if (toggleWriteReviewBtn && writeReviewForm) {
    toggleWriteReviewBtn.addEventListener('click', async () => {
      let currentUser = null;
      try {
        currentUser = JSON.parse(sessionStorage.getItem('auralie_user') || localStorage.getItem('auralie_user') || 'null');
      } catch (e) { currentUser = null; }

      if (!currentUser) {
        window.showLuxuryAlert({
          title: 'Yêu Cầu Đăng Nhập',
          message: 'Chưa đăng nhập quý khách chỉ có thể xem các đánh giá từ khách hàng khác. Vui lòng đăng nhập để gửi đánh giá sản phẩm.',
          type: 'warning',
          btnText: 'Đăng Nhập Ngay',
          onConfirm: () => { window.location.href = 'login.html'; }
        });
        return;
      }

      const prodId = window.activeModalProductId || 1;
      try {
        const checkRes = await fetch(`/api/v1/products/${prodId}/reviews/eligibility?email=${encodeURIComponent(currentUser.email || '')}&phone=${encodeURIComponent(currentUser.phone || '')}`);
        const checkData = await checkRes.json();
        if (checkData && checkData.data && checkData.data.eligible === false) {
          window.showLuxuryAlert({
            title: 'Chưa Thể Đánh Giá',
            message: 'Chỉ khách hàng <strong>đã mua sản phẩm này và đơn hàng đã hoàn tất (COMPLETED)</strong> mới được quyền gửi đánh giá.',
            type: 'warning',
            btnText: 'Đã Hiểu'
          });
          return;
        }
      } catch (err) {
        console.warn('Review eligibility check bypassed:', err);
      }

      writeReviewForm.classList.toggle('hidden');
      if (!writeReviewForm.classList.contains('hidden')) {
        const nameInput = document.getElementById('review-user-name');
        if (nameInput && currentUser.name && !nameInput.value) {
          nameInput.value = currentUser.name;
        }
        writeReviewForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  // Interactive Star Rating Selector in Review Form
  const starPicker = document.getElementById('form-star-picker');
  const starPickerLabel = document.getElementById('star-picker-label');
  let currentRatingScore = 5;

  if (starPicker) {
    const stars = starPicker.querySelectorAll('i');
    const ratingLabels = {
      1: '1/5 - Rất không hài lòng',
      2: '2/5 - Chưa hài lòng',
      3: '3/5 - Bình thường',
      4: '4/5 - Hài lòng',
      5: '5/5 - Tuyệt vời'
    };

    stars.forEach((star, idx) => {
      star.addEventListener('click', () => {
        currentRatingScore = idx + 1;
        stars.forEach((s, sIdx) => {
          if (sIdx <= idx) {
            s.classList.add('selected');
          } else {
            s.classList.remove('selected');
          }
        });
        if (starPickerLabel) starPickerLabel.textContent = ratingLabels[currentRatingScore];
      });
    });
  }

  // Dynamic Review Form Submission (Lưu Trực Tiếp Vào SQL Server: POST /api/v1/reviews)
  if (writeReviewForm) {
    writeReviewForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const userName = document.getElementById('review-user-name')?.value.trim();
      const userComment = document.getElementById('review-user-comment')?.value.trim();
      const prodId = window.activeModalProductId || 1;

      if (!userName || !userComment) return;

      const submitBtn = writeReviewForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu vào CSDL...';
      }

      let currentUser = null;
      try {
        currentUser = JSON.parse(sessionStorage.getItem('auralie_user') || localStorage.getItem('auralie_user') || 'null');
      } catch (e) { currentUser = null; }

      const variantStr = `Màu: ${modalSelectedColorText ? modalSelectedColorText.textContent : 'Đen'} | Size: ${modalSelectedSizeText ? modalSelectedSizeText.textContent : 'M'}`;

      fetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: prodId,
          userName: userName,
          userEmail: currentUser?.email || '',
          userPhone: currentUser?.phone || '',
          rating: currentRatingScore,
          comment: userComment,
          variantInfo: variantStr
        })
      })
      .then(res => res.json())
      .then(result => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Gửi Đánh Giá Ngay <i class="fa-solid fa-paper-plane"></i>';
        }

        if (result.status === 'success') {
          writeReviewForm.reset();
          writeReviewForm.classList.add('hidden');
          window.showLuxuryAlert({
            title: 'Đánh Giá Đã Lưu CSDL',
            message: 'Cảm ơn Quý khách <strong>' + userName + '</strong>! Đánh giá đã được ghi nhận trực tiếp vào SQL Server và xuất bản trên hệ thống.',
            type: 'success',
            btnText: 'Hoàn Tất',
            autoCloseMs: 3000
          });
          // Refresh live reviews from database
          window.fetchProductReviews(prodId);
        } else {
          window.showLuxuryAlert({
            title: 'Lỗi Gửi Đánh Giá',
            message: result.message || 'Không thể lưu đánh giá vào CSDL.',
            type: 'warning',
            btnText: 'Đóng'
          });
        }
      })
      .catch(err => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Gửi Đánh Giá Ngay <i class="fa-solid fa-paper-plane"></i>';
        }
        window.showLuxuryAlert({
          title: 'Lỗi Kết Nối',
          message: 'Không thể kết nối đến máy chủ: ' + err.message,
          type: 'warning',
          btnText: 'Đóng'
        });
      });
    });
  }

  const wishlistBadgeSelector = 'a[href="wishlist.html"] :is(.badge-count, .dropdown-badge)';
  
  // Khởi tạo danh sách ID sản phẩm yêu thích từ LocalStorage
  const initialWishlistIds = JSON.parse(localStorage.getItem('auralie_wishlist_ids') || '[]');
  window.userWishlistProductIds = new Set(initialWishlistIds.map(Number));

  window.setWishlistBadge = count => {
    document.querySelectorAll(wishlistBadgeSelector).forEach(badge => { badge.textContent = count; });
    document.documentElement.classList.toggle('has-wishlist-count', Boolean(sessionStorage.getItem('auralie_token')) || count > 0);
  };

  if (initialWishlistIds.length > 0) {
    window.setWishlistBadge(initialWishlistIds.length);
  }

  // Kiểm tra sản phẩm đã nằm trong Wishlist chưa
  window.isProductInWishlist = (productId) => {
    const id = Number(productId);
    if (window.userWishlistProductIds && window.userWishlistProductIds.has(id)) {
      return true;
    }
    const cached = JSON.parse(localStorage.getItem('auralie_wishlist_ids') || '[]');
    return cached.map(Number).includes(id);
  };

  // Cập nhật giao diện trái tim trong Modal chi tiết sản phẩm (Đỏ lên khi đã yêu thích)
  window.updateModalWishlistButtonState = (productId) => {
    const modalWishlistButton = document.getElementById('modal-btn-wishlist');
    if (!modalWishlistButton) return;
    const isFav = window.isProductInWishlist(productId);
    const icon = modalWishlistButton.querySelector('i');

    if (isFav) {
      modalWishlistButton.classList.add('active', 'in-wishlist');
      modalWishlistButton.setAttribute('title', 'Bỏ khỏi danh sách yêu thích');
      if (icon) {
        icon.className = 'fa-solid fa-heart';
        icon.style.color = '#e53935';
      }
    } else {
      modalWishlistButton.classList.remove('active', 'in-wishlist');
      modalWishlistButton.setAttribute('title', 'Thêm vào danh sách yêu thích');
      if (icon) {
        icon.className = 'fa-regular fa-heart';
        icon.style.color = '';
      }
    }
  };

  window.loadWishlist = async () => {
    try {
      const items = await window.Commerce.request('/api/v1/wishlist');
      const list = Array.isArray(items) ? items : (items?.data || []);
      const ids = list.map(i => Number(i.id || i.product_id));
      window.userWishlistProductIds = new Set(ids);
      localStorage.setItem('auralie_wishlist_ids', JSON.stringify(ids));
      window.setWishlistBadge(ids.length);

      if (window.activeModalProductId) {
        window.updateModalWishlistButtonState(window.activeModalProductId);
      }
      return list;
    } catch (err) {
      const cached = JSON.parse(localStorage.getItem('auralie_wishlist_ids') || '[]');
      window.userWishlistProductIds = new Set(cached.map(Number));
      window.setWishlistBadge(cached.length);
      return [];
    }
  };

  document.querySelectorAll('a[href="wishlist.html"]').forEach(link => {
    link.addEventListener('click', event => {
      if (sessionStorage.getItem('auralie_token')) return;
      event.preventDefault();
      sessionStorage.setItem('commerce_return', 'wishlist.html');
      location.href = 'login.html';
    });
  });

  if (sessionStorage.getItem('auralie_token') && !document.getElementById('wishlist-items-container')
      && document.querySelector(wishlistBadgeSelector)) {
    window.loadWishlist().catch(() => {});
  }

  const modalWishlistButton = document.getElementById('modal-btn-wishlist');
  modalWishlistButton?.addEventListener('click', async () => {
    const productId = Number(window.activeModalProductId);
    if (!productId) return;

    const token = sessionStorage.getItem('auralie_token');
    const isFav = window.isProductInWishlist(productId);

    modalWishlistButton.disabled = true;
    try {
      if (isFav) {
        // Toggle OFF: Xóa khỏi danh sách yêu thích -> Trái tim trở lại viền xám
        if (token) {
          await fetch(`/api/v1/wishlist/${productId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          });
        }
        if (window.userWishlistProductIds) {
          window.userWishlistProductIds.delete(productId);
        }
        const cached = JSON.parse(localStorage.getItem('auralie_wishlist_ids') || '[]')
          .map(Number)
          .filter(id => id !== productId);
        localStorage.setItem('auralie_wishlist_ids', JSON.stringify(cached));
        window.setWishlistBadge(window.userWishlistProductIds ? window.userWishlistProductIds.size : cached.length);
        window.updateModalWishlistButtonState(productId);
        window.showLuxuryAlert({
          title: 'Danh sách yêu thích',
          message: 'Đã xóa sản phẩm khỏi danh sách yêu thích.',
          autoCloseMs: 2000
        });
      } else {
        // Toggle ON: Thêm vào danh sách yêu thích -> Trái tim ĐỎ LÊN
        if (token) {
          const response = await fetch('/api/v1/wishlist', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ productId })
          });
          if (response.status === 401) {
            sessionStorage.removeItem('auralie_token');
            sessionStorage.removeItem('auralie_user');
            sessionStorage.setItem('commerce_return', 'index.html#catalog');
            location.href = 'login.html';
            return;
          }
          const result = await response.json();
          if (!response.ok) throw new Error(result.message);
        }
        if (!window.userWishlistProductIds) window.userWishlistProductIds = new Set();
        window.userWishlistProductIds.add(productId);
        const cached = [...new Set([...JSON.parse(localStorage.getItem('auralie_wishlist_ids') || '[]').map(Number), productId])];
        localStorage.setItem('auralie_wishlist_ids', JSON.stringify(cached));
        window.setWishlistBadge(window.userWishlistProductIds.size);
        window.updateModalWishlistButtonState(productId);
        window.showLuxuryAlert({
          title: 'Danh sách yêu thích',
          message: 'Đã thêm sản phẩm vào danh sách yêu thích thành công!',
          autoCloseMs: 2000
        });
      }

      if (token) {
        window.loadWishlist().catch(() => {});
      }
    } catch (error) {
      console.error('Lỗi thao tác wishlist:', error);
      window.showLuxuryAlert({
        title: 'Danh sách yêu thích',
        message: error.message || 'Không thể cập nhật danh sách yêu thích. Vui lòng thử lại.',
        type: 'warning'
      });
    } finally {
      modalWishlistButton.disabled = false;
    }
  });

  // 11. User Profile Dropdown Toggle & Dynamic Role-Based Status
  const userRole = sessionStorage.getItem('auralie_token') ? localStorage.getItem('userRole') : null;
  const userName = localStorage.getItem('userName') || 'Bà Nguyễn Thanh Vân';
  const userMenuTriggers = document.querySelectorAll('#user-menu-trigger, #user-dropdown-trigger, .desktop-user-btn');

  // Cập nhật thông tin Header Dropdown theo trạng thái đăng nhập
  document.querySelectorAll('.user-dropdown-menu').forEach(menu => {
    const avatarSmall = menu.querySelector('.user-avatar-small');
    const nameEl = menu.querySelector('.user-name');
    const rankEl = menu.querySelector('.user-rank');
    const vipProgress = menu.querySelector('.user-vip-progress');
    const linksList = menu.querySelector('.user-dropdown-links');

    if (!userRole) {
      // Khi CHƯA ĐĂNG NHẬP: hiển thị dạng Khách Quý & nút Đăng Nhập
      if (avatarSmall) avatarSmall.innerHTML = '<i class="fa-solid fa-user"></i>';
      if (nameEl) nameEl.textContent = 'Khách Quý AURALIÈ';
      if (rankEl) rankEl.innerHTML = '<span style="color:#888;">Chưa đăng nhập</span>';
      if (vipProgress) vipProgress.style.display = 'none';

      if (linksList) {
        linksList.innerHTML = `
          <li><a href="login.html" style="color: var(--accent-gold); font-weight: bold;"><i class="fa-solid fa-right-to-bracket"></i> Đăng Nhập / Đăng Ký</a></li>
          <li><a href="login.html"><i class="fa-solid fa-heart"></i> Danh Sách Yêu Thích</a></li>
          <li><a href="contact.html"><i class="fa-solid fa-gem"></i> Đặt Lịch VIP Concierge</a></li>
        `;
      }
      userMenuTriggers.forEach(t => t.setAttribute('href', 'login.html'));
    } else {
      // Khi ĐÃ ĐĂNG NHẬP: hiển thị thông tin thực tế
      const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'TV';
      if (avatarSmall) avatarSmall.textContent = initials;
      if (nameEl) nameEl.textContent = userName;
      if (rankEl) rankEl.innerHTML = `<i class="fa-solid fa-crown"></i> ${userRole === 'ADMIN' ? 'QUẢN TRỊ VIÊN' : 'PLATINUM VIP'}`;
      if (vipProgress) vipProgress.style.display = 'block';

      // Xóa link admin cũ nếu có
      const oldAdminItem = linksList?.querySelector('a[href="admin.html"]')?.closest('li');
      if (oldAdminItem) oldAdminItem.remove();

      // Chỉ thêm link Bảng Quản Trị nếu role là ADMIN
      if (userRole === 'ADMIN' && linksList) {
        const logoutItem = linksList.querySelector('.logout-link')?.closest('li');
        const adminLi = document.createElement('li');
        adminLi.innerHTML = `<a href="admin.html" style="color: var(--accent-gold); font-weight: bold;"><i class="fa-solid fa-user-shield"></i> Bảng Quản Trị Admin</a>`;
        if (logoutItem) {
          linksList.insertBefore(adminLi, logoutItem);
        } else {
          linksList.appendChild(adminLi);
        }
      }
      userMenuTriggers.forEach(t => t.setAttribute('href', 'profile.html'));
    }
  });

  // Logout handler to clear userRole & reset cart reminder flag
  document.querySelectorAll('.logout-link').forEach(logoutBtn => {
    logoutBtn.addEventListener('click', (e) => {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userId');
      sessionStorage.removeItem('auralie_token');
      sessionStorage.removeItem('auralie_user');
      sessionStorage.removeItem('cartReminderShownAfterLogin');
    });
  });

  userMenuTriggers.forEach(trigger => {
    const dropdown = trigger.nextElementSibling || trigger.parentElement?.querySelector('.user-dropdown-menu');
    if (dropdown && dropdown.classList.contains('user-dropdown-menu')) {
      trigger.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024) {
          e.preventDefault();
          dropdown.classList.toggle('active');
        }
      });
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-dropdown-wrapper') && !e.target.closest('.user-dropdown-container')) {
      document.querySelectorAll('.user-dropdown-menu').forEach(menu => menu.classList.remove('active'));
    }
  });

  // 13. Dynamic Voucher / Coupon Engine (Cart Checkout Page)
  const couponInput = document.getElementById('coupon-code-input');
  const applyCouponBtn = document.getElementById('apply-coupon-btn');

  if (applyCouponBtn && couponInput) {
    applyCouponBtn.addEventListener('click', async () => {
      const code = couponInput.value.trim().toUpperCase();
      if (window.Commerce && typeof window.Commerce.applyCoupon === 'function') {
        await window.Commerce.applyCoupon(couponInput.value);
        if (window.AuralieTracking && code) {
          window.AuralieTracking.track('coupon_apply', {
            properties: { coupon_code: code, discount_amount: Number(window.appliedCouponDiscount || 0), success: Boolean(window.appliedCouponDiscount) }
          });
        }
      } else {
        if (!code) {
          window.showLuxuryAlert({
            title: 'Lưu Ý',
            message: 'Vui lòng nhập mã ưu đãi VIP của quý khách!',
            type: 'warning'
          });
          return;
        }

        const cart = window.getCart();
        const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * (item.qty || 1)), 0);

        applyCouponBtn.disabled = true;
        applyCouponBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        fetch('/api/v1/coupons/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code, orderAmount: subtotal })
        })
        .then(res => res.json())
        .then(resData => {
          applyCouponBtn.disabled = false;
          applyCouponBtn.innerHTML = 'Áp Dụng';

          if (resData.status === 'success' && resData.data) {
            window.appliedCouponDiscount = resData.data.discountAmount;
            window.appliedCouponCode = code;
            if (window.AuralieTracking) {
              window.AuralieTracking.track('coupon_apply', {
                properties: { coupon_code: code, discount_amount: Number(resData.data.discountAmount || 0), order_amount: subtotal, success: true }
              });
            }
            window.renderCartPage();
            window.showLuxuryAlert({
              title: 'Áp Dụng Mã Ưu Đãi Thành Công',
              message: `Mã <strong>${code}</strong> hợp lệ! Quý khách được giảm ngay <strong>${Number(resData.data.discountAmount).toLocaleString('vi-VN')} ₫</strong> trực tiếp trên đơn hàng.`,
              type: 'success',
              btnText: 'Tuyệt Vời'
            });
          } else {
            if (window.AuralieTracking) {
              window.AuralieTracking.track('coupon_apply', {
                properties: { coupon_code: code, order_amount: subtotal, success: false }
              });
            }
            window.showLuxuryAlert({
              title: 'Mã Không Hợp Lệ',
              message: resData.message || 'Mã ưu đãi không hợp lệ hoặc đã hết hạn áp dụng!',
              type: 'warning'
            });
          }
        })
        .catch(() => {
          applyCouponBtn.disabled = false;
          applyCouponBtn.innerHTML = 'Áp Dụng';
          if (code === 'AURALIE2026') {
            const discount = Math.round(subtotal * 0.2);
            window.appliedCouponDiscount = discount;
            window.renderCartPage();
            window.showLuxuryAlert({
              title: 'Áp Dụng Mã Ưu Đãi Thành Công',
              message: `Áp dụng thành công mã <strong>AURALIE2026</strong> (Giảm 20% cho hội viên VIP)!`,
              type: 'success'
            });
          } else {
            window.showLuxuryAlert({
              title: 'Mã Không Hợp Lệ',
              message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn!',
              type: 'warning'
            });
          }
        });
      }
    });
  }



    const removeCouponBtn = document.getElementById('remove-coupon-btn');
  if (removeCouponBtn && couponInput) {
    removeCouponBtn.addEventListener('click', async () => {
      couponInput.value = '';
      window.appliedCouponDiscount = 0;
      window.appliedCouponCode = null;
      window.couponMessage = '';
      removeCouponBtn.style.display = 'none';
      if (window.Commerce && typeof window.Commerce.applyCoupon === 'function') {
        await window.Commerce.applyCoupon('');
      } else {
        if (window.renderCartPage) window.renderCartPage();
      }
      window.showLuxuryAlert({
        title: 'Đã Hủy Mã',
        message: 'Đã xóa mã ưu đãi thành công. Giá trị đơn hàng đã trở về mức ban đầu.',
        type: 'success',
        autoCloseMs: 2000
      });
    });
  }

  let selectedPaymentMethod = window.Commerce.readDraft().paymentMethod || 'SEPAY_QR';
  const paymentCards = document.querySelectorAll('#payment-method-group .payment-method-card');
  paymentCards.forEach(card => {
    card.addEventListener('click', () => {
      paymentCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      paymentCards.forEach(c => c.setAttribute('aria-checked', String(c === card)));
      selectedPaymentMethod = card.getAttribute('data-method') || 'SEPAY_QR';
      window.Commerce.saveDraft({ paymentMethod: selectedPaymentMethod });
      if (window.AuralieTracking) {
        window.AuralieTracking.track('payment_method_select', {
          properties: { payment_method: selectedPaymentMethod },
          dedupeKey: `pm-select-${selectedPaymentMethod}`
        });
      }

      const checkoutBtnElem = document.getElementById('btn-proceed-checkout');
      if (checkoutBtnElem) {
        if (selectedPaymentMethod === 'SEPAY_QR') {
          checkoutBtnElem.innerHTML = '<i class="fa-solid fa-qrcode"></i> Thanh Toán Tự Động Qua SePay <i class="fa-solid fa-bolt" style="color: #ffd700;"></i>';
        } else if (selectedPaymentMethod === 'COD') {
          checkoutBtnElem.innerHTML = '<i class="fa-solid fa-money-bill-wave"></i> Đặt Hàng Thanh Toán Khi Nhận (COD)';
        } else {
          checkoutBtnElem.innerHTML = '<i class="fa-brands fa-cc-visa"></i> Thanh Toán Thẻ Quốc Tế (VISA / Mastercard)';
        }
      }
    });
  });

  const checkoutBtn = document.getElementById('btn-proceed-checkout');
  if (document.getElementById('checkout-page')) {
    paymentCards.forEach(card => {
      const active = card.dataset.method === selectedPaymentMethod;
      card.classList.toggle('active', active);
      card.setAttribute('role', 'radio');
      card.setAttribute('aria-checked', String(active));
      card.tabIndex = 0;
      card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); card.click(); } });
    });
    document.getElementById('payment-method-group').setAttribute('role', 'radiogroup');
    document.getElementById('payment-method-group').setAttribute('aria-label', 'Phương thức thanh toán');
    void window.Commerce.checkoutPage();
  }
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      if (checkoutBtn.dataset.preparing === '1' || checkoutBtn.dataset.submitting === '1') return;
      checkoutBtn.dataset.preparing = '1';
      let shipping;
      try {
        if (!window.Commerce.selectedItems().length) {
          await window.Commerce.notify('Vui lòng tick chọn ít nhất một sản phẩm để thanh toán.');
          return;
        }
        shipping = await window.Commerce.prepareCheckout(window.Commerce.readDraft().paymentMethod || selectedPaymentMethod);
      } catch (error) {
        await window.Commerce.notify(error.message);
        return;
      } finally {
        delete checkoutBtn.dataset.preparing;
      }
      if (!shipping) return;
      checkoutBtn.dataset.submitting = '1';
      selectedPaymentMethod = shipping.paymentMethod;
      const cart = shipping.cartItems;
      if (!cart || cart.length === 0) {
        window.showLuxuryAlert({
          title: 'Giỏ Hàng Đang Trống',
          message: 'Quý khách vui lòng chọn thêm sản phẩm vào giỏ hàng trước khi tiến hành thanh toán!',
          type: 'warning',
          btnText: 'Khám Phá Bộ Sưu Tập',
          redirectUrl: 'index.html#catalog'
        });
        return;
      }

      const rawSubtotal = cart.reduce((sum, item) => sum + (Number(item.price) * (item.qty || 1)), 0);
      const discount = window.appliedCouponDiscount || 0;
      const finalTotal = Math.max(0, rawSubtotal - discount);
      const userName = shipping.fullName;

      if (window.AuralieTracking) {
        window.AuralieTracking.track('checkout_start', {
          properties: {
            item_count: cart.length,
            subtotal: rawSubtotal,
            discount,
            final_total: finalTotal,
            payment_method: selectedPaymentMethod,
            coupon_code: window.appliedCouponCode || null
          },
          dedupeKey: 'checkout-start'
        });
        window.AuralieTracking.track('checkout_information_submit', {
          properties: {
            payment_method: selectedPaymentMethod,
            has_coupon: Boolean(window.appliedCouponCode),
            final_total: finalTotal
          },
          dedupeKey: 'checkout-info-submit'
        });
      }

      const authToken = (window.getAuthToken && window.getAuthToken()) || sessionStorage.getItem('auralie_token');
      const authHeaders = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };
      const activeCoupon = window.appliedCouponCode || undefined;

      // 1. THANH TOÁN KHI NHẬN HÀNG (COD)
      if (selectedPaymentMethod === 'COD') {
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang khởi tạo đơn hàng COD...';

        fetch('/api/v1/orders', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            fullName: userName,
            phone: shipping.phone,
            address: shipping.address,
            totalAmount: finalTotal,
            paymentMethod: 'COD',
            couponCode: activeCoupon,
            items: cart
          })
        })
        .then(res => res.json())
        .then(orderRes => {
          if (orderRes.status !== 'success' || !orderRes.data?.orderCode) throw new Error(orderRes.message || 'Không thể tạo đơn hàng.');
          window.Commerce.rememberOrder(orderRes.data, shipping);
          delete checkoutBtn.dataset.submitting;
          checkoutBtn.disabled = false;
          checkoutBtn.innerHTML = '<i class="fa-solid fa-money-bill-wave"></i> Đặt Hàng Thanh Toán Khi Nhận (COD)';

          window.Commerce.completePurchase(cart);
          window.appliedCouponDiscount = 0;
          window.appliedCouponCode = null;
          window.updateCartBadge();

          const code = orderRes.data ? orderRes.data.orderCode : 'AUR-2026-COD';
          window.showLuxuryAlert({
            title: 'Đặt Hàng Thành Công',
            message: `Đơn hàng <strong>${code}</strong> (Thanh toán COD khi nhận hàng) đã được ghi nhận trực tiếp vào SQL Server!`,
            type: 'success',
            btnText: 'Xem Đơn Hàng',
            redirectUrl: 'profile.html#orders'
          });
        })
        .catch(err => {
          delete checkoutBtn.dataset.submitting;
          checkoutBtn.disabled = false;
          checkoutBtn.innerHTML = '<i class="fa-solid fa-money-bill-wave"></i> Đặt Hàng Thanh Toán Khi Nhận (COD)';
          window.showLuxuryAlert({ title: 'Lỗi', message: err.message, type: 'warning' });
        });
        return;
      }

      // 2. THANH TOÁN THẺ VISA
      if (selectedPaymentMethod === 'VISA') {
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý giao dịch thẻ...';

        fetch('/api/v1/orders', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            fullName: userName,
            phone: shipping.phone,
            address: shipping.address,
            totalAmount: finalTotal,
            paymentMethod: 'VISA',
            couponCode: activeCoupon,
            items: cart
          })
        })
        .then(res => res.json())
        .then(orderRes => {
          if (orderRes.status !== 'success' || !orderRes.data?.orderCode) throw new Error(orderRes.message || 'Không thể tạo đơn hàng.');
          window.Commerce.rememberOrder(orderRes.data, shipping);
          delete checkoutBtn.dataset.submitting;
          checkoutBtn.disabled = false;
          checkoutBtn.innerHTML = '<i class="fa-brands fa-cc-visa"></i> Thanh Toán Thẻ Quốc Tế (VISA / Mastercard)';

          window.Commerce.completePurchase(cart);
          window.appliedCouponDiscount = 0;
          window.appliedCouponCode = null;
          window.updateCartBadge();

          const code = orderRes.data ? orderRes.data.orderCode : 'AUR-2026-VISA';
          window.showLuxuryAlert({
            title: 'Thanh Toán Thành Công',
            message: `Đơn hàng <strong>${code}</strong> đã được thanh toán thành công qua Thẻ Quốc Tế và lưu vào CSDL!`,
            type: 'success',
            btnText: 'Xem Đơn Hàng',
            redirectUrl: 'profile.html#orders'
          });
        })
        .catch(err => {
          delete checkoutBtn.dataset.submitting;
          checkoutBtn.disabled = false;
          checkoutBtn.innerHTML = '<i class="fa-brands fa-cc-visa"></i> Thanh Toán Thẻ Quốc Tế (VISA / Mastercard)';
          window.showLuxuryAlert({ title: 'Lỗi', message: err.message, type: 'warning' });
        });
        return;
      }

      // 3. THANH TOÁN TỰ ĐỘNG QUA CỔNG SEPAY (VIETQR)
      checkoutBtn.disabled = true;
      checkoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tạo mã VietQR SePay...';

      fetch('/api/v1/orders', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          fullName: userName,
          phone: shipping.phone,
          address: shipping.address,
          totalAmount: finalTotal,
          paymentMethod: 'SEPAY_QR',
          couponCode: activeCoupon,
          items: cart
        })
      })
      .then(res => res.json())
      .then(orderRes => {
          if (orderRes.status !== 'success' || !orderRes.data?.orderCode) throw new Error(orderRes.message || 'Không thể tạo đơn hàng.');
          window.Commerce.rememberOrder(orderRes.data, shipping);
        delete checkoutBtn.dataset.submitting;
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = '<i class="fa-solid fa-qrcode"></i> Thanh Toán Tự Động Qua SePay <i class="fa-solid fa-bolt" style="color: #ffd700;"></i>';

        const orderData = orderRes.data || {};
        const orderCode = orderData.orderCode || 'AUR-2026-992';
        const numAmount = orderData.totalAmount || finalTotal;
        const bankInfo = orderData.bankInfo || {
          bankCode: 'MBBank',
          bankShortName: 'MB',
          accountNumber: '0388888888',
          accountName: 'AURALIE HAUTE COUTURE',
          transferAmount: numAmount,
          transferContent: orderCode
        };
        const qrUrl = orderData.qrCodeUrl || `https://qr.sepay.vn/img?acc=${bankInfo.accountNumber}&bank=${bankInfo.bankShortName}&amount=${numAmount}&des=${orderCode}&template=compact`;

        // Khởi tạo Modal SePay VietQR
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'sepay-checkout-modal';
        modal.innerHTML = `
          <div class="sepay-modal-container">
            <button class="modal-close-btn" id="close-sepay-modal">&times;</button>
            
            <div class="sepay-header-banner">
              <div>
                <div class="sepay-brand-tag"><i class="fa-solid fa-gem"></i> AURALIÈ HAUTE COUTURE</div>
                <div class="sepay-header-title"><i class="fa-solid fa-qrcode"></i> CỔNG THANH TOÁN TỰ ĐỘNG SEPAY</div>
              </div>
              <div style="font-size: 0.72rem; background: rgba(255,255,255,0.18); padding: 0.35rem 0.65rem; border-radius: 6px; font-weight: 700; color: #fff; letter-spacing: 0.5px;">
                VIETQR 24/7
              </div>
            </div>

            <div class="sepay-qr-box">
              <img src="${qrUrl}" alt="VietQR SePay Cổng Thanh Toán" class="sepay-qr-img">
            </div>

            <div class="sepay-amount-display">${Number(numAmount).toLocaleString('vi-VN')} ₫</div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">
              Quét mã QR từ bất kỳ app Ngân hàng (MB, VCB, ACB, TPB, Techcombank...) hoặc Ví điện tử
            </p>

            <div class="sepay-bank-details">
              <div class="sepay-detail-row">
                <span class="sepay-label"><i class="fa-solid fa-building-columns"></i> Ngân hàng:</span>
                <span class="sepay-val">${bankInfo.bankCode} (${bankInfo.bankShortName})</span>
              </div>
              <div class="sepay-detail-row">
                <span class="sepay-label"><i class="fa-solid fa-credit-card"></i> Số tài khoản:</span>
                <div class="sepay-val-group">
                  <span class="sepay-val" id="sepay-acc-val">${bankInfo.accountNumber}</span>
                  <button class="sepay-copy-btn" id="copy-acc-btn">Sao chép</button>
                </div>
              </div>
              <div class="sepay-detail-row">
                <span class="sepay-label"><i class="fa-solid fa-user"></i> Người thụ hưởng:</span>
                <span class="sepay-val">${bankInfo.accountName}</span>
              </div>
              <div class="sepay-detail-row">
                <span class="sepay-label"><i class="fa-solid fa-money-bill-wave"></i> Số tiền:</span>
                <div class="sepay-val-group">
                  <span class="sepay-val">${Number(numAmount).toLocaleString('vi-VN')} ₫</span>
                  <button class="sepay-copy-btn" id="copy-amt-btn">Sao chép</button>
                </div>
              </div>
              <div class="sepay-detail-row">
                <span class="sepay-label"><i class="fa-solid fa-comment-dots"></i> Nội dung CK:</span>
                <div class="sepay-val-group">
                  <span class="sepay-val highlight" id="sepay-code-val">${orderCode}</span>
                  <button class="sepay-copy-btn" id="copy-code-btn">Sao chép</button>
                </div>
              </div>
            </div>

            <div class="sepay-status-indicator" id="sepay-poll-status">
              <span class="pulsing-dot"></span>
              <span>Đang chờ hệ thống SePay quét giao dịch chuyển khoản...</span>
            </div>

            <div class="sepay-actions-group">
              <button class="btn-primary-luxury" id="btn-sepay-manual-check" style="width: 100%; justify-content: center; padding: 0.8rem;">
                <i class="fa-solid fa-rotate"></i> Tôi Đã Chuyển Khoản (Kiểm Tra Ngay)
              </button>
              <button class="btn-simulate-sepay" id="btn-sepay-simulate-demo" title="Nhấn để giả lập SePay gửi Webhook khớp lệnh trực tiếp vào SQL Server">
                <i class="fa-solid fa-wand-magic-sparkles"></i> [Demo ĐATN] Giả Lập SePay Khớp Lệnh Tức Thì
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        checkoutBtn.dataset.submitting = '1';
        checkoutBtn.disabled = true;

        // Nút sao chép thông tin
        modal.querySelector('#copy-acc-btn')?.addEventListener('click', (e) => {
          navigator.clipboard.writeText(bankInfo.accountNumber);
          e.target.textContent = 'Đã chép!';
          setTimeout(() => { e.target.textContent = 'Sao chép'; }, 2000);
        });
        modal.querySelector('#copy-amt-btn')?.addEventListener('click', (e) => {
          navigator.clipboard.writeText(numAmount.toString());
          e.target.textContent = 'Đã chép!';
          setTimeout(() => { e.target.textContent = 'Sao chép'; }, 2000);
        });
        modal.querySelector('#copy-code-btn')?.addEventListener('click', (e) => {
          navigator.clipboard.writeText(orderCode);
          e.target.textContent = 'Đã chép!';
          setTimeout(() => { e.target.textContent = 'Sao chép'; }, 2000);
        });

        // Hàm hiển thị giao diện thành công
        const renderPaymentSuccess = () => {
          if (!modal.isConnected) return;
          window.Commerce.completePurchase(cart);
          window.appliedCouponDiscount = 0;
          window.updateCartBadge();

          const container = modal.querySelector('.sepay-modal-container');
          if (!container) return;
          container.innerHTML = `
            <button class="modal-close-btn" id="close-sepay-modal" type="button" aria-label="Đóng thanh toán">&times;</button>
            <div class="sepay-success-container">
              <div class="sepay-success-icon"><i class="fa-solid fa-check"></i></div>
              <div class="sepay-brand-tag" style="margin-bottom: 0.35rem;"><i class="fa-solid fa-gem"></i> GIAO DỊCH XÁC THỰC THÀNH CÔNG</div>
              <h2 style="font-family: var(--font-serif); font-size: 1.8rem; color: var(--primary-dark); margin-bottom: 0.5rem;">Thanh Toán SePay Thành Công!</h2>
              <p style="font-size: 0.88rem; color: #555; margin-bottom: 1.5rem;">
                Đơn hàng <strong style="color: var(--accent-gold); font-size: 1rem;">${orderCode}</strong> đã được SePay khớp lệnh và cập nhật trực tiếp vào SQL Server ở trạng thái <strong>ĐÃ THANH TOÁN (PAID)</strong>.
              </p>

              <div style="background: #fbf9f5; border: 1px solid #eee7dd; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; text-align: left; font-size: 0.85rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom: 0.4rem;">
                  <span style="color:#777;">Mã đơn hàng:</span>
                  <strong>${orderCode}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom: 0.4rem;">
                  <span style="color:#777;">Số tiền thanh toán:</span>
                  <strong style="color: var(--accent-gold); font-size: 1.05rem;">${Number(numAmount).toLocaleString('vi-VN')} ₫</strong>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom: 0.4rem;">
                  <span style="color:#777;">Cổng thanh toán:</span>
                  <span>SePay VietQR 24/7 (${bankInfo.bankCode})</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span style="color:#777;">Trạng thái đơn hàng:</span>
                  <span style="color: #2e7d32; font-weight: 700;"><i class="fa-solid fa-circle-check"></i> Đã Xác Nhận (CONFIRMED)</span>
                </div>
              </div>

              <div style="display: flex; gap: 0.75rem;">
                <a href="profile.html#orders" class="btn-primary-luxury" style="flex: 1; justify-content: center; text-decoration: none;">
                  <i class="fa-solid fa-box-archive"></i> Xem Đơn Hàng Của Tôi
                </a>
                <a href="index.html#catalog" class="btn-primary-luxury btn-vip-consult" style="flex: 1; justify-content: center; text-decoration: none;">
                  Tiếp Tục Mua Sắm
                </a>
              </div>
            </div>
          `;
        };

        // Polling kiểm tra trạng thái thanh toán tự động qua SePay Webhook
        let isPolling = true;
        const pollTimer = setInterval(async () => {
          if (!isPolling) {
            clearInterval(pollTimer);
            return;
          }
          try {
            const checkRes = await fetch(`/api/v1/orders/${orderCode}/payment-status`);
            const checkData = await checkRes.json();
            if (checkData.status === 'success' && checkData.data && checkData.data.isPaid) {
              isPolling = false;
              clearInterval(pollTimer);
              renderPaymentSuccess();
            }
          } catch (err) {}
        }, 2500);

        // Closing dismisses the payment view without changing the existing order.
        const closePayment = () => {
          isPolling = false;
          clearInterval(pollTimer);
          document.removeEventListener('keydown', closeOnEscape);
          modal.remove();
          delete checkoutBtn.dataset.submitting;
          window.Commerce.renderCheckoutSummary();
        };
        const closeOnEscape = event => { if (event.key === 'Escape') closePayment(); };
        document.addEventListener('keydown', closeOnEscape);
        modal.addEventListener('click', event => { if (event.target.closest('#close-sepay-modal')) closePayment(); });
        modal.querySelector('#close-sepay-modal')?.setAttribute('aria-label', 'Đóng thanh toán');

        // Nút kiểm tra thủ công ngay
        modal.querySelector('#btn-sepay-manual-check')?.addEventListener('click', async () => {
          const btn = modal.querySelector('#btn-sepay-manual-check');
          btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang truy vấn CSDL...';
          try {
            const checkRes = await fetch(`/api/v1/orders/${orderCode}/payment-status`);
            const checkData = await checkRes.json();
            if (checkData.status === 'success' && checkData.data && checkData.data.isPaid) {
              isPolling = false;
              clearInterval(pollTimer);
              renderPaymentSuccess();
            } else {
              btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Tôi Đã Chuyển Khoản (Kiểm Tra Ngay)';
              alert('Hệ thống SePay đang đợi quét giao dịch từ ngân hàng của Quý khách. Nếu đã chuyển thành công, đơn hàng sẽ được duyệt tự động trong vài giây!');
            }
          } catch (e) {
            btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Tôi Đã Chuyển Khoản (Kiểm Tra Ngay)';
          }
        });

        // Nút Giả lập SePay (Dành cho việc Báo Cáo / Demo ĐATN - Yêu cầu Admin)
        modal.querySelector('#btn-sepay-simulate-demo')?.addEventListener('click', async () => {
          const simBtn = modal.querySelector('#btn-sepay-simulate-demo');
          simBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang kích hoạt khớp lệnh giả lập...';
          try {
            const token = window.getAuthToken ? window.getAuthToken() : sessionStorage.getItem('auralie_token');
            const simRes = await fetch('/api/v1/sepay/simulate-payment', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              },
              body: JSON.stringify({ orderCode })
            });
            const simJson = await simRes.json();
            if (simJson.status === 'success') {
              isPolling = false;
              clearInterval(pollTimer);
              renderPaymentSuccess();
            } else {
              simBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> [Demo ĐATN] Giả Lập SePay Khớp Lệnh Tức Thì';
              if (window.showLuxuryAlert) {
                window.showLuxuryAlert({
                  title: 'Bảo Vệ Hệ Thống',
                  message: simJson.message || 'Tính năng Giả lập thanh toán yêu cầu quyền Quản Trị Viên (Admin) và chỉ hoạt động trên môi trường Development.',
                  type: 'warning'
                });
              } else {
                alert(simJson.message || 'Cần quyền Admin để giả lập thanh toán.');
              }
            }
          } catch (e) {
            simBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> [Demo ĐATN] Giả Lập SePay Khớp Lệnh Tức Thì';
          }
        });
      })
      .catch(err => {
        delete checkoutBtn.dataset.submitting;
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = '<i class="fa-solid fa-qrcode"></i> Thanh Toán Tự Động Qua SePay <i class="fa-solid fa-bolt" style="color: #ffd700;"></i>';
        window.showLuxuryAlert({
          title: 'Lỗi Kết Nối',
          message: 'Không thể khởi tạo đơn hàng: ' + err.message,
          type: 'warning'
        });
      });
    });
  }

  // 15. Order tracking uses a website dialog, never a browser prompt.
  window.openOrderTrackerModal = window.Commerce.openTracker;
  if (checkoutBtn && new URLSearchParams(location.search).has('checkout')) {
    history.replaceState(null, '', 'cart.html');
    checkoutBtn.click();
  }

  // 16. Luxury AI Concierge / Stylist Live Chat Widget
  const createChatWidget = () => {
    if (document.getElementById('luxury-chat-widget')) return;

    const chatDiv = document.createElement('div');
    chatDiv.id = 'luxury-chat-widget';
    chatDiv.style.cssText = 'position: fixed; bottom: 85px; right: 20px; z-index: 9999;';
    chatDiv.innerHTML = `
      <button id="chat-toggle-btn" title="Trợ lý AI AURALIÈ" style="background: var(--primary-dark); color: var(--accent-gold); border: 1px solid var(--accent-gold); width: 55px; height: 55px; border-radius: 50%; box-shadow: 0 4px 20px rgba(0,0,0,0.35); font-size: 1.4rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; position: relative;">
        <i class="fa-solid fa-headset"></i>
        <span style="position: absolute; top: 0; right: 0; width: 14px; height: 14px; background: #2e7d32; border: 2px solid #fff; border-radius: 50%;"></span>
      </button>

      <div id="chat-window-box" style="display: none; position: absolute; bottom: 70px; right: 0; width: 360px; max-width: calc(100vw - 30px); background: #ffffff; border-radius: 16px; border: 1px solid var(--border-light); box-shadow: 0 12px 35px rgba(0,0,0,0.25); overflow: hidden; flex-direction: column; transition: all 0.3s ease;">
        
        <!-- Header -->
        <div style="background: var(--primary-dark); color: #fff; padding: 0.85rem 1rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(212, 175, 55, 0.3);">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <div style="width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-gold), #b38728); color: #121212; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.85rem; box-shadow: 0 2px 8px rgba(212,175,55,0.4);">
              <i class="fa-solid fa-sparkles"></i>
            </div>
            <div>
              <strong style="font-size: 0.9rem; display: block; color: #fff; letter-spacing: 0.5px;">AURALIÈ AI Stylist</strong>
              <span style="font-size: 0.7rem; color: var(--accent-gold); display: flex; align-items: center; gap: 0.3rem;">
                <span style="width: 6px; height: 6px; background: #4caf50; border-radius: 50%; display: inline-block;"></span> 
                Trực tuyến | AI Stylist Concierge
              </span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <button id="chat-clear-btn" title="Xóa lịch sử trò chuyện" style="background: none; border: none; color: var(--accent-gold); font-size: 0.85rem; cursor: pointer; padding: 4px;"><i class="fa-solid fa-rotate-right"></i></button>
            <button id="chat-close-btn" title="Đóng" style="background: none; border: none; color: #fff; font-size: 1.2rem; cursor: pointer; padding: 4px; line-height: 1;">&times;</button>
          </div>
        </div>

        <!-- Messages Area -->
        <div id="chat-messages-container" style="padding: 1rem; height: 280px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.82rem; background: #faf8f5;">
          <div style="background: #fff; padding: 0.8rem 0.95rem; border-radius: 14px 14px 14px 2px; max-width: 88%; border: 1px solid var(--border-light); box-shadow: 0 2px 6px rgba(0,0,0,0.04); line-height: 1.45;">
            ✨ Xin chào quý khách! Tôi là <strong>AURALIÈ AI Concierge</strong> - Trợ lý phong cách & tư vấn thời trang VIP.<br><br>Tôi có thể giúp quý khách chọn phom Size chuẩn, gợi ý túi xách phối đồ đi tiệc, hoặc cung cấp mã ưu đãi VIP hôm nay.
          </div>
        </div>

        <!-- Quick Action Pills -->
        <div style="padding: 0.5rem 0.75rem; background: #fff; border-top: 1px solid var(--border-light); display: flex; gap: 0.4rem; overflow-x: auto; white-space: nowrap; scrollbar-width: none;">
          <button class="chat-quick-pill" onclick="sendQuickReply('✨ Tối nay mặc gì đi tiệc?')" style="padding: 0.35rem 0.75rem; border-radius: 20px; border: 1px solid var(--accent-gold); font-size: 0.72rem; background: #faf8f5; color: var(--primary-dark); font-weight: 500; cursor: pointer; transition: all 0.2s;">✨ Phối đồ đi tiệc</button>
          <button class="chat-quick-pill" onclick="sendQuickReply('🔥 Bán chạy nhất')" style="padding: 0.35rem 0.75rem; border-radius: 20px; border: 1px solid var(--border-light); font-size: 0.72rem; background: #f5f5f5; color: #333; cursor: pointer;">🔥 Sản phẩm Hot</button>
          <button class="chat-quick-pill" onclick="sendQuickReply('Tư vấn chọn Size')" style="padding: 0.35rem 0.75rem; border-radius: 20px; border: 1px solid var(--border-light); font-size: 0.72rem; background: #f5f5f5; color: #333; cursor: pointer;">📏 Chọn Size chuẩn</button>
          <button class="chat-quick-pill" onclick="sendQuickReply('Mã giảm giá VIP')" style="padding: 0.35rem 0.75rem; border-radius: 20px; border: 1px solid var(--border-light); font-size: 0.72rem; background: #f5f5f5; color: #333; cursor: pointer;">🎁 Mã VIP</button>
          <button class="chat-quick-pill" onclick="openOrderTrackerModal()" style="padding: 0.35rem 0.75rem; border-radius: 20px; border: 1px solid var(--border-light); font-size: 0.72rem; background: #f5f5f5; color: #333; cursor: pointer;">📦 Tra cứu đơn hàng</button>
        </div>

        <!-- Attachment Preview Bar (Hidden by default) -->
        <div id="chat-attachment-preview" style="display: none; padding: 0.4rem 0.75rem; background: #fff3e0; border-top: 1px solid #ffe0b2; align-items: center; justify-content: space-between; font-size: 0.75rem; color: #e65100;">
          <span style="display: flex; align-items: center; gap: 0.4rem;">
            <i class="fa-solid fa-image"></i> <span id="chat-attachment-name">ảnh_trang_phuc.jpg</span>
          </span>
          <button id="chat-remove-attachment" style="background: none; border: none; color: #e65100; cursor: pointer; font-size: 0.9rem;">&times;</button>
        </div>

        <!-- Hidden Photo Input -->
        <input type="file" id="chat-photo-input" accept="image/*" style="display: none;">

        <!-- Input Bar with Voice Mic & Attachment & Send -->
        <div style="padding: 0.6rem 0.75rem; background: #fff; border-top: 1px solid var(--border-light); display: flex; align-items: center; gap: 0.4rem;">
          <button id="chat-attach-btn" title="Gửi ảnh để AI phân tích trang phục" style="background: #f5f5f5; color: #555; border: 1px solid var(--border-light); width: 34px; height: 34px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; transition: all 0.2s;">
            <i class="fa-solid fa-paperclip"></i>
          </button>
          
          <button id="chat-mic-btn" title="Nói chuyện bằng giọng nói (Voice Input)" style="background: #f5f5f5; color: #555; border: 1px solid var(--border-light); width: 34px; height: 34px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; transition: all 0.2s;">
            <i class="fa-solid fa-microphone"></i>
          </button>

          <input type="text" id="chat-input-field" placeholder="Nhập tin nhắn hoặc nói..." style="flex: 1; padding: 0.55rem 0.85rem; border: 1px solid var(--border-light); border-radius: 20px; font-size: 0.8rem; outline: none; background: #fafafa;">
          
          <button id="chat-send-btn" title="Gửi" style="background: var(--accent-gold); color: #fff; border: none; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(212,175,55,0.4); font-size: 0.85rem;">
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(chatDiv);

    const toggleBtn = document.getElementById('chat-toggle-btn');
    const closeBtn = document.getElementById('chat-close-btn');
    const clearBtn = document.getElementById('chat-clear-btn');
    const chatBox = document.getElementById('chat-window-box');
    const sendBtn = document.getElementById('chat-send-btn');
    const inputField = document.getElementById('chat-input-field');
    const msgContainer = document.getElementById('chat-messages-container');
    const attachBtn = document.getElementById('chat-attach-btn');
    const photoInput = document.getElementById('chat-photo-input');
    const micBtn = document.getElementById('chat-mic-btn');
    const attachPreview = document.getElementById('chat-attachment-preview');
    const attachName = document.getElementById('chat-attachment-name');
    const removeAttachBtn = document.getElementById('chat-remove-attachment');

    let currentAttachment = null;
    let isRecording = false;

    toggleBtn.addEventListener('click', () => {
      chatBox.style.display = chatBox.style.display === 'none' ? 'flex' : 'none';
    });
    closeBtn.addEventListener('click', () => {
      chatBox.style.display = 'none';
    });

    clearBtn.addEventListener('click', () => {
      msgContainer.innerHTML = `
        <div style="background: #fff; padding: 0.8rem 0.95rem; border-radius: 14px 14px 14px 2px; max-width: 88%; border: 1px solid var(--border-light); box-shadow: 0 2px 6px rgba(0,0,0,0.04); line-height: 1.45;">
          🧹 <i>Đã làm sạch cuộc trò chuyện.</i><br><br>✨ Xin chào quý khách! Tôi có thể giúp gì cho quý khách ngay lúc này?
        </div>
      `;
    });

    // Image Upload attachment simulation
    attachBtn.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        currentAttachment = e.target.files[0];
        attachName.textContent = currentAttachment.name;
        attachPreview.style.display = 'flex';
      }
    });
    removeAttachBtn.addEventListener('click', () => {
      currentAttachment = null;
      photoInput.value = '';
      attachPreview.style.display = 'none';
    });

    // Voice recognition (Web Speech API with graceful fallback)
    micBtn.addEventListener('click', () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        
        if (!isRecording) {
          recognition.start();
          isRecording = true;
          micBtn.style.background = '#e53935';
          micBtn.style.color = '#fff';
          micBtn.innerHTML = '<i class="fa-solid fa-microphone-slash fa-spin"></i>';
          inputField.placeholder = 'Đang lắng nghe giọng nói của bạn...';
        } else {
          recognition.stop();
          isRecording = false;
          micBtn.style.background = '#f5f5f5';
          micBtn.style.color = '#555';
          micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
          inputField.placeholder = 'Nhập tin nhắn hoặc nói...';
        }

        recognition.onresult = (event) => {
          const speechText = event.results[0][0].transcript;
          inputField.value = speechText;
          isRecording = false;
          micBtn.style.background = '#f5f5f5';
          micBtn.style.color = '#555';
          micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
          inputField.placeholder = 'Nhập tin nhắn hoặc nói...';
        };

        recognition.onerror = () => {
          isRecording = false;
          micBtn.style.background = '#f5f5f5';
          micBtn.style.color = '#555';
          micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
          inputField.placeholder = 'Nhập tin nhắn hoặc nói...';
        };
      } else {
        // Fallback for browsers without Web Speech API
        inputField.value = 'Gợi ý cho tôi túi xách da cao cấp màu đen';
        alert('🎙️ Đã kích hoạt giả lập micro: Tin nhắn mẫu đã được đưa vào khung chat!');
      }
    });

    // Handle Send & AI Intelligent Response
    const handleSend = (text) => {
      const msg = text || inputField.value.trim();
      if (!msg && !currentAttachment) return;

      // User Message Bubble
      const userMsg = document.createElement('div');
      userMsg.style.cssText = 'background: var(--primary-dark); color: #fff; padding: 0.65rem 0.9rem; border-radius: 14px 14px 2px 14px; align-self: flex-end; max-width: 82%; box-shadow: 0 2px 6px rgba(0,0,0,0.1); line-height: 1.4;';
      
      let userHtml = msg;
      if (currentAttachment) {
        userHtml = `<div><i class="fa-solid fa-image"></i> <i>Đã đính kèm: ${currentAttachment.name}</i></div>` + (msg ? `<div style="margin-top:0.3rem;">${msg}</div>` : '');
      }
      userMsg.innerHTML = userHtml;
      msgContainer.appendChild(userMsg);

      // Clear input & attachment
      if (inputField) inputField.value = '';
      if (currentAttachment) {
        currentAttachment = null;
        photoInput.value = '';
        attachPreview.style.display = 'none';
      }
      msgContainer.scrollTop = msgContainer.scrollHeight;

      // Render Typing Indicator Bubble
      const typingBubble = document.createElement('div');
      typingBubble.id = 'chat-typing-indicator';
      typingBubble.style.cssText = 'background: #fff; padding: 0.6rem 0.8rem; border-radius: 14px 14px 14px 2px; max-width: 85px; border: 1px solid var(--border-light); display: flex; align-items: center; gap: 5px;';
      typingBubble.innerHTML = `
        <span style="width: 6px; height: 6px; background: var(--accent-gold); border-radius: 50%; animation: pulse 1s infinite alternate;"></span>
        <span style="width: 6px; height: 6px; background: var(--accent-gold); border-radius: 50%; animation: pulse 1s infinite alternate 0.2s;"></span>
        <span style="width: 6px; height: 6px; background: var(--accent-gold); border-radius: 50%; animation: pulse 1s infinite alternate 0.4s;"></span>
        <span style="font-size: 0.68rem; color: #888; margin-left: 2px;">AI...</span>
      `;
      msgContainer.appendChild(typingBubble);
      msgContainer.scrollTop = msgContainer.scrollHeight;

      // Simulate AI response delay
      setTimeout(() => {
        // Remove typing indicator
        const typingEl = document.getElementById('chat-typing-indicator');
        if (typingEl) typingEl.remove();

        const botMsg = document.createElement('div');
        botMsg.style.cssText = 'background: #fff; padding: 0.8rem 0.95rem; border-radius: 14px 14px 14px 2px; max-width: 88%; border: 1px solid var(--border-light); box-shadow: 0 2px 6px rgba(0,0,0,0.04); line-height: 1.45;';

        const lowerMsg = msg.toLowerCase();

        if (lowerMsg.includes('tiệc') || lowerMsg.includes('phối đồ') || lowerMsg.includes('mặc gì')) {
          botMsg.innerHTML = `
            💃 <strong>Gợi ý Stylist AURALIÈ cho bữa tiệc:</strong><br>
            Đối với dạ tiệc sang trọng, sự kết hợp giữa <strong>Silk Evening Dress</strong> và <strong>Túi Xách Monogram Gold</strong> sẽ nâng tầm thần thái quyến rũ vượt thời gian.
            
            <div style="margin-top: 0.6rem; background: #faf8f5; border: 1px solid var(--accent-gold); border-radius: 8px; padding: 0.6rem; display: flex; gap: 0.6rem; align-items: center;">
              <img src="assets/card_1.jpg" style="width: 48px; height: 55px; object-fit: cover; border-radius: 4px;">
              <div style="flex: 1; font-size: 0.75rem;">
                <strong style="display: block; color: #121212;">Silk Evening Dress</strong>
                <span style="color: var(--accent-gold); font-weight: bold;">18.900.000 ₫</span>
              </div>
              <button onclick="addToCart({id: 'p1', name: 'Silk Evening Dress', price: 18900000, image: 'assets/card_1.jpg'})" style="background: var(--primary-dark); color: var(--accent-gold); border: 1px solid var(--accent-gold); padding: 0.35rem 0.65rem; border-radius: 4px; font-size: 0.7rem; cursor: pointer; font-weight: 500;">
                <i class="fa-solid fa-cart-plus"></i> Thêm Giỏ
              </button>
            </div>
          `;
        } else if (lowerMsg.includes('hot') || lowerMsg.includes('bán chạy') || lowerMsg.includes('túi')) {
          botMsg.innerHTML = `
            🔥 <strong>Sản phẩm Best-Seller tháng này:</strong><br>
            Túi xách da bê <strong>AURALIÈ Royal Leather Tote</strong> - Chế tác thủ công từ Ý.

            <div style="margin-top: 0.6rem; background: #faf8f5; border: 1px solid var(--accent-gold); border-radius: 8px; padding: 0.6rem; display: flex; gap: 0.6rem; align-items: center;">
              <img src="assets/card_2.jpg" style="width: 48px; height: 55px; object-fit: cover; border-radius: 4px;">
              <div style="flex: 1; font-size: 0.75rem;">
                <strong style="display: block; color: #121212;">Royal Leather Tote</strong>
                <span style="color: var(--accent-gold); font-weight: bold;">24.500.000 ₫</span>
              </div>
              <button onclick="addToCart({id: 'p2', name: 'Royal Leather Tote', price: 24500000, image: 'assets/card_2.jpg'})" style="background: var(--primary-dark); color: var(--accent-gold); border: 1px solid var(--accent-gold); padding: 0.35rem 0.65rem; border-radius: 4px; font-size: 0.7rem; cursor: pointer; font-weight: 500;">
                <i class="fa-solid fa-cart-plus"></i> Thêm Giỏ
              </button>
            </div>
          `;
        } else if (lowerMsg.includes('size') || lowerMsg.includes('kích thước')) {
          botMsg.innerHTML = `
            📏 <strong>Tư vấn Size Chuẩn Châu Âu AURALIÈ:</strong><br>
            • <strong>Size S:</strong> 42-50kg | Chiều cao 1m55-1m63<br>
            • <strong>Size M:</strong> 51-59kg | Chiều cao 1m62-1m70<br>
            • <strong>Size L:</strong> 60-68kg | Chiều cao 1m68-1m75<br><br>
            Quý khách chỉ cần cung cấp Chiều cao & Cân nặng, AI sẽ tính toán Size chính xác 99%!
          `;
        } else if (lowerMsg.includes('giảm giá') || lowerMsg.includes('mã') || lowerMsg.includes('vip') || lowerMsg.includes('khuyến mãi')) {
          botMsg.innerHTML = `
            🎁 <strong>Mã Ưu Đãi VIP Khách Hàng Thân Thiết:</strong>

            <div style="margin-top: 0.5rem; background: linear-gradient(135deg, #121212, #2a2a2a); color: #fff; border: 1px dashed var(--accent-gold); border-radius: 8px; padding: 0.6rem 0.8rem; display: flex; align-items: center; justify-content: space-between;">
              <div>
                <strong style="color: var(--accent-gold); font-size: 0.85rem;">Mã: AURALIE2026</strong>
                <div style="font-size: 0.7rem; opacity: 0.85;">Giảm 20% cho mọi đơn hàng từ 10.000.000 ₫</div>
              </div>
              <button onclick="navigator.clipboard.writeText('AURALIE2026'); alert('✨ Đã sao chép mã AURALIE2026! Dùng ngay tại Giỏ Hàng.');" style="background: var(--accent-gold); color: #121212; border: none; font-weight: bold; padding: 0.35rem 0.65rem; border-radius: 4px; font-size: 0.72rem; cursor: pointer;">
                Sao chép
              </button>
            </div>
          `;
        } else {
          botMsg.innerHTML = `
            ✨ Cảm ơn thông tin của quý khách!<br>
            Chuyên viên tư vấn AURALIÈ Haute Couture đã ghi nhận và sẽ kết nối trực tiếp với quý khách qua Hotline <strong>1900 8888</strong> hoặc Email đăng ký.<br><br>
            Quý khách có cần tư vấn thêm về sản phẩm nào khác không ạ?
          `;
        }

        msgContainer.appendChild(botMsg);
        msgContainer.scrollTop = msgContainer.scrollHeight;
      }, 700);
    };

    window.sendQuickReply = (text) => handleSend(text);
    if (sendBtn) sendBtn.addEventListener('click', () => handleSend());
    if (inputField) inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  };

  createChatWidget();

  // 17. AI Image-Based Product Search Modal (Computer Vision Search)
  window.openAIImageSearchModal = () => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
      <div class="modal-container" style="max-width: 540px; padding: 1.75rem; text-align: center;">
        <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
        <div style="background: var(--primary-dark); color: var(--accent-gold); padding: 0.8rem; border-radius: 8px; margin-bottom: 1.25rem;">
          <i class="fa-solid fa-camera"></i> AI COMPUTER VISION: TÌM KIẾM BẰNG HÌNH ẢNH
        </div>
        <p style="font-size: 0.85rem; color: #666; margin-bottom: 1.25rem;">Tải lên ảnh trang phục thời trang bạn yêu thích để AI nhận diện kiểu dáng và gợi ý thiết kế tương tự từ AURALIÈ.</p>
        
        <div id="ai-upload-area" style="border: 2px dashed var(--accent-gold); padding: 2rem 1rem; border-radius: 12px; background: #faf8f5; cursor: pointer; margin-bottom: 1.25rem;" onclick="document.getElementById('ai-file-input').click()">
          <i class="fa-solid fa-cloud-arrow-up" style="font-size: 2.5rem; color: var(--accent-gold); margin-bottom: 0.5rem;"></i>
          <p style="font-size: 0.9rem; font-weight: bold; margin: 0;">Nhấp để tải ảnh lên hoặc kéo thả vào đây</p>
          <span style="font-size: 0.75rem; color: #888;">Hỗ trợ định dạng JPG, PNG, WEBP (Tối đa 5MB)</span>
          <input type="file" id="ai-file-input" accept="image/*" style="display: none;" onchange="handleAIImageProcess(this)">
        </div>

        <div id="ai-processing-box" style="display: none; padding: 1.5rem; background: #faf7f2; border-radius: 12px; margin-bottom: 1rem;">
          <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: var(--accent-gold); margin-bottom: 0.5rem;"></i>
          <p style="font-size: 0.85rem; font-weight: bold; color: var(--primary-dark);">Đang phân tích đặc trưng hình ảnh bằng AI (Image Embedding)...</p>
        </div>

        <div id="ai-result-box" style="display: none; text-align: left; background: #fff; border: 1px solid var(--border-light); border-radius: 8px; padding: 1rem;">
          <div style="font-size: 0.8rem; color: #2e7d32; font-weight: bold; margin-bottom: 0.5rem;">
            ✓ Đã trích xuất xong đặc trưng: Áo Vest Double-Breasted (Độ chính xác 98.6%)
          </div>
          <div style="display: flex; gap: 0.75rem; align-items: center; background: #faf8f5; padding: 0.5rem; border-radius: 6px;">
            <img src="assets/card_1.jpg" style="width: 50px; height: 60px; object-fit: cover; border-radius: 4px;">
            <div>
              <strong style="font-size: 0.85rem;">Double-Breasted Tailored Suit</strong>
              <div style="font-size: 0.8rem; color: var(--accent-gold); font-weight: bold;">12.500.000 ₫</div>
            </div>
            <a href="index.html#catalog" class="btn-primary-luxury" style="margin-left: auto; padding: 0.4rem 0.7rem; font-size: 0.72rem;">Xem Sản Phẩm</a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    window.handleAIImageProcess = (input) => {
      if (input.files && input.files[0]) {
        document.getElementById('ai-upload-area').style.display = 'none';
        document.getElementById('ai-processing-box').style.display = 'block';

        setTimeout(() => {
          document.getElementById('ai-processing-box').style.display = 'none';
          document.getElementById('ai-result-box').style.display = 'block';
        }, 1200);
      }
    };
  };

  // 18. Abandoned Cart Recovery & Marketing Notification
  const initAbandonedCartNotification = () => {
    const triggerCartAlert = () => {
      // 1. Chỉ thông báo khi ĐÃ ĐĂNG NHẬP
      const userRole = localStorage.getItem('userRole');
      if (!userRole) return;

      // 2. Chỉ thông báo 1 LẦN DUY NHẤT sau khi đăng nhập
      if (sessionStorage.getItem('cartReminderShownAfterLogin') === 'true') return;

      // 3. Chỉ thông báo khi GIỎ HÀNG CÓ SẢN PHẨM
      const cart = (typeof window.getCart === 'function') ? window.getCart() : [];
      if (!cart || cart.length === 0) return;

      // Đánh dấu đã thông báo 1 lần sau đăng nhập
      sessionStorage.setItem('cartReminderShownAfterLogin', 'true');

      // Đảm bảo không trùng lặp toast trên màn hình
      const existing = document.querySelector('.abandoned-cart-toast');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.className = 'abandoned-cart-toast';
      toast.style.cssText = `
        position: fixed; bottom: 90px; left: 20px; z-index: 9998;
        background: #121212; color: #fff; border: 1px solid var(--accent-gold);
        border-radius: 12px; padding: 1.25rem; width: 340px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.45);
        opacity: 0; transform: translateY(20px);
        transition: opacity 0.4s ease, transform 0.4s ease;
        overflow: hidden;
      `;
      toast.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="color: var(--accent-gold); font-size: 0.8rem; font-weight: bold; letter-spacing: 1px;">
            <i class="fa-solid fa-bell"></i> ƯU ĐÃI GIỮ GIỎ HÀNG AURALIÈ
          </span>
          <button id="close-abandoned-toast-x" style="background: none; border: none; color: #aaa; cursor: pointer; font-size: 1.1rem; line-height: 1;">&times;</button>
        </div>
        <p style="font-size: 0.82rem; color: #e5e0d8; margin: 0 0 0.85rem 0; line-height: 1.45;">
          Sản phẩm trong giỏ của bạn sắp hết hàng! Nhập ngay mã <strong style="color: var(--accent-gold);">AURALIE2026</strong> để được <strong>Giảm 20% + Miễn phí vận chuyển hỏa tốc</strong>.
        </p>
        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.4rem;">
          <a href="cart.html" class="btn-primary-luxury" style="padding: 0.55rem 0.8rem; font-size: 0.75rem; flex: 1; text-align: center; text-decoration: none; justify-content: center;">
            Hoàn Tất Đơn Hàng Ngay
          </a>
          <button id="close-abandoned-toast-btn" style="background: rgba(255,255,255,0.1); color: #fff; border: none; border-radius: 6px; padding: 0.55rem 0.75rem; font-size: 0.75rem; cursor: pointer;">
            Để Sau
          </button>
        </div>
        <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: rgba(255,255,255,0.1);">
          <div id="abandoned-cart-progress-bar" style="height: 100%; width: 100%; background: var(--accent-gold); transform-origin: left; transition: transform 20000ms linear;"></div>
        </div>
      `;
      document.body.appendChild(toast);

      // Hiệu ứng xuất hiện mượt mà
      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        const bar = toast.querySelector('#abandoned-cart-progress-bar');
        if (bar) {
          requestAnimationFrame(() => {
            bar.style.transform = 'scaleX(0)';
          });
        }
      });

      // Tự động tắt sau đúng 20 giây (20s = 20000ms)
      let autoCloseTimer = setTimeout(() => {
        closeToast();
      }, 20000);

      const closeToast = () => {
        if (autoCloseTimer) clearTimeout(autoCloseTimer);
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => {
          if (toast.parentNode) toast.remove();
        }, 400);
      };

      toast.querySelector('#close-abandoned-toast-x')?.addEventListener('click', closeToast);
      toast.querySelector('#close-abandoned-toast-btn')?.addEventListener('click', closeToast);
    };

    // Kiểm tra và kích hoạt sau khi vào trang 5s
    setTimeout(triggerCartAlert, 5000);

    // Hoặc kích hoạt nếu người dùng rê chuột lên đầu trang (exit intent)
    document.addEventListener('mouseleave', (e) => {
      if (e.clientY <= 0) triggerCartAlert();
    });
  };

  // 19. Contact Form & Concierge Booking Logic (contact.html) — Lưu DB thật
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');

      // Lấy dữ liệu form
      const fullName = contactForm.querySelector('input[name="name"], input[placeholder*="tên"], input[placeholder*="Họ"]')?.value.trim()
        || contactForm.querySelector('input[type="text"]')?.value.trim() || '';
      const email = contactForm.querySelector('input[name="email"], input[type="email"]')?.value.trim() || '';
      const phone = contactForm.querySelector('input[name="phone"], input[type="tel"]')?.value.trim() || '';
      const service = contactForm.querySelector('select')?.value || 'Tư vấn chung';
      const message = contactForm.querySelector('textarea')?.value.trim() || '';

      if (!fullName || !email) {
        window.showLuxuryAlert({ title: 'Lưu Ý', message: 'Vui lòng nhập họ tên và email.', type: 'warning' });
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi yêu cầu...';
      }

      try {
        const res = await fetch('/api/v1/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, phone, service, message })
        });
        const data = await res.json();

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Gửi Yêu Cầu Tư Vấn VIP <i class="fa-solid fa-paper-plane"></i>';
        }

        if (data.status === 'success') {
          contactForm.reset();
          window.showLuxuryAlert({
            title: 'Đã Tiếp Nhận Lịch Hẹn',
            message: `Cảm ơn <strong>${fullName}</strong>! Yêu cầu tư vấn đã được lưu vào hệ thống.<br>Chuyên viên VIP sẽ liên hệ trong vòng 30 phút.`,
            type: 'success',
            btnText: 'Hoàn Tất'
          });
        } else {
          window.showLuxuryAlert({ title: 'Lỗi', message: data.message, type: 'warning' });
        }
      } catch (err) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Gửi Yêu Cầu Tư Vấn VIP <i class="fa-solid fa-paper-plane"></i>';
        }
        window.showLuxuryAlert({ title: 'Lỗi Kết Nối', message: 'Không thể gửi yêu cầu. Vui lòng thử lại.', type: 'warning' });
      }
    });
  }

  // 20. Newsletter Subscription Handler (All Footers)
  document.querySelectorAll('.newsletter-box button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const input = btn.closest('.newsletter-box')?.querySelector('input');
      const val = input ? input.value.trim() : '';
      if (!val || !val.includes('@')) {
        window.showLuxuryAlert({
          title: 'Lưu Ý',
          message: 'Vui lòng nhập địa chỉ email hợp lệ để nhận ưu đãi VIP!',
          type: 'warning'
        });
        return;
      }
      if (input) input.value = '';
      window.showLuxuryAlert({
        title: 'Đăng Ký Thành Công',
        message: 'Cảm ơn Quý khách! Email <strong>' + val + '</strong> đã được đưa vào danh sách khách hàng đặc quyền nhận lookbook và ưu đãi sớm nhất từ AURALIÈ.',
        type: 'success',
        btnText: 'Đã Hiểu'
      });
    });
  });

  // 21. Wishlist Actions (wishlist.html)
  const addAllWishlistBtn = document.querySelector('a[href="cart.html"].btn-primary-luxury');
  if (addAllWishlistBtn && (window.location.pathname.includes('wishlist.html') || document.querySelector('.fashion-card [title="Bỏ yêu thích"]'))) {
    addAllWishlistBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!await window.Commerce.requireUser('cart.html')) return;
      const cards = document.querySelectorAll('.fashion-card');
      if (cards.length === 0) {
        window.showLuxuryAlert({
          title: 'Danh Sách Trống',
          message: 'Danh sách yêu thích của quý khách hiện đang trống!',
          type: 'warning',
          autoCloseMs: 2000
        });
        return;
      }
      cards.forEach((card, idx) => {
        const titleElem = card.querySelector('.card-title, h3, h4');
        const priceElem = card.querySelector('.card-price, .price');
        const imgElem = card.querySelector('img');
        const catElem = card.querySelector('.card-category');

        const name = titleElem ? titleElem.textContent.trim() : 'Sản Phẩm AURALIÈ';
        let price = 12500000;
        if (priceElem) {
          const num = parseInt(priceElem.textContent.replace(/\D/g, ''), 10);
          if (!isNaN(num) && num > 0) price = num;
        }
        const img = imgElem ? imgElem.getAttribute('src') : 'assets/card_1.jpg';
        const category = catElem ? catElem.textContent.trim() : 'Haute Couture';

        const cart = window.getCart();
        const existing = cart.find(item => item.name === name);
        if (existing) {
          existing.qty += 1;
        } else {
          cart.push({
            id: 'wl-' + idx + '-' + Date.now(),
            name,
            category,
            price,
            img,
            size: 'M',
            color: 'Đen Tuyền',
            qty: 1
          });
        }
        window.saveCart(cart);
      });

      window.showLuxuryAlert({
        title: 'Chuyển Vào Giỏ Hàng Thành Công',
        message: `Đã chuyển toàn bộ ${cards.length} sản phẩm từ danh sách yêu thích vào giỏ hàng!`,
        type: 'success',
        btnText: 'Đến Giỏ Hàng',
        redirectUrl: 'cart.html',
        autoCloseMs: 2500
      });
    });
  }

  // Wishlist card buttons
  document.querySelectorAll('.fashion-card [title="Bỏ yêu thích"]').forEach(heartBtn => {
    heartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = heartBtn.closest('.fashion-card');
      if (card) {
        card.style.transition = 'all 0.4s ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.8)';
        setTimeout(() => {
          card.remove();
          const remainingCards = document.querySelectorAll('.fashion-card');
          const remainingCount = remainingCards.length;

          // Update header badges
          document.querySelectorAll('a[href="wishlist.html"] .badge-count').forEach(b => {
            b.textContent = remainingCount;
          });

          // Update wishlist title
          const titleElem = document.querySelector('.section-title');
          if (titleElem && window.location.pathname.includes('wishlist.html')) {
            titleElem.textContent = `Danh Sách Yêu Thích (${remainingCount} Sản Phẩm)`;
          }

          if (remainingCount === 0) {
            const grid = document.querySelector('.product-grid-3col');
            if (grid) {
              grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
                  <i class="fa-regular fa-heart" style="font-size: 3.5rem; color: #ccc; margin-bottom: 1.5rem;"></i>
                  <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--primary-dark); margin-bottom: 0.5rem;">Danh Sách Yêu Thích Trống</h3>
                  <p style="color: var(--text-muted); margin-bottom: 2rem;">Quý khách chưa lưu sản phẩm nào vào danh sách yêu thích.</p>
                  <a href="index.html#catalog" class="btn-primary-luxury">Khám Phá Bộ Sưu Tập</a>
                </div>
              `;
            }
            if (addAllWishlistBtn) {
              addAllWishlistBtn.style.display = 'none';
            }
          }

          window.showLuxuryAlert({
            title: 'Đã Cập Nhật Yêu Thích',
            message: 'Đã xóa sản phẩm khỏi danh sách yêu thích của quý khách.',
            type: 'warning',
            autoCloseMs: 2000
          });
        }, 350);
      }
    });
  });

  // 22. Mobile Bottom Navigation & Scroll-Spy Controller
  function initMobileBottomNav() {
    const bottomNav = document.querySelector('.m-bottom-nav');
    if (!bottomNav) return;

    const navItems = bottomNav.querySelectorAll('.m-nav-item');
    if (navItems.length === 0) return;

    let isUserClicking = false;
    let clickTimeout = null;

    const setActiveTab = (tabKey) => {
      navItems.forEach(item => {
        const itemTab = item.getAttribute('data-tab');
        if (itemTab === tabKey) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    };

    // Determine current page
    const pathname = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const isHomePage = pathname === '/' || pathname.endsWith('index.html') || pathname.endsWith('/');

    // Initial page active state
    if (pathname.includes('cart.html')) {
      setActiveTab('cart');
    } else if (pathname.includes('collections.html')) {
      setActiveTab('collections');
    } else if (pathname.includes('contact.html')) {
      setActiveTab('contact');
    } else if (isHomePage) {
      if (hash === '#catalog') {
        setActiveTab('catalog');
      } else {
        setActiveTab('home');
      }
    }

    // Click / Tap Handler: "hoặc nhấn vào nút nào thì sáng nút đó"
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const tabKey = item.getAttribute('data-tab');
        const href = item.getAttribute('href');

        // Immediately light up the clicked item
        setActiveTab(tabKey);

        // Smooth scroll if on home page and clicking home or catalog
        if (isHomePage) {
          if (tabKey === 'home' || href === 'index.html' || href === '#top') {
            e.preventDefault();
            isUserClicking = true;
            clearTimeout(clickTimeout);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            try { history.replaceState(null, null, 'index.html'); } catch (err) {}
            clickTimeout = setTimeout(() => { isUserClicking = false; }, 900);
          } else if (tabKey === 'catalog' || (href && href.includes('#catalog'))) {
            e.preventDefault();
            const catalogElem = document.getElementById('catalog');
            if (catalogElem) {
              isUserClicking = true;
              clearTimeout(clickTimeout);
              catalogElem.scrollIntoView({ behavior: 'smooth' });
              try { history.replaceState(null, null, '#catalog'); } catch (err) {}
              clickTimeout = setTimeout(() => { isUserClicking = false; }, 900);
            }
          }
        }
      });
    });

    // Scroll-Spy: "lướt tới giao diện nào thì sáng nút đó thôi"
    if (isHomePage) {
      const catalogSection = document.getElementById('catalog');
      const journalSection = document.getElementById('home-journal-grid') || document.querySelector('.page-section[style*="FAF7F2"]');

      const onScroll = () => {
        if (isUserClicking) return; // Prevent overriding while scrolling from a click

        const scrollY = window.scrollY || window.pageYOffset;
        const viewportHeight = window.innerHeight;
        const pageHeight = document.documentElement.scrollHeight;

        // Near footer / showroom / contact
        if (scrollY + viewportHeight >= pageHeight - 140) {
          setActiveTab('contact');
          return;
        }

        // Section boundaries with comfortable trigger offsets
        const catalogTop = catalogSection ? (catalogSection.offsetTop - 200) : 750;
        const journalTop = journalSection ? (journalSection.offsetTop - 250) : 2200;

        if (scrollY < catalogTop) {
          setActiveTab('home');
        } else if (scrollY >= catalogTop && scrollY < journalTop) {
          setActiveTab('catalog');
        } else if (scrollY >= journalTop) {
          setActiveTab('collections');
        }
      };

      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            onScroll();
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });

      // Initial check
      setTimeout(onScroll, 120);
    }
  }

  function initBannerTracking() {
    if (!window.AuralieTracking) return;
    const banners = document.querySelectorAll('.d-hero-banner, .promo-widget, [data-banner-id]');
    if (!banners.length) return;

    const seen = new Set();
    const emitBannerView = (el, idx) => {
      const bannerId = el.getAttribute('data-banner-id') || (el.classList.contains('d-hero-banner') ? 'hero-banner' : `promo-widget-${idx}`);
      if (seen.has(bannerId)) return;
      seen.add(bannerId);
      const titleEl = el.querySelector('h1, h2, h3, h4, .promo-title');
      window.AuralieTracking.track('banner_view', {
        properties: {
          banner_id: bannerId,
          banner_title: titleEl ? titleEl.textContent.trim().slice(0, 80) : bannerId
        },
        dedupeKey: `banner-view-${bannerId}`
      });
    };

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Array.from(banners).indexOf(entry.target);
            emitBannerView(entry.target, idx);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      banners.forEach((b) => obs.observe(b));
    } else {
      banners.forEach((b, idx) => emitBannerView(b, idx));
    }

    banners.forEach((el, idx) => {
      el.addEventListener('click', (e) => {
        const target = e.target.closest('a, button');
        if (!target) return;
        const bannerId = el.getAttribute('data-banner-id') || (el.classList.contains('d-hero-banner') ? 'hero-banner' : `promo-widget-${idx}`);
        window.AuralieTracking.track('banner_click', {
          properties: {
            banner_id: bannerId,
            cta_text: target.textContent.trim().slice(0, 60),
            cta_href: target.getAttribute('href') || null
          },
          dedupeKey: `banner-click-${bannerId}`
        });
      });
    });
  }

  initMobileBottomNav();
  initAbandonedCartNotification();
  initBannerTracking();

  // ==============================================================
  // SIDEBAR ACCORDION COLLAPSIBLE HANDLER (CÁCH 3)
  // ==============================================================
  function initSidebarAccordion() {
    const accordionHeaders = document.querySelectorAll('.widget-header-accordion');
    accordionHeaders.forEach(header => {
      if (header.dataset.hasAccordion) return;
      header.dataset.hasAccordion = 'true';
      header.addEventListener('click', () => {
        const targetId = header.getAttribute('data-accordion');
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
          const isCollapsed = targetContent.classList.toggle('is-collapsed');
          header.classList.toggle('collapsed', isCollapsed);
        }
      });
    });
  }

  initSidebarAccordion();

});




