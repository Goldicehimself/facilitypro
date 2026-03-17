import axiosInstance from './axiosConfig';

const normalizeUser = (user) => {
  if (!user) return user;
  return {
    ...user,
    id: user.id || user._id,
    name: user.name || [user.firstName, user.lastName].filter(Boolean).join(' '),
  };
};

const normalizeRequest = (request) => {
  if (!request) return request;
  return {
    ...request,
    id: request.id || request._id,
    startedAt: request.startedAt || request.startDate,
    completedAt: request.completedAt,
    requester: normalizeUser(request.requester),
    assignee: normalizeUser(request.assignee),
  };
};

export const getServiceRequests = async (params = {}) => {
  const response = await axiosInstance.get('/service-requests', { params, suppressToast: true });
  const payload = response.data?.data;
  if (Array.isArray(payload)) {
    return payload.map(normalizeRequest);
  }
  if (Array.isArray(payload?.requests)) {
    return {
      ...payload,
      requests: payload.requests.map(normalizeRequest),
    };
  }
  return payload;
};

export const getServiceRequest = async (id) => {
  const response = await axiosInstance.get(`/service-requests/${id}`);
  return normalizeRequest(response.data?.data);
};

export const getServiceRequestSummary = async () => {
  const response = await axiosInstance.get('/service-requests/summary', { suppressToast: true });
  return response.data?.data;
};

export const createServiceRequest = async (data) => {
  const response = await axiosInstance.post('/service-requests', data);
  return normalizeRequest(response.data?.data);
};

export const updateServiceRequest = async (id, data) => {
  const response = await axiosInstance.put(`/service-requests/${id}`, data);
  return normalizeRequest(response.data?.data);
};

export const assignServiceRequest = async (id, assigneeId, note = '') => {
  const response = await axiosInstance.post(`/service-requests/${id}/assign`, { assigneeId, note });
  return normalizeRequest(response.data?.data);
};

export const updateServiceRequestStatus = async (id, status, meta = {}) => {
  const response = await axiosInstance.patch(`/service-requests/${id}/status`, { status, ...meta });
  return normalizeRequest(response.data?.data);
};

export const deleteServiceRequest = async (id) => {
  const response = await axiosInstance.delete(`/service-requests/${id}`);
  return response.data?.data;
};
