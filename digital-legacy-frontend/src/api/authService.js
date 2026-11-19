import axiosClient from './axiosClient';

export const register = (data) => axiosClient.post('/auth/register', data);
export const login = (data) => axiosClient.post('/auth/login', data);
export const adminLogin = (data) => axiosClient.post('/auth/admin-login', data);
export const getCurrentUser = () => axiosClient.get('/auth/me');
export const logout = () => axiosClient.post('/auth/logout');
