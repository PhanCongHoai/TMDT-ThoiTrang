import { ConsentManager } from './consentManager.js';
import { IdentityManager } from './identityManager.js';
import { SessionManager } from './sessionManager.js';
import { EventQueue } from './eventQueue.js';

function makeEventId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'evt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

export const EventTracker = {
  _recentDedupe: new Map(),

  track(eventName, { productId = null, categoryId = null, properties = {}, dedupeKey = null } = {}) {
    if (!ConsentManager.isAnalyticsAllowed() && eventName !== 'purchase') {
      return;
    }

    // Chống gửi trùng sự kiện giống hệt nhau trong vòng 1.5 giây
    if (dedupeKey) {
      const now = Date.now();
      const prev = this._recentDedupe.get(dedupeKey);
      if (prev && now - prev < 1500) return;
      this._recentDedupe.set(dedupeKey, now);
    }

    const anonymousId = IdentityManager.getAnonymousId();
    const sessionId = SessionManager.getOrCreateSession(anonymousId);
    const dev = SessionManager.getDeviceInfo();

    EventQueue.enqueue({
      event_id: makeEventId(),
      event_name: eventName,
      anonymous_id: anonymousId,
      session_id: sessionId,
      product_id: productId ? Number(productId) : null,
      category_id: categoryId ? Number(categoryId) : null,
      event_timestamp: new Date().toISOString(),
      page_url: window.location.pathname + window.location.search,
      referrer_url: document.referrer || null,
      ...dev,
      event_properties: properties
    });
  }
};

