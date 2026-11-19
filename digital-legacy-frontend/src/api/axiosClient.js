import axios from 'axios';

let apiBase = (import.meta.env.VITE_API_BASE_URL || '/api').trim();
if (apiBase !== '/api' && !apiBase.endsWith('/api')) {
  apiBase = apiBase.replace(/\/+$/, '') + '/api';
}

const axiosClient = axios.create({
  baseURL: apiBase,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor: add token
axiosClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('dlm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('dlm_token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
