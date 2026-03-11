import axiosInstance from './axiosConfig';

export const createLeave = async (payload) => {
  const response = await axiosInstance.post('/leaves', payload);
  return response.data?.data;
};

export const fetchMyLeaves = async () => {
  const response = await axiosInstance.get('/leaves/my');
  return response.data?.data;
};

export const fetchPendingLeaves = async () => {
  const response = await axiosInstance.get('/leaves/pending');
  return response.data?.data;
};

export const fetchAllLeaves = async (params = {}) => {
  const response = await axiosInstance.get('/leaves', { params });
  return response.data?.data;
};

export const approveLeave = async (id, note) => {
  const response = await axiosInstance.patch(`/leaves/${id}/approve`, { note });
  return response.data?.data;
};

export const rejectLeave = async (id, note) => {
  const response = await axiosInstance.patch(`/leaves/${id}/reject`, { note });
  return response.data?.data;
};
