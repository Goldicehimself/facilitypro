import axiosInstance from './axiosConfig';

const normalizeUser = (user) => {
  if (!user) return user;
  return {
    ...user,
    id: user.id || user._id,
    name: user.name || [user.firstName, user.lastName].filter(Boolean).join(' '),
  };
};

const normalizeAsset = (asset) => {
  if (!asset) return asset;
  return {
    ...asset,
    id: asset.id || asset._id,
  };
};

const normalizeMaintenance = (maintenance) => {
  if (!maintenance) return maintenance;
  return {
    ...maintenance,
    id: maintenance.id || maintenance._id,
    assignedTo: normalizeUser(maintenance.assignedTo),
    asset: normalizeAsset(maintenance.asset),
  };
};

export const getPreventiveMaintenances = async (params = {}) => {
  const response = await axiosInstance.get('/preventive-maintenance', { params, suppressToast: true });
  const payload = response.data?.data;
  if (Array.isArray(payload)) {
    return payload.map(normalizeMaintenance);
  }
  if (Array.isArray(payload?.maintenances)) {
    return {
      ...payload,
      maintenances: payload.maintenances.map(normalizeMaintenance),
    };
  }
  return payload;
};

export const getPreventiveMaintenance = async (id) => {
  const response = await axiosInstance.get(`/preventive-maintenance/${id}`);
  return normalizeMaintenance(response.data?.data);
};

export const createPreventiveMaintenance = async (data) => {
  const response = await axiosInstance.post('/preventive-maintenance', data);
  return normalizeMaintenance(response.data?.data);
};

export const updatePreventiveMaintenance = async (id, data) => {
  const response = await axiosInstance.put(`/preventive-maintenance/${id}`, data);
  return normalizeMaintenance(response.data?.data);
};

export const deletePreventiveMaintenance = async (id) => {
  const response = await axiosInstance.delete(`/preventive-maintenance/${id}`);
  return response.data?.data;
};

export const getUpcomingMaintenance = async (days = 30) => {
  const response = await axiosInstance.get('/preventive-maintenance/upcoming', { params: { days } });
  const payload = response.data?.data;
  if (Array.isArray(payload?.maintenances)) {
    return payload.maintenances.map(normalizeMaintenance);
  }
  return payload;
};

export const markMaintenancePerformed = async (id, notes = '') => {
  const response = await axiosInstance.patch(`/preventive-maintenance/${id}/perform`, { notes });
  return normalizeMaintenance(response.data?.data);
};

export const getComplianceMetrics = async (params = {}) => {
  const response = await axiosInstance.get('/preventive-maintenance/compliance', { params });
  return response.data?.data;
};
