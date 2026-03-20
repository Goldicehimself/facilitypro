import axios from 'axios';
import { toast } from 'react-toastify';

// Use Vite proxy in development to avoid CORS; use env URL in production.
const API_BASE_URL = import.meta.env.DEV
  ? '/api/v1'
  : (import.meta.env.VITE_API_URL || 'https://mfs-h8k0.onrender.com/api/v1');

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config || !error.request) {
      // Not a network error or no config to retry
      return handleError(error);
    }

    // Initialize retry count if not present
    config._retryCount = config._retryCount || 0;

    // Retry up to 2 times for network errors
    if (config._retryCount < 2) {
      config._retryCount += 1;

      // Wait for 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));

      return axiosInstance(config);
    }

    return handleError(error);
  }
);

function handleError(error) {
  if (error.config?.suppressToast) {
    return Promise.reject(error);
  }
  if (error.response) {
    // Handle specific status codes
    switch (error.response.status) {
      case 401:
        // Unauthorized - redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
        break;
      case 403:
        toast.error('You do not have permission to perform this action.');
        break;
      case 404:
        toast.error('Resource not found.');
        break;
      case 500:
        // Server error is handled by the caller or a global handler.
        break;
      default:
        toast.error(error.response.data?.message || 'An error occurred');
    }
  } else if (error.request) {
    // Network error
    toast.error('Network error. Please check your connection.');
  }
  return Promise.reject(error);
}

export default axiosInstance;
