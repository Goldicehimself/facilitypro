import axiosInstance from './axiosConfig';

const normalizeItem = (item) => {
  if (!item) return item;
  return {
    ...item,
    id: item.id || item._id,
  };
};

export const getInventoryItems = async (params = {}) => {
  const response = await axiosInstance.get('/inventory', { params, suppressToast: true });
  const payload = response.data?.data;
  if (Array.isArray(payload)) {
    const items = payload.map(normalizeItem);
    return { items, pagination: { total: items.length, page: 1, limit: items.length, totalPages: 1 } };
  }
  if (Array.isArray(payload?.items)) {
    return {
      ...payload,
      items: payload.items.map(normalizeItem),
    };
  }
  return payload;
};

export const getInventoryItem = async (id) => {
  const response = await axiosInstance.get(`/inventory/${id}`);
  return normalizeItem(response.data?.data);
};

export const getInventorySummary = async () => {
  const response = await axiosInstance.get('/inventory/summary', { suppressToast: true });
  return response.data?.data;
};

export const createInventoryItem = async (data) => {
  const response = await axiosInstance.post('/inventory', data);
  return normalizeItem(response.data?.data);
};

export const updateInventoryItem = async (id, data) => {
  const response = await axiosInstance.put(`/inventory/${id}`, data);
  return normalizeItem(response.data?.data);
};

export const deleteInventoryItem = async (id) => {
  const response = await axiosInstance.delete(`/inventory/${id}`);
  return response.data?.data;
};
