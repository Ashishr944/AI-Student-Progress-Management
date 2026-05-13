import axios from 'axios';
import { getStoredUser } from './auth.js';

const defaultBase = import.meta.env.PROD ? '/api' : 'http://localhost:4000';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultBase,
});

api.interceptors.request.use((config) => {
  const user = getStoredUser();
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

export default api;
