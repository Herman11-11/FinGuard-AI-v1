import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
export const API_BASE_URL = rawBaseUrl.replace(/\/$/, '');

export const apiUrl = (path) => {
  if (!API_BASE_URL) {
    return path;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

axios.defaults.baseURL = API_BASE_URL || undefined;

export default axios;
