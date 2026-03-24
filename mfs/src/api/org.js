import axiosInstance from './axiosConfig';

export const fetchMembers = async (params = {}) => {
  const response = await axiosInstance.get('/org/members', { params });
  return response.data?.data;
};

export const fetchInvites = async (params = {}) => {
  const response = await axiosInstance.get('/org/invites', { params });
  return response.data?.data;
};

export const disableOrg = async () => {
  const response = await axiosInstance.patch('/org/disable');
  return response.data?.data;
};

export const enableOrg = async () => {
  const response = await axiosInstance.patch('/org/enable');
  return response.data?.data;
};

export const setUserActive = async (userId, active) => {
  const response = await axiosInstance.patch(`/org/users/${userId}/active`, { active });
  return response.data?.data;
};

export const revokeInvite = async (code) => {
  const response = await axiosInstance.delete(`/org/invites/${code}`);
  return response.data?.data;
};

export const createInvite = async ({ role, expiresAt, email, message } = {}) => {
  const response = await axiosInstance.post('/auth/invite', { role, expiresAt, email, message });
  return response.data?.data;
};

export const getOrgSettings = async () => {
  const response = await axiosInstance.get('/org/settings');
  return response.data?.data;
};

export const updateOrgSettings = async (payload = {}) => {
  const response = await axiosInstance.put('/org/settings', payload);
  return response.data?.data;
};

export const getPublicOrgSecurityPolicy = async ({ orgCode, inviteCode } = {}) => {
  const response = await axiosInstance.get('/org/public-security-policy', {
    params: { orgCode, inviteCode },
    suppressToast: true
  });
  return response.data?.data;
};

export const getOrgIntegrations = async () => {
  const response = await axiosInstance.get('/org/integrations');
  return response.data?.data;
};

export const createOrgWebhook = async ({ name, url, type, events, active } = {}) => {
  const response = await axiosInstance.post('/org/integrations/webhooks', { name, url, type, events, active });
  return response.data?.data;
};

export const deleteOrgWebhook = async (id) => {
  const response = await axiosInstance.delete(`/org/integrations/webhooks/${id}`);
  return response.data?.data;
};

export const createOrgApiKey = async ({ name, scopes, expiresAt, rateLimit } = {}) => {
  const response = await axiosInstance.post('/org/integrations/api-keys', { name, scopes, expiresAt, rateLimit });
  return response.data?.data;
};

export const revokeOrgApiKey = async (id) => {
  const response = await axiosInstance.delete(`/org/integrations/api-keys/${id}`);
  return response.data?.data;
};

export const updateCertificateStatus = async (userId, { publicId, status, reviewNotes } = {}) => {
  const response = await axiosInstance.patch(`/org/users/${userId}/certificates/status`, {
    publicId,
    status,
    reviewNotes
  });
  return response.data?.data;
};
