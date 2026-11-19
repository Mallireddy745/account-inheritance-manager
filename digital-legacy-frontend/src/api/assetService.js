import axiosClient from './axiosClient';

export const getAssets = (params) => axiosClient.get('/assets', { params });
export const getAsset = (id) => axiosClient.get(`/assets/${id}`);
export const createAsset = (formData) => axiosClient.post('/assets', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const createAssetJson = (data) => axiosClient.post('/assets/simple', data);
export const updateAsset = (id, data) => axiosClient.put(`/assets/${id}`, data);
export const deleteAsset = (id) => axiosClient.delete(`/assets/${id}`);
export const getCategories = () => axiosClient.get('/categories');

export const uploadAssetFile = (assetId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return axiosClient.post(`/assets/${assetId}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const deleteAssetFile = (assetId, fileId) =>
  axiosClient.delete(`/assets/${assetId}/files/${fileId}`);

export const previewAssetFile = async (assetId, fileId, fileName = '') => {
  let response;
  try {
    response = await axiosClient.get(`/assets/${assetId}/download-file/${fileId}`, {
      responseType: 'blob'
    });
  } catch {
    try {
      response = await axiosClient.get(`/assets/${assetId}/preview-file/${fileId}`, {
        responseType: 'blob'
      });
    } catch {
      response = await axiosClient.get(`/beneficiary-portal/assets/${assetId}/download-file/${fileId}`, {
        responseType: 'blob'
      });
    }
  }

  let contentType = response.headers?.['content-type'] || response.headers?.get?.('content-type') || 'application/octet-stream';
  const lower = (fileName || '').toLowerCase();
  if (lower.endsWith('.pdf')) {
    contentType = 'application/pdf';
  } else if (lower.endsWith('.png')) {
    contentType = 'image/png';
  } else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    contentType = 'image/jpeg';
  } else if (lower.endsWith('.gif')) {
    contentType = 'image/gif';
  } else if (lower.endsWith('.txt')) {
    contentType = 'text/plain';
  }

  const blob = new Blob([response.data], { type: contentType });
  return {
    url: window.URL.createObjectURL(blob),
    contentType,
    blob
  };
};

export const downloadAssetFile = async (assetId, fileId, originalFileName) => {
  const response = await axiosClient.get(`/assets/${assetId}/download-file/${fileId}`, {
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
