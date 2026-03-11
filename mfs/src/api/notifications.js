import axiosInstance from './axiosConfig';

export const fetchNotifications = async ({ page = 1, limit = 20, unread = false, dueSoonDays = 7 } = {}) => {
  const response = await axiosInstance.get('/notifications', {
    params: { page, limit, unread, dueSoonDays },
  });
  return response.data?.data;
};

export const markNotificationRead = async (id) => {
  const response = await axiosInstance.patch(`/notifications/${id}/read`);
  return response.data?.data;
};

export const markAllNotificationsRead = async () => {
  const response = await axiosInstance.patch('/notifications/read-all');
  return response.data?.data;
};

export const sendMessageToAdmins = async (message) => {
  const response = await axiosInstance.post('/notifications/message-admins', { message });
  return response.data?.data;
};

export const sendReplyToUser = async (userId, message) => {
  const response = await axiosInstance.post('/notifications/reply-user', { userId, message });
  return response.data?.data;
};
