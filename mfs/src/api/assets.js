import axiosInstance from './axiosConfig';
import logger from '../utils/logger';

const normalizeAsset = (asset) => {
  if (!asset) return asset;
  return {
    ...asset,
    id: asset.id || asset._id,
  };
};

export const getAssets = async (params = {}) => {
  const response = await axiosInstance.get('/assets', { params, suppressToast: true });
  const payload = response.data?.data;
  if (Array.isArray(payload)) {
    const list = payload.map(normalizeAsset);
    return { data: list, total: list.length };
  }
  if (Array.isArray(payload?.assets)) {
    const list = payload.assets.map(normalizeAsset);
    return { data: list, total: payload.pagination?.total || list.length };
  }
  return payload;
};

export const getAsset = async (id) => {
  const response = await axiosInstance.get(`/assets/${id}`);
  return normalizeAsset(response.data?.data);
};

export const getAssetByCode = async (code) => {
  const response = await axiosInstance.get('/assets/lookup', { params: { code } });
  return normalizeAsset(response.data?.data);
};

export const createAsset = async (data) => {
  const response = await axiosInstance.post('/assets', data);
  return normalizeAsset(response.data?.data);
};

export const updateAsset = async (id, data) => {
  const response = await axiosInstance.put(`/assets/${id}`, data);
  return normalizeAsset(response.data?.data);
};

export const deleteAsset = async (id) => {
  const response = await axiosInstance.delete(`/assets/${id}`);
  return response.data?.data;
};

export const bulkUpdateAssetStatus = async ({ ids = [], status }) => {
  const response = await axiosInstance.post('/assets/bulk-status', { ids, status });
  return response.data?.data;
};

export const getAssetHistory = async (id) => {
  const response = await axiosInstance.get(`/assets/${id}/history`);
  return response.data?.data;
};

export const generateAssetQR = async (id) => {
  const response = await axiosInstance.get(`/assets/${id}/qr-code`);
  return response.data?.data;
};

export const bulkImportAssets = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await axiosInstance.post('/assets/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.data;
  } catch (error) {
    throw error;
  }
};

export const downloadAssetImportTemplate = async () => {
  const response = await axiosInstance.get('/assets/import/template', {
    responseType: 'blob',
  });
  return response.data;
};

export const getAssetCategories = async () => {
  const response = await axiosInstance.get('/assets/categories');
  return response.data?.data;
};

export const uploadAssetImage = async (assetId, file) => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await axiosInstance.put(`/assets/${assetId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.data;
  } catch (err) {
    logger.error('uploadAssetImage failed', err);
    throw err;
  }
};
