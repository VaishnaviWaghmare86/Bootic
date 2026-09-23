import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-inject JWT token into requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('b2b_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle session expiration cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token invalid or expired
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('b2b_token');
        localStorage.removeItem('b2b_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
