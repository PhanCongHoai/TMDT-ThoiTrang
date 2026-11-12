const SESSION_KEY = 'auralie_session_id';
const SESSION_TS_KEY = 'auralie_session_last_ts';
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 phút không hoạt động -> session mới

function getDeviceInfo() {
  const ua = navigator.userAgent || '';
  const deviceType = /Mobi|Android|iPhone|iPad/i.test(ua) ? 'MOBILE' : 'DESKTOP';
  let browser = 'Other';
  if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';

  let os = 'Other';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return { device_type: deviceType, browser, operating_system: os };
}

function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign')
  };
}

export const SessionManager = {
  getOrCreateSession(anonymousId) {
    const now = Date.now();
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    const lastTs = Number(sessionStorage.getItem(SESSION_TS_KEY) || 0);
    let isNew = false;

    if (!sessionId || (lastTs && now - lastTs > SESSION_TTL_MS)) {
      sessionId = 'sess-' + now.toString(36) + '-' + Math.random().toString(36).slice(2, 9);
      sessionStorage.setItem(SESSION_KEY, sessionId);
      isNew = true;
    }
    sessionStorage.setItem(SESSION_TS_KEY, String(now));

    if (isNew) {
      this.notifyStart(sessionId, anonymousId);
    }
    return sessionId;
  },

  getDeviceInfo,

  async notifyStart(sessionId, anonymousId) {
    const dev = getDeviceInfo();
    const utm = getUtmParams();
    const token = sessionStorage.getItem('auralie_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      await fetch('/api/tracking/session/start', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          session_id: sessionId,
          anonymous_id: anonymousId,
          landing_page: window.location.pathname + window.location.search,
          referrer: document.referrer || null,
          ...dev,
          ...utm
        })
      });
    } catch {
      // Im lặng để không ảnh hưởng trải nghiệm
    }
  },

  sendHeartbeat(sessionId, ended = false) {
    const payload = JSON.stringify({ session_id: sessionId, ended });
    if (ended && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/tracking/session/heartbeat', blob);
      return;
    }
    const token = sessionStorage.getItem('auralie_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch('/api/tracking/session/heartbeat', { method: 'POST', headers, body: payload }).catch(() => {});
  }
};

