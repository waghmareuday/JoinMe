import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: 'http://localhost:4000/api', // update if using a different port
  withCredentials: true,
});

// Global response interceptor to show errors as toasts
api.interceptors.response.use(
  response => response,
  error => {
    // Avoid duplicating component-toasts for server responses; only toast when no response (network error)
    if (!error.response) {
      const msg = error.message || 'Network error';
      toast.error(msg);
    }
    return Promise.reject(error);
  }
);

export default api;
