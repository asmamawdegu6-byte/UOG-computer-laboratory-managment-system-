import axios from 'axios';
import logger from '../utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased to 60 seconds for slower connections
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the error
    logger.logApiError(error, { context: 'API Interceptor' });
    
    // Only redirect on 401 if we have a token (user was logged in but session expired)
    // Don't redirect if we're already on login/register pages
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath === '/login' || currentPath === '/register' || currentPath === '/forgot-password';
    const hasToken = localStorage.getItem('token');

    if (error.response?.status === 401 && hasToken && !isAuthPage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;