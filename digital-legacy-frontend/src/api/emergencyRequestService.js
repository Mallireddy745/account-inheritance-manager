import axiosClient from './axiosClient';

export const submitRequest = (data) => axiosClient.post('/emergency-requests', data);
export const getOwnerRequests = (params) => axiosClient.get('/emergency-requests/owner', { params });
export const getBeneficiaryRequests = (params) => axiosClient.get('/emergency-requests/beneficiary', { params });
export const getRequest = (id) => axiosClient.get(`/emergency-requests/${id}`);
export const cancelRequest = (id) => axiosClient.patch(`/emergency-requests/${id}/cancel`);
