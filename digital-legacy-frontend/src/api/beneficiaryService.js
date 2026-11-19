import axiosClient from './axiosClient';

export const getBeneficiaries = () => axiosClient.get('/beneficiaries');
export const getBeneficiary = (id) => axiosClient.get(`/beneficiaries/${id}`);
export const createBeneficiary = (data) => axiosClient.post('/beneficiaries', data);
export const updateBeneficiary = (id, data) => axiosClient.put(`/beneficiaries/${id}`, data);
export const deleteBeneficiary = (id) => axiosClient.delete(`/beneficiaries/${id}`);
export const getBeneficiaryRequests = (id, params) => axiosClient.get(`/beneficiaries/${id}/requests`, { params });
export const resendInvitation = (id) => axiosClient.post(`/beneficiaries/${id}/resend-invitation`);
