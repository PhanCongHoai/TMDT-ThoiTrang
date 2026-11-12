// ====================================================================
// AURALIÈ — Auth Helper (auth.js)
// Dùng chung cho toàn bộ các trang frontend
// Nhúng vào HTML: <script src="js/auth.js"></script>
// ====================================================================

/**
 * Lấy JWT token từ sessionStorage
 */
window.getAuthToken = function () {
  return sessionStorage.getItem('auralie_token');
};

/**
 * Lấy thông tin user đang đăng nhập (từ sessionStorage cache)
 */
window.getAuthUser = function () {
  try {
    const raw = sessionStorage.getItem('auralie_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Gọi API với Authorization header tự động
 */
window.apiFetch = async function (url, options = {}) {
  const token = window.getAuthToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
};

/**
 * Lưu kết quả đăng nhập vào storage
 */
window.saveAuthSession = function (token, user) {
  sessionStorage.setItem('auralie_token', token);
  sessionStorage.setItem('auralie_user', JSON.stringify(user));
  localStorage.setItem('userRole', user.role);
  localStorage.setItem('userName', user.fullName);
  localStorage.setItem('userEmail', user.email);
  localStorage.setItem('userId', String(user.id));
  // Đảm bảo KHÔNG lưu password plaintext
  localStorage.removeItem('savedUserPassword');
  if (window.AuralieTracking && typeof window.AuralieTracking.onUserAuthenticated === 'function') {
    window.AuralieTracking.onUserAuthenticated();
  }
};

/**
 * Đăng xuất — xóa token và chuyển về login
 */
window.logout = function () {
  if (window.AuralieTracking && typeof window.AuralieTracking.track === 'function') {
    window.AuralieTracking.track('logout');
  }
  sessionStorage.removeItem('auralie_token');
  sessionStorage.removeItem('auralie_user');
  sessionStorage.removeItem('cartReminderShownAfterLogin');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userId');
  window.location.href = 'login.html';
};

/**
 * Kiểm tra token còn hiệu lực với server (/api/v1/auth/me)
 * Trả về user object hoặc null
 */
window.verifySession = async function () {
  const token = window.getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch('/api/v1/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      // Token hết hạn hoặc không hợp lệ — xóa session
      sessionStorage.removeItem('auralie_token');
      sessionStorage.removeItem('auralie_user');
      return null;
    }
    const data = await res.json();
    return data.status === 'success' ? data.data : null;
  } catch (e) {
    return null;
  }
};

/**
 * Guard: Redirect về login nếu chưa đăng nhập
 * Dùng ở đầu các trang cần auth: await window.requireAuth();
 */
window.requireAuth = async function () {
  const user = await window.verifySession();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
};

/**
 * Guard: Redirect về trang chủ nếu không phải ADMIN
 */
window.requireAdmin = async function () {
  const user = await window.verifySession();
  if (!user || user.role !== 'ADMIN') {
    window.location.href = 'index.html';
    return null;
  }
  return user;
};

