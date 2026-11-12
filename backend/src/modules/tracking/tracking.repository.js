const { sql, poolPromise, query } = require('../../config/db');

class TrackingRepository {
  static async saveConsent({ userId, anonymousId, consentType, consentStatus, policyVersion }) {
    await query(`
      INSERT INTO tracking_consents (user_id, anonymous_id, consent_type, consent_status, policy_version, consent_timestamp)
      VALUES (@userId, @anonymousId, @consentType, @consentStatus, @policyVersion, SYSUTCDATETIME())
    `, {
      userId: userId || null,
      anonymousId,
      consentType,
      consentStatus,
      policyVersion: policyVersion || '1.0'
    });
  }

  static async hasAnalyticsConsent(anonymousId, userId = null) {
    const res = await query(`
      SELECT TOP 1 consent_status
      FROM tracking_consents
      WHERE consent_type = 'ANALYTICS'
        AND (anonymous_id = @anonymousId OR (@userId IS NOT NULL AND user_id = @userId))
      ORDER BY consent_timestamp DESC
    `, { anonymousId, userId: userId || null });
    if (!res.recordset.length) return true; // Mặc định cho phép cho đến khi user chọn từ chối (opt-out), trừ khi user DENIED
    return res.recordset[0].consent_status !== 'DENIED';
  }

  static async upsertSession(sessionData) {
    await query(`
      MERGE user_sessions AS target
      USING (SELECT @sessionId AS session_id) AS src
      ON (target.session_id = src.session_id)
      WHEN MATCHED THEN
        UPDATE SET
          last_activity_at = SYSUTCDATETIME(),
          user_id = COALESCE(@userId, target.user_id)
      WHEN NOT MATCHED THEN
        INSERT (
          session_id, user_id, anonymous_id, started_at, last_activity_at,
          landing_page, referrer, device_type, browser, operating_system,
          traffic_source, utm_source, utm_medium, utm_campaign
        )
        VALUES (
          @sessionId, @userId, @anonymousId, SYSUTCDATETIME(), SYSUTCDATETIME(),
          @landingPage, @referrer, @deviceType, @browser, @operatingSystem,
          @trafficSource, @utmSource, @utmMedium, @utmCampaign
        );
    `, {
      sessionId: sessionData.sessionId,
      userId: sessionData.userId || null,
      anonymousId: sessionData.anonymousId,
      landingPage: sessionData.landingPage || null,
      referrer: sessionData.referrer || null,
      deviceType: sessionData.deviceType || null,
      browser: sessionData.browser || null,
      operatingSystem: sessionData.operatingSystem || null,
      trafficSource: sessionData.trafficSource || null,
      utmSource: sessionData.utmSource || null,
      utmMedium: sessionData.utmMedium || null,
      utmCampaign: sessionData.utmCampaign || null
    });
  }

  static async heartbeatSession({ sessionId, userId, ended }) {
    await query(`
      UPDATE user_sessions
      SET last_activity_at = SYSUTCDATETIME(),
          user_id = COALESCE(@userId, user_id),
          ended_at = CASE WHEN @ended = 1 THEN SYSUTCDATETIME() ELSE ended_at END
      WHERE session_id = @sessionId
    `, {
      sessionId,
      userId: userId || null,
      ended: ended ? 1 : 0
    });
  }

  /**
   * Liên kết lịch sử anonymous_id với user_id sau khi khách đăng nhập
   */
  static async linkAnonymousToUser(anonymousId, userId) {
    if (!anonymousId || !userId) return;
    await query(`
      UPDATE user_sessions SET user_id = @userId WHERE anonymous_id = @anonymousId AND user_id IS NULL;
      UPDATE user_events SET user_id = @userId WHERE anonymous_id = @anonymousId AND user_id IS NULL;
      UPDATE user_search_history SET user_id = @userId WHERE anonymous_id = @anonymousId AND user_id IS NULL;
      UPDATE product_interactions SET user_id = @userId WHERE anonymous_id = @anonymousId AND user_id IS NULL;
    `, { anonymousId, userId });
  }

  /**
   * Lưu batch sự kiện với Transaction & Deduplication theo event_id
   */
  static async insertEventsBatch(events) {
    if (!events || events.length === 0) return { inserted: 0, duplicates: 0 };

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    let inserted = 0;
    let duplicates = 0;

    try {
      for (const evt of events) {
        // Đảm bảo session tồn tại trước khi chèn event (FK_Events_Sessions)
        const sessReq = new sql.Request(transaction);
        sessReq.input('sessionId', sql.NVarChar(100), evt.sessionId);
        sessReq.input('anonymousId', sql.NVarChar(100), evt.anonymousId);
        sessReq.input('userId', sql.Int, evt.userId || null);
        sessReq.input('deviceType', sql.NVarChar(30), evt.deviceType || null);
        sessReq.input('browser', sql.NVarChar(50), evt.browser || null);
        sessReq.input('os', sql.NVarChar(50), evt.operatingSystem || null);
        await sessReq.query(`
          IF NOT EXISTS (SELECT 1 FROM user_sessions WHERE session_id = @sessionId)
          BEGIN
            INSERT INTO user_sessions (session_id, user_id, anonymous_id, device_type, browser, operating_system)
            VALUES (@sessionId, @userId, @anonymousId, @deviceType, @browser, @os)
          END
        `);

        // Chèn user_events với kiểm tra trùng lặp event_id
        const evReq = new sql.Request(transaction);
        evReq.input('eventId', sql.NVarChar(100), evt.eventId);
        evReq.input('eventName', sql.NVarChar(80), evt.eventName);
        evReq.input('userId', sql.Int, evt.userId || null);
        evReq.input('anonymousId', sql.NVarChar(100), evt.anonymousId);
        evReq.input('sessionId', sql.NVarChar(100), evt.sessionId);
        evReq.input('productId', sql.Int, evt.productId || null);
        evReq.input('categoryId', sql.Int, evt.categoryId || null);
        evReq.input('eventTimestamp', sql.DateTime2, evt.eventTimestamp);
        evReq.input('pageUrl', sql.NVarChar(500), evt.pageUrl || null);
        evReq.input('referrerUrl', sql.NVarChar(500), evt.referrerUrl || null);
        evReq.input('deviceType', sql.NVarChar(30), evt.deviceType || null);
        evReq.input('browser', sql.NVarChar(50), evt.browser || null);
        evReq.input('os', sql.NVarChar(50), evt.operatingSystem || null);
        evReq.input('props', sql.NVarChar(sql.MAX), evt.eventProperties ? JSON.stringify(evt.eventProperties) : null);

        const insRes = await evReq.query(`
          IF NOT EXISTS (SELECT 1 FROM user_events WHERE event_id = @eventId)
          BEGIN
            INSERT INTO user_events (
              event_id, event_name, user_id, anonymous_id, session_id,
              product_id, category_id, event_timestamp, page_url, referrer_url,
              device_type, browser, operating_system, event_properties
            )
            VALUES (
              @eventId, @eventName, @userId, @anonymousId, @sessionId,
              @productId, @categoryId, @eventTimestamp, @pageUrl, @referrerUrl,
              @deviceType, @browser, @os, @props
            )
          END
        `);

        if (insRes.rowsAffected[0] > 0) {
          inserted++;

          // Ghi bổ sung vào user_search_history nếu là sự kiện search
          if (evt.eventName === 'search' || evt.eventName === 'search_no_result' || evt.eventName === 'search_result_click') {
            const props = evt.eventProperties || {};
            const sReq = new sql.Request(transaction);
            sReq.input('userId', sql.Int, evt.userId || null);
            sReq.input('anonymousId', sql.NVarChar(100), evt.anonymousId);
            sReq.input('sessionId', sql.NVarChar(100), evt.sessionId);
            sReq.input('keyword', sql.NVarChar(255), String(props.keyword || '').slice(0, 255));
            sReq.input('resultCount', sql.Int, Number(props.result_count || 0));
            sReq.input('clickedPid', sql.Int, evt.productId || null);
            sReq.input('filtersJson', sql.NVarChar(sql.MAX), props.filters ? JSON.stringify(props.filters) : null);
            await sReq.query(`
              INSERT INTO user_search_history (user_id, anonymous_id, session_id, keyword, result_count, clicked_product_id, filters_json)
              VALUES (@userId, @anonymousId, @sessionId, @keyword, @resultCount, @clickedPid, @filtersJson)
            `);
          }

          // Ghi bổ sung vào product_interactions nếu là tương tác sản phẩm trọng tâm
          if (evt.productId && ['product_view', 'product_click', 'product_variant_select', 'add_to_cart', 'wishlist_add', 'product_share'].includes(evt.eventName)) {
            const props = evt.eventProperties || {};
            const pReq = new sql.Request(transaction);
            pReq.input('userId', sql.Int, evt.userId || null);
            pReq.input('anonymousId', sql.NVarChar(100), evt.anonymousId);
            pReq.input('sessionId', sql.NVarChar(100), evt.sessionId);
            pReq.input('productId', sql.Int, evt.productId);
            pReq.input('variantId', sql.Int, props.variant_id ? Number(props.variant_id) : null);
            pReq.input('interactionType', sql.NVarChar(50), evt.eventName.toUpperCase());
            pReq.input('interactionValue', sql.NVarChar(255), props.value ? String(props.value).slice(0, 255) : null);
            await pReq.query(`
              INSERT INTO product_interactions (user_id, anonymous_id, session_id, product_id, variant_id, interaction_type, interaction_value)
              VALUES (@userId, @anonymousId, @sessionId, @productId, @variantId, @interactionType, @interactionValue)
            `);
          }
        } else {
          duplicates++;
        }
      }

      await transaction.commit();
      return { inserted, duplicates };
    } catch (err) {
      try { await transaction.rollback(); } catch (rbErr) {
        console.warn('[Tracking Transaction Warning]', rbErr.message);
      }
      throw err;
    }
  }

  static async syncAbandonedCart({ userId, userEmail, anonymousId, sessionId, cartItems }) {
    if (!cartItems || cartItems.length === 0) {
      await query(`
        UPDATE abandoned_carts SET status = 'RECOVERED'
        WHERE status = 'PENDING' AND ((@userId IS NOT NULL AND user_id = @userId) OR anonymous_id = @anonymousId)
      `, { userId: userId || null, anonymousId });
      return;
    }

    const existing = await query(`
      SELECT TOP 1 id FROM abandoned_carts
      WHERE status = 'PENDING' AND ((@userId IS NOT NULL AND user_id = @userId) OR anonymous_id = @anonymousId)
    `, { userId: userId || null, anonymousId });

    const cartJson = JSON.stringify(cartItems);
    if (existing.recordset.length > 0) {
      await query(`
        UPDATE abandoned_carts
        SET cart_data_json = @cartJson, abandoned_at = SYSUTCDATETIME(), session_id = @sessionId, user_id = COALESCE(@userId, user_id)
        WHERE id = @id
      `, { id: existing.recordset[0].id, cartJson, sessionId, userId: userId || null });
    } else {
      await query(`
        INSERT INTO abandoned_carts (user_id, user_email, anonymous_id, session_id, cart_data_json, status)
        VALUES (@userId, @userEmail, @anonymousId, @sessionId, @cartJson, 'PENDING')
      `, { userId: userId || null, userEmail: userEmail || null, anonymousId, sessionId, cartJson });
    }
  }
}

module.exports = TrackingRepository;

