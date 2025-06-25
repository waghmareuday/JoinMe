import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api', // update if using a different port
  withCredentials: true,
});

export default api;
