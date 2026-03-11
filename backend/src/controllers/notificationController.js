// Notification Controller
const notificationService = require('../services/notificationService');
const response = require('../utils/response');
const { NotFoundError } = require('../utils/errorHandler');

const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unread, dueSoonDays = 7 } = req.query;
    await notificationService.ensureDueSoonNotifications(req.user, parseInt(dueSoonDays));
    const result = await notificationService.getNotifications(
      req.user.organization,
      req.user.id,
      parseInt(page),
      parseInt(limit),
      unread === 'true'
    );
    response.success(res, 'Notifications retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markRead(req.user.organization, req.user.id, req.params.id);
    if (!notification) throw new NotFoundError('Notification');
    response.success(res, 'Notification marked as read', notification);
  } catch (error) {
    next(error);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    await notificationService.markAllRead(req.user.organization, req.user.id);
    response.success(res, 'All notifications marked as read', null);
  } catch (error) {
    next(error);
  }
};

const sendTechnicianMessage = async (req, res, next) => {
  try {
    const { message } = req.body || {};
    if (!message || !String(message).trim()) {
      return response.badRequest(res, 'Message is required');
    }
    const notifications = await notificationService.notifyAdminsAndManagers(
      req.user.organization,
      req.user,
      String(message).trim()
    );
    response.success(res, 'Message sent', { sent: notifications.length });
  } catch (error) {
    next(error);
  }
};

const sendReplyToUser = async (req, res, next) => {
  try {
    const { userId, message } = req.body || {};
    if (!userId) {
      return response.badRequest(res, 'User ID is required');
    }
    if (!message || !String(message).trim()) {
      return response.badRequest(res, 'Message is required');
    }
    const result = await notificationService.notifyUser(
      req.user.organization,
      userId,
      req.user,
      String(message).trim()
    );
    response.success(res, 'Reply sent', { sent: !!result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  sendTechnicianMessage,
  sendReplyToUser
};
