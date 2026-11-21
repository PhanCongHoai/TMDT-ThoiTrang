/**
 * AURALIÈ Haute Couture - Shipper Concierge Portal Simulation JS
 * Tương tác thời gian thực với backend Express & Microsoft SQL Server
 */

(function () {
  'use strict';

  // State
  let currentTab = 'ready';
  let searchQuery = '';
  let ordersList = [];
  let statsData = {};
  let isOnline = true;
  let activeGpsOrder = null;
  let gpsTimer = null;
  let activeDeliverOrder = null;
  let activeFailOrder = null;

  // Sound Synthesizer via Web Audio API (không phụ thuộc file ngoài)
  const SoundFX = {
    ctx: null,
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
    },
    playTone(freq, type = 'sine', duration = 0.15, delay = 0) {
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
      } catch (e) {
        // Audio policy muted
      }
    },
    pickupChime() {
      this.playTone(523.25, 'triangle', 0.12, 0);      // C5
      this.playTone(659.25, 'triangle', 0.25, 0.12);   // E5
    },
    gpsArrivalChime() {
      this.playTone(587.33, 'sine', 0.15, 0);          // D5
      this.playTone(880.00, 'sine', 0.35, 0.15);       // A5
    },
    successFanfare() {
      this.playTone(523.25, 'triangle', 0.1, 0);       // C5
      this.playTone(659.25, 'triangle', 0.1, 0.1);     // E5
      this.playTone(783.99, 'triangle', 0.1, 0.2);     // G5
      this.playTone(1046.50, 'triangle', 0.4, 0.3);    // C6
    }
  };

  // Toast UI
  function showToast(message, type = 'success') {
    const toast = document.getElementById('shp-toast');
    const msg = document.getElementById('shp-toast-msg');
    if (!toast || !msg) return;

    msg.textContent = message;
    toast.className = `shp-toast show ${type}`;
    if (type === 'success') {
      toast.querySelector('i').className = 'fa-solid fa-circle-check';
    } else {
      toast.querySelector('i').className = 'fa-solid fa-triangle-exclamation';
    }

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // API Call helper
  async function api(path, options = {}) {
    const url = path.startsWith('http') ? path : path;
    const defaultHeaders = { 'Content-Type': 'application/json' };
    const res = await fetch(url, {
      ...options,
      headers: { ...defaultHeaders, ...(options.headers || {}) }
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Lỗi xử lý yêu cầu từ máy chủ');
    }
    return json;
  }

  // Load KPI Stats
  async function loadStats() {
    try {
      const res = await api('/api/v1/shipper/stats');
      if (res.status === 'success' && res.data) {
        statsData = res.data;
        document.getElementById('kpi-ready').textContent = statsData.readyCount || 0;
        document.getElementById('kpi-shipping').textContent = statsData.shippingCount || 0;
        document.getElementById('kpi-completed').textContent = statsData.completedCount || 0;
        document.getElementById('kpi-cod').textContent = (Number(statsData.codCollected) || 0).toLocaleString('vi-VN') + ' ₫';

        document.getElementById('tab-cnt-ready').textContent = statsData.readyCount || 0;
        document.getElementById('tab-cnt-shipping').textContent = statsData.shippingCount || 0;
        document.getElementById('tab-cnt-completed').textContent = statsData.completedCount || 0;

        if (statsData.driver) {
          document.getElementById('driver-name').innerHTML = `${statsData.driver.name} <span style="font-size:0.75rem; color:var(--shp-gold);">(${statsData.driver.id})</span>`;
          document.getElementById('driver-vehicle').innerHTML = `<i class="fa-solid fa-motorcycle"></i> ${statsData.driver.vehicle}`;
          document.getElementById('driver-rating').innerHTML = `<i class="fa-solid fa-star"></i> ${statsData.driver.rating} • ${statsData.driver.ratingCount} đơn thành công`;
        }
      }
    } catch (err) {
      console.warn('Không thể tải thống kê KPI shipper:', err.message);
    }
  }

  // Load Orders
  async function loadOrders() {
    const container = document.getElementById('orders-container');
    if (!container) return;

    try {
      const queryParam = new URLSearchParams({
        tab: currentTab,
        search: searchQuery
      }).toString();

      const res = await api(`/api/v1/shipper/orders?${queryParam}`);
      ordersList = res.data || [];
      renderOrders();
    } catch (err) {
      container.innerHTML = `
        <div class="shp-empty">
          <i class="fa-solid fa-triangle-exclamation" style="color:var(--shp-danger);"></i>
          <h3>Không thể tải danh sách đơn hàng</h3>
          <p>${err.message}</p>
          <button class="btn-action" style="margin: 14px auto 0; background: var(--shp-primary); color:#000;" onclick="loadOrders()">
            <i class="fa-solid fa-rotate"></i> Thử lại
          </button>
        </div>
      `;
    }
  }

  // Render Orders to DOM
  function renderOrders() {
    const container = document.getElementById('orders-container');
    if (!container) return;

    if (!ordersList.length) {
      container.innerHTML = `
        <div class="shp-empty">
          <i class="fa-solid fa-box-archive"></i>
          <h3>Không có đơn hàng nào</h3>
          <p>${currentTab === 'ready' ? 'Hiện tại không có đơn nào đang chờ nhận lấy hàng.' : 'Không có dữ liệu trong mục này.'}</p>
          <button class="btn-create-sim" style="margin: 14px auto 0;" onclick="createSimulatedOrder()">
            <i class="fa-solid fa-plus"></i> Tạo 1 Đơn Mới Để Thử Nghiệm
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = ordersList.map(order => {
      const isReady = ['CONFIRMED', 'PROCESSING'].includes(order.status);
      const isShipping = order.status === 'SHIPPED';
      const isCompleted = order.status === 'COMPLETED';
      const isCancelled = order.status === 'CANCELLED';

      let statusBadgeHtml = '';
      if (isReady) {
        statusBadgeHtml = `<span class="status-badge ready"><i class="fa-solid fa-clock"></i> CHỜ LẤY HÀNG</span>`;
      } else if (isShipping) {
        statusBadgeHtml = `<span class="status-badge shipping"><i class="fa-solid fa-truck-fast"></i> ĐANG GIAO HÀNG</span>`;
      } else if (isCompleted) {
        statusBadgeHtml = `<span class="status-badge completed"><i class="fa-solid fa-circle-check"></i> ĐÃ GIAO XONG</span>`;
      } else {
        statusBadgeHtml = `<span class="status-badge cancelled"><i class="fa-solid fa-ban"></i> ĐÃ HỦY / HOÀN KHO</span>`;
      }

      const totalFormatted = (Number(order.totalAmount) || 0).toLocaleString('vi-VN') + ' ₫';
      const isCod = order.isCod;
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.shippingAddress)}`;

      return `
        <div class="shp-order-card" id="order-card-${order.id}">
          <div class="card-top">
            <div class="card-code-wrap">
              <span class="order-code-title">
                <i class="fa-solid fa-receipt" style="color:var(--shp-primary); font-size:0.85rem;"></i>
                ${order.orderCode}
              </span>
              <span class="tracking-code-sub">Vận đơn: <strong>${order.trackingCode}</strong></span>
            </div>
            ${statusBadgeHtml}
          </div>

          <!-- Customer Info -->
          <div class="cust-info-block">
            <div class="cust-header-row">
              <div class="cust-name">
                <i class="fa-solid fa-user" style="color:var(--shp-gold);"></i>
                ${order.customerName}
              </div>
              <a href="tel:${order.phoneNumber}" class="btn-call-cust">
                <i class="fa-solid fa-phone"></i> Gọi Khách
              </a>
            </div>
            <div class="cust-address">
              <i class="fa-solid fa-location-dot"></i>
              <div>
                <span>${order.shippingAddress}</span>
                <div style="margin-top: 4px;">
                  <a href="${mapsUrl}" target="_blank" style="color: var(--shp-primary); font-size: 0.72rem; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                    <i class="fa-solid fa-map-location-dot"></i> Mở Google Maps Chỉ Đường
                  </a>
                </div>
              </div>
            </div>
            <div class="route-telemetry">
              <span class="route-km">
                <i class="fa-solid fa-route"></i> Khoảng cách: ${order.distanceKm} km
              </span>
              <span class="route-eta">
                <i class="fa-solid fa-stopwatch"></i> Dự kiến: ${order.estimatedTime}
              </span>
            </div>
          </div>

          <!-- Payment Strip -->
          <div class="payment-strip ${isCod ? 'cod' : 'paid'}">
            <div class="pay-label">
              <i class="fa-solid ${isCod ? 'fa-hand-holding-dollar' : 'fa-credit-card'}"></i>
              ${isCod ? 'THU TIỀN MẶT COD:' : 'ĐÃ THANH TOÁN TRƯỚC:'}
            </div>
            <div class="pay-amount">
              ${isCod ? totalFormatted : '0 ₫ (Đã trả ' + totalFormatted + ')'}
            </div>
          </div>

          <!-- Items Accordion -->
          <div class="items-accordion">
            <button class="items-accordion-btn" onclick="toggleItemsAccordion(${order.id})">
              <span><i class="fa-solid fa-box"></i> Chi tiết kiện hàng (${order.items.length} mặt hàng)</span>
              <i class="fa-solid fa-chevron-down" id="chevron-${order.id}"></i>
            </button>
            <div class="items-list" id="items-list-${order.id}">
              ${order.items.map(it => `
                <div class="item-row">
                  <span>${it.name} (${it.size} / ${it.color})</span>
                  <span style="font-weight:700;">x${it.quantity}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Actions Grid -->
          <div class="card-actions-grid ${isShipping ? 'multi' : ''}">
            ${isReady ? `
              <button class="btn-action btn-pickup" onclick="handlePickupOrder(${order.id})">
                <i class="fa-solid fa-box-open"></i> NHẬN ĐƠN & LẤY HÀNG TẠI KHO
              </button>
            ` : ''}

            ${isShipping ? `
              <button class="btn-action btn-simulate-gps" onclick="openGpsModal(${order.id})">
                <i class="fa-solid fa-compass"></i> Mô Phỏng Lộ Trình
              </button>
              <button class="btn-action btn-deliver" onclick="openDeliverModal(${order.id})">
                <i class="fa-solid fa-circle-check"></i> Xác Nhận Đã Giao
              </button>
              <button class="btn-action btn-fail" style="grid-column: 1 / -1;" onclick="openFailModal(${order.id})">
                <i class="fa-solid fa-phone-slash"></i> Báo Sự Cố / Hẹn Lại / Khách Từ Chối
              </button>
            ` : ''}

            ${isCompleted ? `
              <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 10px; text-align: center; color: #059669; font-size: 0.8rem; font-weight: 700;">
                <i class="fa-solid fa-badge-check"></i> Đơn hàng đã giao thành công và hoàn tất đối soát!
              </div>
            ` : ''}

            ${isCancelled ? `
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 10px; text-align: center; color: #dc2626; font-size: 0.8rem; font-weight: 700;">
                <i class="fa-solid fa-triangle-exclamation"></i> Đơn hàng đã hủy và hoàn trả về kho AURALIÈ.
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // Toggle Items Accordion
  window.toggleItemsAccordion = (orderId) => {
    const list = document.getElementById(`items-list-${orderId}`);
    const chevron = document.getElementById(`chevron-${orderId}`);
    if (list) {
      list.classList.toggle('open');
      if (chevron) {
        chevron.style.transform = list.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
      }
    }
  };

  // Switch Filter Tab
  window.switchTab = (tab) => {
    currentTab = tab;
    document.querySelectorAll('.shp-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.shp-kpi-box').forEach(box => {
      box.classList.remove('active');
    });
    loadOrders();
  };

  // Toggle Driver Status
  window.toggleDriverOnline = () => {
    isOnline = !isOnline;
    const badge = document.querySelector('.shp-badge-online');
    if (badge) {
      if (isOnline) {
        badge.innerHTML = '<span class="pulse-dot"></span> ĐANG TRỰC TUYẾN';
        badge.style.color = '#34d399';
        showToast('Bạn đã chuyển sang chế độ SẴN SÀNG NHẬN ĐƠN!');
      } else {
        badge.innerHTML = '<i class="fa-solid fa-moon"></i> ĐANG TẠM NGHỈ';
        badge.style.color = '#94a3b8';
        showToast('Bạn đã chuyển sang chế độ TẠM NGHỈ.', 'error');
      }
    }
  };

  // Pick up Order Action (-> SHIPPED)
  window.handlePickupOrder = async (orderId) => {
    try {
      const res = await api(`/api/v1/shipper/orders/${orderId}/pickup`, { method: 'POST' });
      SoundFX.pickupChime();
      showToast(res.message || 'Đã nhận đơn và lấy hàng thành công!');
      await loadStats();
      // Chuyển sang tab đang giao để tài xế tiện thao tác
      switchTab('shipping');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ====================================================================
  // GPS ROUTE SIMULATION LOGIC
  // ====================================================================
  window.openGpsModal = (orderId) => {
    const order = ordersList.find(o => o.id === orderId);
    if (!order) return;
    activeGpsOrder = order;

    document.getElementById('gps-order-code').textContent = order.orderCode;
    document.getElementById('gps-dest-address').textContent = order.shippingAddress;
    document.getElementById('gps-remaining-km').textContent = `${order.distanceKm} km`;
    document.getElementById('gps-percent-text').textContent = '0%';
    document.getElementById('gps-road-progress').style.width = '0%';
    document.getElementById('gps-driver-marker').style.left = '15%';
    document.getElementById('btn-gps-deliver').disabled = true;
    document.getElementById('btn-start-gps').disabled = false;

    document.getElementById('gps-modal').classList.add('open');
  };

  window.closeGpsModal = () => {
    if (gpsTimer) clearInterval(gpsTimer);
    document.getElementById('gps-modal').classList.remove('open');
  };

  window.startGpsSimulation = () => {
    if (!activeGpsOrder) return;
    const startBtn = document.getElementById('btn-start-gps');
    const deliverBtn = document.getElementById('btn-gps-deliver');
    startBtn.disabled = true;

    let progress = 0;
    const totalDist = activeGpsOrder.distanceKm || 3.5;
    const marker = document.getElementById('gps-driver-marker');
    const roadProgress = document.getElementById('gps-road-progress');
    const kmText = document.getElementById('gps-remaining-km');
    const pctText = document.getElementById('gps-percent-text');

    if (gpsTimer) clearInterval(gpsTimer);

    gpsTimer = setInterval(() => {
      progress += 4;
      if (progress > 100) progress = 100;

      // Road spans from 15% to 85%
      const markerLeft = 15 + (progress / 100) * 70;
      marker.style.left = `${markerLeft}%`;
      roadProgress.style.width = `${progress}%`;
      pctText.textContent = `${progress}%`;

      const remainingDist = Math.max(0, (totalDist * (1 - progress / 100))).toFixed(1);
      kmText.textContent = `${remainingDist} km`;

      if (progress >= 100) {
        clearInterval(gpsTimer);
        SoundFX.gpsArrivalChime();
        deliverBtn.disabled = false;
        showToast('Đã đến địa chỉ khách hàng! Vui lòng bấm Xác Nhận Đến Nơi.');
      }
    }, 120);
  };

  window.proceedToDeliverFromGps = () => {
    const orderId = activeGpsOrder.id;
    closeGpsModal();
    openDeliverModal(orderId);
  };

  // ====================================================================
  // PROOF OF DELIVERY (POD) & CASH COLLECTION LOGIC
  // ====================================================================
  window.openDeliverModal = (orderId) => {
    const order = ordersList.find(o => o.id === orderId);
    if (!order) return;
    activeDeliverOrder = order;

    const summaryBox = document.getElementById('deliver-summary-box');
    const isCod = order.isCod;
    const totalFormatted = (Number(order.totalAmount) || 0).toLocaleString('vi-VN') + ' ₫';

    summaryBox.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.85rem;">
        <span style="color:var(--shp-text-muted);">Đơn Hàng:</span>
        <strong style="color:var(--shp-text-main);">${order.orderCode}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.85rem;">
        <span style="color:var(--shp-text-muted);">Khách hàng:</span>
        <strong style="color:var(--shp-text-main);">${order.customerName} (${order.phoneNumber})</strong>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:0.92rem; border-top:1px dashed var(--shp-card-border); padding-top:8px;">
        <span style="color:${isCod ? '#b45309' : '#047857'}; font-weight:700;">
          ${isCod ? 'TIỀN MẶT COD CẦN THU:' : 'HÌNH THỨC THANH TOÁN:'}
        </span>
        <strong style="color:${isCod ? '#b45309' : '#047857'}; font-size:1.1rem; font-variant-numeric:tabular-nums lining-nums;">
          ${isCod ? totalFormatted : 'ĐÃ TRẢ (0 ₫)'}
        </strong>
      </div>
    `;

    document.getElementById('deliver-modal').classList.add('open');
    initSignatureCanvas();
  };

  window.closeDeliverModal = () => {
    document.getElementById('deliver-modal').classList.remove('open');
  };

  // Signature Canvas Logic
  let sigCanvas, sigCtx, isDrawing = false;
  function initSignatureCanvas() {
    sigCanvas = document.getElementById('sig-canvas');
    if (!sigCanvas) return;
    sigCtx = sigCanvas.getContext('2d');
    sigCtx.lineWidth = 2.5;
    sigCtx.lineCap = 'round';
    sigCtx.strokeStyle = '#0f172a';
    clearSignature();

    const getPos = (e) => {
      const rect = sigCanvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * (sigCanvas.width / rect.width),
        y: (clientY - rect.top) * (sigCanvas.height / rect.height)
      };
    };

    const startDraw = (e) => {
      e.preventDefault();
      isDrawing = true;
      const pos = getPos(e);
      sigCtx.beginPath();
      sigCtx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      sigCtx.lineTo(pos.x, pos.y);
      sigCtx.stroke();
    };

    const stopDraw = () => { isDrawing = false; };

    sigCanvas.onmousedown = startDraw;
    sigCanvas.onmousemove = draw;
    window.onmouseup = stopDraw;

    sigCanvas.ontouchstart = startDraw;
    sigCanvas.ontouchmove = draw;
    sigCanvas.ontouchend = stopDraw;
  }

  window.clearSignature = () => {
    if (sigCanvas && sigCtx) {
      sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
    }
  };

  // Submit Final Delivery
  window.submitDelivery = async () => {
    if (!activeDeliverOrder) return;
    const btn = document.getElementById('btn-submit-delivery');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang ghi sổ CSDL...';

    const note = document.getElementById('delivery-note').value;
    const signatureData = sigCanvas ? sigCanvas.toDataURL() : '';

    try {
      const res = await api(`/api/v1/shipper/orders/${activeDeliverOrder.id}/deliver`, {
        method: 'POST',
        body: JSON.stringify({
          note,
          signature: signatureData,
          proofPhoto: 'assets/card_1.jpg'
        })
      });

      SoundFX.successFanfare();
      closeDeliverModal();
      showToast(res.message || 'Đã giao hàng và ghi nhận tiền mặt COD thành công!');
      await loadStats();
      switchTab('completed');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-check-double"></i> XÁC NHẬN GIAO THÀNH CÔNG & THU TIỀN';
    }
  };

  // ====================================================================
  // INCIDENT / FAIL REPORT MODAL
  // ====================================================================
  window.openFailModal = (orderId) => {
    const order = ordersList.find(o => o.id === orderId);
    if (!order) return;
    activeFailOrder = order;
    document.getElementById('fail-modal').classList.add('open');
  };

  window.closeFailModal = () => {
    document.getElementById('fail-modal').classList.remove('open');
  };

  window.submitReportFailure = async () => {
    if (!activeFailOrder) return;
    const selectedRadio = document.querySelector('input[name="fail_reason"]:checked');
    const reason = selectedRadio ? selectedRadio.value : 'Sự cố giao hàng';
    const action = selectedRadio?.dataset.action || 'reschedule';

    try {
      const res = await api(`/api/v1/shipper/orders/${activeFailOrder.id}/fail`, {
        method: 'POST',
        body: JSON.stringify({ reason, action })
      });

      closeFailModal();
      showToast(res.message, 'error');
      await loadStats();
      loadOrders();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ====================================================================
  // QUICK SIMULATED ORDER CREATION
  // ====================================================================
  window.createSimulatedOrder = async () => {
    try {
      showToast('Đang tạo đơn hàng giả lập mới trong SQL Server...');
      const res = await api('/api/v1/shipper/simulate/create-order', { method: 'POST' });
      SoundFX.pickupChime();
      showToast(`Đã tạo đơn #${res.data.orderCode}! Sẵn sàng cho Shipper lấy hàng.`);
      await loadStats();
      switchTab('ready');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.openDriverReport = () => {
    const codFormatted = (Number(statsData.codCollected) || 0).toLocaleString('vi-VN') + ' ₫';
    alert(
      `📊 BÁO CÁO THU NHẬP & HOẠT ĐỘNG SHIPPPER\n` +
      `-----------------------------------------\n` +
      `Tài xế: ${statsData.driver?.name || 'Nguyễn Văn Hùng'} (${statsData.driver?.id || 'SHP-8821'})\n` +
      `Phương tiện: ${statsData.driver?.vehicle || 'Yamaha Grande VIP'}\n` +
      `Ca làm việc: 07:00 - 19:00\n\n` +
      `📦 Đơn chờ lấy: ${statsData.readyCount} đơn\n` +
      `🚚 Đơn đang giao: ${statsData.shippingCount} đơn\n` +
      `✅ Đã giao hoàn tất: ${statsData.completedCount} đơn\n` +
      `💵 Tổng tiền COD tạm giữ: ${codFormatted}\n\n` +
      `Đánh giá chất lượng: 4.98 ★ (Hạng Kim Cương VIP)`
    );
  };

  // Search input handler with debounce
  let searchDebounce = null;
  const searchInput = document.getElementById('shipper-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        searchQuery = e.target.value.trim();
        loadOrders();
      }, 300);
    });
  }

  // Initial load
  document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadOrders();
  });

})();

