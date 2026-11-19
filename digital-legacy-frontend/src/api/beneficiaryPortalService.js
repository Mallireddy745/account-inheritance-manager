import axiosClient from './axiosClient';

export const getBeneficiaryPortalSummary = () => axiosClient.get('/beneficiary-portal/summary');

export const getMyInvitations = () => axiosClient.get('/beneficiary-portal/invitations');

export const acceptInvitation = (id) => axiosClient.post(`/beneficiary-portal/invitations/${id}/accept`);

export const declineInvitation = (id) => axiosClient.post(`/beneficiary-portal/invitations/${id}/decline`);

export const getMyOwners = () => axiosClient.get('/beneficiary-portal/owners');

export const getInheritedAssets = () => axiosClient.get('/beneficiary-portal/assets');

export const getAuthorizedDocuments = () => axiosClient.get('/beneficiary-portal/authorized-documents');

export const uploadSupportingDoc = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return axiosClient.post('/beneficiary-portal/upload-supporting-doc', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const submitBeneficiaryClaim = (data) => axiosClient.post('/beneficiary-portal/claims', data);

export const getMyBeneficiaryClaims = (params) => axiosClient.get('/beneficiary-portal/claims', { params });

export const downloadInheritedFile = async (assetId, fileId, originalFileName) => {
  const response = await axiosClient.get(`/beneficiary-portal/assets/${assetId}/download-file/${fileId}`, {
    responseType: 'blob'
  });
  const blob = new Blob([response.data], {
    type: response.headers['content-type'] || 'application/octet-stream'
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', originalFileName || `inherited-document-${fileId}`);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};
