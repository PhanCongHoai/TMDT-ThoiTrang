const CONSENT_KEY = 'auralie_tracking_consent_v1';

export const ConsentManager = {
  getConsent() {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      return raw ? JSON.parse(raw) : { analytics: 'UNSET', marketing: 'UNSET', version: '1.0' };
    } catch {
      return { analytics: 'UNSET', marketing: 'UNSET', version: '1.0' };
    }
  },

  isAnalyticsAllowed() {
    const c = this.getConsent();
    return c.analytics !== 'DENIED';
  },

  isMarketingAllowed() {
    const c = this.getConsent();
    return c.marketing === 'GRANTED' || c.analytics === 'GRANTED';
  },

  async setConsent({ analytics = 'GRANTED', marketing = 'GRANTED' }, anonymousId) {
    const payload = { analytics, marketing, version: '1.0', updatedAt: new Date().toISOString() };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
    const token = sessionStorage.getItem('auralie_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      await fetch('/api/tracking/consent', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          anonymous_id: anonymousId,
          consent_type: 'ANALYTICS',
          consent_status: analytics,
          policy_version: '1.0'
        })
      });
    } catch {
      // Không làm gián đoạn UX
    }
  }
};

