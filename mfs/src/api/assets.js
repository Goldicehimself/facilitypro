import axiosInstance from './axiosConfig';
import logger from '../utils/logger';
import * as assetService from '../services/assetService';

const normalizeAsset = (asset) => {
  if (!asset) return asset;
  return {
    ...asset,
    id: asset.id || asset._id,
  };
};

export const getAssets = async (params = {}) => {
  try {
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
  } catch (error) {
    return await assetService.getAssets(params);
  }
};

export const getAsset = async (id) => {
  try {
    const response = await axiosInstance.get(`/assets/${id}`);
    return normalizeAsset(response.data?.data);
  } catch (error) {
    return await assetService.getAsset(id);
  }
};

export const getAssetByCode = async (code) => {
  try {
    const response = await axiosInstance.get('/assets/lookup', { params: { code } });
    return normalizeAsset(response.data?.data);
  } catch (error) {
    // fallback: try local mock search by assetNumber/serialNumber/qrCode
    const all = await assetService.getAssets({ page: 1, limit: 1000 });
    const list = all.data || [];
    const trimmed = String(code || '').trim();
    return list.find(a => a.assetNumber === trimmed || a.serialNumber === trimmed || a.qrCode === trimmed) || null;
  }
};

export const createAsset = async (data) => {
  try {
    const response = await axiosInstance.post('/assets', data);
    return normalizeAsset(response.data?.data);
  } catch (error) {
    return await assetService.createAsset(data);
  }
};

export const updateAsset = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/assets/${id}`, data);
    return normalizeAsset(response.data?.data);
  } catch (error) {
    return await assetService.updateAsset(id, data);
  }
};

export const deleteAsset = async (id) => {
  try {
    const response = await axiosInstance.delete(`/assets/${id}`);
    return response.data?.data;
  } catch (error) {
    return await assetService.deleteAsset(id);
  }
};

export const bulkUpdateAssetStatus = async ({ ids = [], status }) => {
  const response = await axiosInstance.post('/assets/bulk-status', { ids, status });
  return response.data?.data;
};

export const getAssetHistory = async (id) => {
  try {
    const response = await axiosInstance.get(`/assets/${id}/history`);
    return response.data?.data;
  } catch (error) {
    // not implemented in mock
    return [];
  }
};

export const generateAssetQR = async (id) => {
  try {
    const response = await axiosInstance.get(`/assets/${id}/qr-code`);
    return response.data?.data;
  } catch (error) {
    // return mock QR (data URL) - simple placeholder
    return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='100%' height='100%' fill='#f7fafc'/><text x='50%' y='50%' font-size='16' text-anchor='middle' dominant-baseline='middle' fill='#2d3748'>QR:${id}</text></svg>`)}`;
  }
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
  try {
    const response = await axiosInstance.get('/assets/categories');
    return response.data?.data;
  } catch (error) {
    // derive categories from mock
    const all = await assetService.getAssets({ page: 1, limit: 1000 });
    const categories = Array.from(new Set((all.data || []).map(a => a.category))).map(c => ({ name: c, count: (all.data || []).filter(x => x.category === c).length }));
    return categories;
  }
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
    // Fallback for local/mock environment: convert file to data URL and persist into the mock asset
    try {
      // helper to convert File to data URL
      const fileToDataUrl = (f) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });

      const dataUrl = await fileToDataUrl(file);
      const asset = await assetService.getAsset(assetId);
      const newUrl = dataUrl;
      const updated = { ...asset, imageUrl: newUrl, imageUrls: [newUrl, ...(asset.imageUrls || [])] };
      await assetService.updateAsset(assetId, updated);
      return { imageUrl: newUrl };
    } catch (fallbackErr) {
      logger.error('uploadAssetImage fallback failed', fallbackErr);
      throw err;
    }
  }
};
