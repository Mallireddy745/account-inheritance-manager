import axiosClient from './axiosClient';

export const getPermissions = () => axiosClient.get('/permissions');
export const grantPermission = (data) => axiosClient.post('/permissions', data);
export const revokePermission = (id) => axiosClient.patch(`/permissions/${id}/revoke`);
export const deletePermission = (id) => axiosClient.delete(`/permissions/${id}`);
