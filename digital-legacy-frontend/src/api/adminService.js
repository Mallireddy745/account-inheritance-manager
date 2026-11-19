import axiosClient from './axiosClient';

export const getAdminDashboard = () => axiosClient.get('/admin/dashboard');
export const getAdminUsers = (params) => axiosClient.get('/admin/users', { params });
export const getAdminUserDetail = (id) => axiosClient.get(`/admin/users/${id}`);
export const changeUserStatus = (id, status) => axiosClient.patch(`/admin/users/${id}/status`, null, { params: { status } });
export const createVerifier = (data) => axiosClient.post('/admin/verifiers', data);
export const getAdminVerifiers = () => axiosClient.get('/admin/verifiers');
export const getAdminAssets = (params) => axiosClient.get('/admin/assets', { params });
export const getAdminAssetDetails = (id) => axiosClient.get(`/admin/assets/${id}`);
export const downloadAdminAssetFile = async (assetId, fileId, originalFileName) => {
  const response = await axiosClient.get(`/admin/assets/${assetId}/download-file/${fileId}`, {
    responseType: 'blob'
  });
  const blob = new Blob([response.data], {
    type: response.headers['content-type'] || 'application/octet-stream'
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', originalFileName || `asset-document-${fileId}`);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};
export const getAdminBeneficiaries = (params) => axiosClient.get('/admin/beneficiaries', { params });
export const getAdminRequests = (params) => axiosClient.get('/admin/emergency-requests', { params });
export const downloadAdminEvidence = async (requestId, originalFileName) => {
  const response = await axiosClient.get(`/admin/emergency-requests/${requestId}/evidence`, {
    responseType: 'blob'
  });
  const blob = new Blob([response.data], {
    type: response.headers['content-type'] || 'application/octet-stream'
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', originalFileName || `evidence-document-${requestId}`);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};
export const approveRequest = (id, data) => axiosClient.patch(`/admin/emergency-requests/${id}/approve`, data);
export const rejectRequest = (id, data) => axiosClient.patch(`/admin/emergency-requests/${id}/reject`, data);
export const getVerifications = (params) => axiosClient.get('/admin/verifications', { params });
export const downloadVerificationDocument = async (verificationId, originalFileName) => {
  const response = await axiosClient.get(`/admin/verifications/${verificationId}/document`, {
    responseType: 'blob'
  });
  const blob = new Blob([response.data], {
    type: response.headers['content-type'] || 'application/octet-stream'
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', originalFileName || `verification-document-${verificationId}`);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};
export const approveVerification = (id, data) => axiosClient.patch(`/admin/verifications/${id}/approve`, data);
export const rejectVerification = (id, data) => axiosClient.patch(`/admin/verifications/${id}/reject`, data);
export const getAuditLogs = (params) => axiosClient.get('/admin/audit-logs', { params });
export const getAllSettings = () => axiosClient.get('/admin/settings');
export const updateSetting = (key, value) => axiosClient.put(`/admin/settings/${key}`, null, { params: { value } });
