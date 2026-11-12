const {
  ALLOWED_EVENTS,
  SENSITIVE_KEYS,
  CONSENT_REQUIRED_EVENTS,
  MAX_BATCH_SIZE
} = require('./tracking.constants');
const TrackingRepository = require('./tracking.repository');

function sanitizeProperties(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  const cleaned = {};
  for (const [key, val] of Object.entries(obj)) {
    const normalizedKey = String(key).toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (SENSITIVE_KEYS.has(normalizedKey)) continue;
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      cleaned[key] = sanitizeProperties(val);
    } else if (typeof val === 'string') {
      cleaned[key] = val.slice(0, 500);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

class TrackingService {
  static async recordConsent(user, body) {
    const { anonymous_id, consent_type, consent_status, policy_version } = body || {};
    if (!anonymous_id || typeof anonymous_id !== 'string') {
      const err = new Error('anonymous_id là bắt buộc');
      err.statusCode = 400;
      throw err;
    }
    const type = String(consent_type || 'ANALYTICS').toUpperCase();
    const status = String(consent_status || '').toUpperCase();
    if (!['ESSENTIAL', 'ANALYTICS', 'MARKETING'].includes(type)) {
      const err = new Error('consent_type không hợp lệ');
      err.statusCode = 400;
      throw err;
    }
    if (!['GRANTED', 'DENIED'].includes(status)) {
      const err = new Error('consent_status phải là GRANTED hoặc DENIED');
      err.statusCode = 400;
      throw err;
    }

    await TrackingRepository.saveConsent({
      userId: user ? user.id : null,
      anonymousId: anonymous_id.slice(0, 100),
      consentType: type,
      consentStatus: status,
      policyVersion: policy_version || '1.0'
    });
    return { consent_type: type, consent_status: status };
  }

  static async startSession(user, body) {
    const {
      session_id,
      anonymous_id,
      landing_page,
      referrer,
      device_type,
      browser,
      operating_system,
      traffic_source,
      utm_source,
      utm_medium,
      utm_campaign
    } = body || {};

    if (!session_id || !anonymous_id) {
      const err = new Error('session_id và anonymous_id là bắt buộc');
      err.statusCode = 400;
      throw err;
    }

    await TrackingRepository.upsertSession({
      sessionId: String(session_id).slice(0, 100),
      userId: user ? user.id : null,
      anonymousId: String(anonymous_id).slice(0, 100),
      landingPage: landing_page ? String(landing_page).slice(0, 500) : null,
      referrer: referrer ? String(referrer).slice(0, 500) : null,
      deviceType: device_type ? String(device_type).slice(0, 30) : null,
      browser: browser ? String(browser).slice(0, 50) : null,
      operatingSystem: operating_system ? String(operating_system).slice(0, 50) : null,
      trafficSource: traffic_source ? String(traffic_source).slice(0, 100) : null,
      utmSource: utm_source ? String(utm_source).slice(0, 100) : null,
      utmMedium: utm_medium ? String(utm_medium).slice(0, 100) : null,
      utmCampaign: utm_campaign ? String(utm_campaign).slice(0, 100) : null
    });

    if (user && user.id) {
      await TrackingRepository.linkAnonymousToUser(String(anonymous_id).slice(0, 100), user.id);
    }

    return { session_id };
  }

  static async heartbeat(user, body) {
    const { session_id, ended } = body || {};
    if (!session_id) {
      const err = new Error('session_id là bắt buộc');
      err.statusCode = 400;
      throw err;
    }
    await TrackingRepository.heartbeatSession({
      sessionId: String(session_id).slice(0, 100),
      userId: user ? user.id : null,
      ended: Boolean(ended)
    });
    return { updated: true };
  }

  static async ingestEvents(user, rawEvents) {
    const list = Array.isArray(rawEvents) ? rawEvents : [rawEvents];
    if (list.length === 0) return { accepted: 0, inserted: 0, duplicates: 0, rejected: 0 };
    if (list.length > MAX_BATCH_SIZE) {
      const err = new Error(`Vượt quá kích thước batch tối đa (${MAX_BATCH_SIZE} sự kiện)`);
      err.statusCode = 400;
      throw err;
    }

    const firstAnon = list[0]?.anonymous_id ? String(list[0].anonymous_id).slice(0, 100) : null;
    const authenticatedUserId = user ? user.id : null;

    // Kiểm tra consent ANALYTICS: nếu người dùng từ chối tracking, bỏ qua các sự kiện không thiết yếu
    let analyticsAllowed = true;
    if (firstAnon) {
      analyticsAllowed = await TrackingRepository.hasAnalyticsConsent(firstAnon, authenticatedUserId);
    }

    const validEvents = [];
    let rejected = 0;

    for (const raw of list) {
      if (!raw || typeof raw !== 'object') {
        rejected++;
        continue;
      }
      const eventName = String(raw.event_name || '').trim();
      if (!ALLOWED_EVENTS.has(eventName) || !raw.event_id || !raw.anonymous_id || !raw.session_id) {
        rejected++;
        continue;
      }

      if (!analyticsAllowed && (CONSENT_REQUIRED_EVENTS.has(eventName) || eventName !== 'purchase')) {
        rejected++;
        continue;
      }

      const parsedTs = raw.event_timestamp ? new Date(raw.event_timestamp) : new Date();
      const eventTimestamp = isNaN(parsedTs.getTime()) ? new Date() : parsedTs;

      validEvents.push({
        eventId: String(raw.event_id).slice(0, 100),
        eventName,
        // Tuyệt đối không cho phép client tự ghi đè user_id khác với JWT đã xác thực
        userId: authenticatedUserId,
        anonymousId: String(raw.anonymous_id).slice(0, 100),
        sessionId: String(raw.session_id).slice(0, 100),
        productId: raw.product_id && !isNaN(Number(raw.product_id)) ? Number(raw.product_id) : null,
        categoryId: raw.category_id && !isNaN(Number(raw.category_id)) ? Number(raw.category_id) : null,
        eventTimestamp,
        pageUrl: raw.page_url ? String(raw.page_url).slice(0, 500) : null,
        referrerUrl: raw.referrer_url ? String(raw.referrer_url).slice(0, 500) : null,
        deviceType: raw.device_type ? String(raw.device_type).slice(0, 30) : null,
        browser: raw.browser ? String(raw.browser).slice(0, 50) : null,
        operatingSystem: raw.operating_system ? String(raw.operating_system).slice(0, 50) : null,
        eventProperties: sanitizeProperties(raw.event_properties)
      });
    }

    const result = await TrackingRepository.insertEventsBatch(validEvents);
    return {
      accepted: validEvents.length,
      rejected,
      ...result
    };
  }

  static async syncCart(user, body) {
    const { anonymous_id, session_id, cart_items } = body || {};
    if (!anonymous_id) return { synced: false };
    await TrackingRepository.syncAbandonedCart({
      userId: user ? user.id : null,
      userEmail: user ? user.email : null,
      anonymousId: String(anonymous_id).slice(0, 100),
      sessionId: session_id ? String(session_id).slice(0, 100) : null,
      cartItems: Array.isArray(cart_items) ? cart_items.slice(0, 30) : []
    });
    return { synced: true };
  }
}

module.exports = TrackingService;

