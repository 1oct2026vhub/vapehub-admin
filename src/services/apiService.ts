import axiosInstance from '@/utils/axiosApi';

// Generic fetcher for GET requests
export const fetcher = (url) => axiosInstance.get(url).then((res) => res.data);

// Generic poster for POST requests
export const poster = (url, data) => axiosInstance.post(url, data).then((res) => res.data);

// Auth actions
export const login = (credentials) => poster('/api/admin/auth/login', credentials);
export const register = (credentials) => poster('/api/admin/auth/register', credentials);
