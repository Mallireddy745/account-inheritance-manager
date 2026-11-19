import axiosClient from './axiosClient';

export const getNotifications = (params) => axiosClient.get('/notifications', { params });
export const getUnreadCount = () => axiosClient.get('/notifications/unread-count');
export const markAsRead = (id) => axiosClient.patch(`/notifications/${id}/read`);
export const markAllAsRead = () => axiosClient.patch('/notifications/read-all');
export const deleteNotification = (id) => axiosClient.delete(`/notifications/${id}`);
