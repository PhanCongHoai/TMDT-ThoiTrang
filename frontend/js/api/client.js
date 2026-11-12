// ====================================================================
// AURALIÈ API CLIENT — Unified HTTP Layer with JWT Authentication
// Tự động đính kèm token, xử lý refresh, bắt lỗi 401 & chuẩn hóa JSON
// ====================================================================

const ApiClient = {
  /**
   * Lấy token hiện tại từ sessionStorage
   */
  getToken() {
    return sessionStorage.getItem('auralie_token');
  },

  /**
   * Wrapper gọi HTTP Request
   */
  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers
      });

      // Nếu bị từ chối quyền (401 Unauthorized), chuyển hướng về trang đăng nhập nếu đang ở trang cần bảo vệ
      if (response.status === 401) {
        const isProtectedPage = window.location.pathname.includes('admin.html') || window.location.pathname.includes('profile.html');
        if (isProtectedPage) {
          sessionStorage.removeItem('auralie_token');
          sessionStorage.removeItem('auralie_user');
          window.location.href = 'login.html';
        }
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error(`[ApiClient Error] ${options.method || 'GET'} ${endpoint}:`, err);
      return {
        status: 'error',
        message: err.message || 'Không thể kết nối đến máy chủ.'
      };
    }
  },

  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url, { method: 'GET' });
  },

  post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

window.ApiClient = ApiClient;

