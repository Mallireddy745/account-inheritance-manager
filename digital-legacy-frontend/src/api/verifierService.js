import axiosClient from './axiosClient';

export const getVerifierRequests = (params) => axiosClient.get('/verifier/requests', { params });

export const getVerifierRequest = (id) => axiosClient.get(`/verifier/requests/${id}`);

export const markUnderReview = (id) => axiosClient.patch(`/verifier/requests/${id}/under-review`);

export const approveRequest = (id, data) => axiosClient.patch(`/verifier/requests/${id}/approve`, data);

export const rejectRequest = (id, data) => axiosClient.patch(`/verifier/requests/${id}/reject`, data);

export const requestAdditionalInfo = (id, data) => axiosClient.patch(`/verifier/requests/${id}/request-info`, data);

export const downloadEvidence = async (id, fileName) => {
  const response = await axiosClient.get(`/verifier/requests/${id}/evidence`, {
    responseType: 'blob'
  });
  const blob = new Blob([response.data], {
    type: response.headers['content-type'] || 'application/octet-stream'
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName || `supporting-evidence-${id}`);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};
