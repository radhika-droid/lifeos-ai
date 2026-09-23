import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL || '';
const API_BASE = rawBase ? (rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`) : '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lifeos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses — clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('lifeos_token');
      localStorage.removeItem('lifeos_user');
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/signup' && currentPath !== '/forgot-password') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
