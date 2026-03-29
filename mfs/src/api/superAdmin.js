import axiosInstance from './axiosConfig';

export const getSuperAdminOverview = async () => {
  const response = await axiosInstance.get('/super-admin/overview');
  return response.data?.data;
};

export const listSuperAdminOrganizations = async (params = {}) => {
  const response = await axiosInstance.get('/super-admin/organizations', { params });
  return response.data?.data;
};

export const createSuperAdminOrganization = async (payload) => {
  const response = await axiosInstance.post('/super-admin/organizations', payload);
  return response.data?.data;
};

export const updateSuperAdminOrganizationStatus = async (orgId, status) => {
  const response = await axiosInstance.patch(`/super-admin/organizations/${orgId}/status`, { status });
  return response.data?.data;
};

export const assignSuperAdminOrgAdmin = async (orgId, userId) => {
  const response = await axiosInstance.patch(`/super-admin/organizations/${orgId}/admin`, { userId });
  return response.data?.data;
};

export const updateSuperAdminFeatureFlags = async (orgId, flags) => {
  const response = await axiosInstance.patch(`/super-admin/organizations/${orgId}/feature-flags`, { flags });
  return response.data?.data;
};

export const updateSuperAdminLicensing = async (orgId, payload) => {
  const response = await axiosInstance.patch(`/super-admin/organizations/${orgId}/licensing`, payload);
  return response.data?.data;
};

export const updateSuperAdminBilling = async (orgId, billing) => {
  const response = await axiosInstance.patch(`/super-admin/organizations/${orgId}/billing`, { billing });
  return response.data?.data;
};

export const getSuperAdminIntegrations = async (orgId) => {
  const response = await axiosInstance.get(`/super-admin/organizations/${orgId}/integrations`);
  return response.data?.data;
};

export const revokeSuperAdminApiKey = async (orgId, keyId) => {
  const response = await axiosInstance.patch(`/super-admin/organizations/${orgId}/api-keys/${keyId}/revoke`);
  return response.data?.data;
};

export const listSuperAdminUsers = async (params = {}) => {
  const response = await axiosInstance.get('/super-admin/users', { params });
  return response.data?.data;
};

export const updateSuperAdminUserStatus = async (userId, active) => {
  const response = await axiosInstance.patch(`/super-admin/users/${userId}/active`, { active });
  return response.data?.data;
};

export const updateSuperAdminUserRole = async (userId, role) => {
  const response = await axiosInstance.patch(`/super-admin/users/${userId}/role`, { role });
  return response.data?.data;
};

export const forceSuperAdminPasswordReset = async (userId) => {
  const response = await axiosInstance.post(`/super-admin/users/${userId}/force-password-reset`);
  return response.data?.data;
};

export const revokeSuperAdminSessions = async (userId) => {
  const response = await axiosInstance.post(`/super-admin/users/${userId}/revoke-sessions`);
  return response.data?.data;
};

export const impersonateSuperAdminUser = async (userId) => {
  const response = await axiosInstance.post(`/super-admin/users/${userId}/impersonate`);
  return response.data?.data;
};

export const listSuperAdminAuditLogs = async (params = {}) => {
  const response = await axiosInstance.get('/super-admin/audit', { params });
  return response.data?.data;
};
