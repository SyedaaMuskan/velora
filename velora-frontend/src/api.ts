import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Central axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Helper for WebSocket URLs
export const getWsUrl = (path: string) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // If API_BASE_URL is relative, use current host
  if (API_BASE_URL.startsWith('/')) {
    return `${protocol}//${window.location.host}${API_BASE_URL}${path}`;
  }
  // If API_BASE_URL is absolute, replace http with ws
  return API_BASE_URL.replace(/^http/, protocol) + path;
};

export default api;
