import axiosInstance from './axiosConfig';

export const createFundRequest = async (payload) => {
  const response = await axiosInstance.post('/funds', payload);
  return response.data?.data;
};

export const fetchMyFundRequests = async (params = {}) => {
  const response = await axiosInstance.get('/funds/my', { params });
  return response.data?.data;
};

export const fetchFundRequests = async (params = {}) => {
  const response = await axiosInstance.get('/funds', { params });
  return response.data?.data;
};

export const approveFundRequest = async (id) => {
  const response = await axiosInstance.patch(`/funds/${id}/approve`);
  return response.data?.data;
};

export const rejectFundRequest = async (id) => {
  const response = await axiosInstance.patch(`/funds/${id}/reject`);
  return response.data?.data;
};
