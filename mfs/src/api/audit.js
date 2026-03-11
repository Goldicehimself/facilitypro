import axiosInstance from './axiosConfig';

export const getLoginHistory = async (userId) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token || token.startsWith('local-')) {
    return [];
  }

  try {
    const response = await axiosInstance.get('/audit/login-history', {
      params: userId ? { userId } : undefined,
      suppressToast: true,
    });
    return response.data?.data || response.data;
  } catch (error) {
    return [];
  }
};
