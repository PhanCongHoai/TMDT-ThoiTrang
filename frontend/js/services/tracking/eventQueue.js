const QUEUE_KEY = 'auralie_event_queue_v1';
const MAX_BATCH = 20;
const FLUSH_INTERVAL_MS = 5000;

export const EventQueue = {
  _flushing: false,
  _timer: null,

  load() {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  save(items) {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-200)));
    } catch {
      // Bỏ qua nếu localStorage đầy
    }
  },

  enqueue(event) {
    const queue = this.load();
    queue.push(event);
    this.save(queue);
    if (queue.length >= 10) {
      this.flush();
    }
  },

  startAutoFlush() {
    if (this._timer) return;
    this._timer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush(true);
      }
    });
    window.addEventListener('online', () => this.flush());
  },

  async flush(useBeacon = false) {
    if (this._flushing) return;
    const queue = this.load();
    if (!queue.length) return;

    const batch = queue.slice(0, MAX_BATCH);
    const remaining = queue.slice(MAX_BATCH);

    if (useBeacon && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({ events: batch })], { type: 'application/json' });
      const ok = navigator.sendBeacon('/api/tracking/events/batch', blob);
      if (ok) this.save(remaining);
      return;
    }

    this._flushing = true;
    try {
      const token = sessionStorage.getItem('auralie_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/tracking/events/batch', {
        method: 'POST',
        headers,
        body: JSON.stringify({ events: batch })
      });
      if (res.ok) {
        this.save(remaining);
      }
    } catch {
      // Giữ lại trong localStorage để retry khi có mạng
    } finally {
      this._flushing = false;
    }
  }
};

