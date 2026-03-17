import axiosInstance from './axiosConfig';

export const getRecentActivities = async (limit = 10) => {
  const response = await axiosInstance.get('/activities/recent', {
    params: { limit },
    suppressToast: true
  });
  return response.data?.data || [];
};

export const clearRecentActivities = async () => {
  const response = await axiosInstance.delete('/activities/recent', {
    suppressToast: true
  });
  return response.data?.data || { cleared: false };
};
