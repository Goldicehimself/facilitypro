// Notification Controller
const notificationService = require('../services/notificationService');
const response = require('../utils/response');
const { NotFoundError, AuthorizationError } = require('../utils/errorHandler');
const Notification = require('../models/Notification');
const constants = require('../constants/constants');

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

const debugNotifications = async (req, res, next) => {
  try {
    const role = req.user?.role;
    if (![constants.ROLES.ADMIN, constants.ROLES.FACILITY_MANAGER].includes(role)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const { userId, limit = 20 } = req.query;
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
    const orgId = req.user.organization;
    const targetUserId = userId || req.user.id;

    const [orgLatest, userLatest, orgCount, userCount] = await Promise.all([
      Notification.find({ organization: orgId }).sort({ createdAt: -1 }).limit(safeLimit),
      Notification.find({ organization: orgId, user: targetUserId }).sort({ createdAt: -1 }).limit(safeLimit),
      Notification.countDocuments({ organization: orgId }),
      Notification.countDocuments({ organization: orgId, user: targetUserId })
    ]);

    response.success(res, 'Debug notifications', {
      orgId,
      targetUserId,
      orgCount,
      userCount,
      orgLatest,
      userLatest
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  sendTechnicianMessage,
  sendReplyToUser,
  debugNotifications
};
