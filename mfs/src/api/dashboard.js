import axiosInstance from './axiosConfig';

export const getDashboardData = async () => {
  const response = await axiosInstance.get('/dashboard', { suppressToast: true });
  return response.data?.data || response.data;
};

export const getRecentActivities = async () => {
  const response = await axiosInstance.get('/dashboard/activities', { suppressToast: true });
  return response.data;
};
