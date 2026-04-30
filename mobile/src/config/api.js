import axios from 'axios';

const rawBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || '';
export const API_BASE_URL = rawBaseUrl.replace(/\/$/, '');

export const apiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
};

export const api = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: 120000,
});
