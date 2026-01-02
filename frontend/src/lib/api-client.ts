/// <reference types="vite/client" />
import axios, { InternalAxiosRequestConfig } from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (apiKey) {
    config.headers.set('apikey', apiKey);
  }
  
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  
  return config;
});

export default apiClient;
