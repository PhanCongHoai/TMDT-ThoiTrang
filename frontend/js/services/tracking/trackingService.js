import { ConsentManager } from './consentManager.js';
import { IdentityManager } from './identityManager.js';
import { SessionManager } from './sessionManager.js';
import { EventQueue } from './eventQueue.js';
import { EventTracker } from './eventTracker.js';

const AuralieTracking = {
  init() {
    const anonId = IdentityManager.getAnonymousId();
    const sessionId = SessionManager.getOrCreateSession(anonId);
    EventQueue.startAutoFlush();

    // Ghi nhận page_view tự động
    EventTracker.track('page_view', {
      properties: { title: document.title },
      dedupeKey: `pv:${window.location.pathname}`
    });

    // Theo dõi page_duration & page_exit khi rời trang
    const enterTime = Date.now();
    let maxScroll = 0;
    window.addEventListener('scroll', () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (h > 0) {
        const pct = Math.min(100, Math.round((window.scrollY / h) * 100));
        if (pct > maxScroll) maxScroll = pct;
      }
    }, { passive: true });

    window.addEventListener('pagehide', () => {
      const durationSec = Math.round((Date.now() - enterTime) / 1000);
      EventTracker.track('page_exit', {
        properties: { duration_sec: durationSec, max_scroll_pct: maxScroll }
      });
      EventQueue.flush(true);
      SessionManager.sendHeartbeat(sessionId, true);
    });

    // Hiển thị thanh thông báo quyền riêng tư nếu chưa từng chọn
    this._renderConsentBanner(anonId);
  },

  track(eventName, options = {}) {
    EventTracker.track(eventName, options);
  },

  onUserAuthenticated() {
    const anonId = IdentityManager.getAnonymousId();
    const sessionId = SessionManager.getOrCreateSession(anonId);
    SessionManager.notifyStart(sessionId, anonId);
    EventTracker.track('login');
    EventQueue.flush();
  },

  syncCart(cartItems) {
    const anonId = IdentityManager.getAnonymousId();
    const sessionId = SessionManager.getOrCreateSession(anonId);
    const token = sessionStorage.getItem('auralie_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch('/api/tracking/cart-sync', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        anonymous_id: anonId,
        session_id: sessionId,
        cart_items: cartItems
      })
    }).catch(() => {});
  },

  _renderConsentBanner(anonId) {
    const current = ConsentManager.getConsent();
    if (current.analytics !== 'UNSET' || window.location.pathname.includes('admin.html')) return;
    if (document.getElementById('auralie-consent-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'auralie-consent-banner';
    banner.style.cssText = 'position:fixed;bottom:16px;left:16px;right:16px;max-width:560px;background:#111;color:#fff;padding:16px 20px;border:1px solid rgba(212,175,55,0.45);border-radius:10px;z-index:9999;box-shadow:0 12px 32px rgba(0,0,0,0.35);font-size:13px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;';
    banner.innerHTML = `
      <div style="flex:1;min-width:240px;line-height:1.45;">
        <strong style="color:#d4af37;">AURALIÈ Privacy:</strong> Chúng tôi sử dụng dữ liệu tương tác để cải thiện gợi ý trang phục & trải nghiệm mua sắm.
      </div>
      <div style="display:flex;gap:8px;">
        <button id="consent-deny-btn" style="padding:7px 12px;background:transparent;color:#ccc;border:1px solid #555;border-radius:6px;cursor:pointer;">Từ chối</button>
        <button id="consent-accept-btn" style="padding:7px 14px;background:#d4af37;color:#111;border:none;border-radius:6px;font-weight:600;cursor:pointer;">Đồng ý</button>
      </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('consent-accept-btn').onclick = () => {
      ConsentManager.setConsent({ analytics: 'GRANTED', marketing: 'GRANTED' }, anonId);
      banner.remove();
    };
    document.getElementById('consent-deny-btn').onclick = () => {
      ConsentManager.setConsent({ analytics: 'DENIED', marketing: 'DENIED' }, anonId);
      banner.remove();
    };
  }
};

window.AuralieTracking = AuralieTracking;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AuralieTracking.init());
} else {
  AuralieTracking.init();
}

export default AuralieTracking;

