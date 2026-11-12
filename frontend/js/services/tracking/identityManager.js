const ANON_KEY = 'auralie_anonymous_id';

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'anon-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

export const IdentityManager = {
  getAnonymousId() {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = generateUUID();
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  },

  getUserId() {
    try {
      const raw = sessionStorage.getItem('auralie_user');
      if (!raw) return null;
      const u = JSON.parse(raw);
      return u && u.id ? Number(u.id) : null;
    } catch {
      return null;
    }
  }
};

