import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api', 
  withCredentials: true, // ⚡ SECURITY: Replaces manual token injection with secure HttpOnly cookies
});

// We primarily use HttpOnly cookies, but we provide an Authorization header fallback 
// to ensure production functionality when browser cookie policies are strict.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Global response interceptor to show errors as toasts
api.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      const msg = error.message || 'Network error';
      toast.error(msg);
    }
    return Promise.reject(error);
  }
);

export default api;