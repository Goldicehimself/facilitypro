// Notification Service
const Notification = require('../models/Notification');
const WorkOrder = require('../models/WorkOrder');
const PreventiveMaintenance = require('../models/PreventiveMaintenance');
const User = require('../models/User');
const Organization = require('../models/Organization');
const constants = require('../constants/constants');
const logger = require('../utils/logger');

const DEFAULT_NOTIFICATION_SETTINGS = {
  notifyWoCreated: true,
  notifyWoAssigned: true,
  notifyWoOverdue: true,
  notifyPmDue: true,
  notifyEmail: true,
  notifyInApp: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '06:00'
};

const resolveNotificationSettings = (org) => ({
  ...DEFAULT_NOTIFICATION_SETTINGS,
  ...(org?.settings?.notifications || {})
});

// Helper function to check if in-app notification should be sent
const shouldSendInAppNotification = async (organizationId, userId, notificationType) => {
  try {
    // Check org-level in-app setting
    const org = await Organization.findById(organizationId).select('settings.notifications');
    const settings = resolveNotificationSettings(org);
    if (!settings.notifyInApp) return false;

    // Check type-specific org settings
    const typeSettings = {
      'workorder_created': settings.notifyWoCreated,
      'workorder_assigned': settings.notifyWoAssigned,
      'workorder_overdue': settings.notifyWoOverdue,
      'workorder_due_soon': settings.notifyWoOverdue, // Map due soon to overdue setting
      'maintenance_due_soon': settings.notifyPmDue,
      'service_request_created': settings.notifyWoCreated, // Map to work order created for now
      'leave_request_submitted': true,
      'leave_approved': true,
      'leave_rejected': true,
      'technician_message': true, // Always allow admin messages
      'admin_reply': true // Always allow admin replies
    };

    if (typeSettings[notificationType] === false) return false;

    // Check quiet hours
    if (settings.quietHoursEnabled) {
      const now = new Date();
      const currentTime = now.getHours() * 100 + now.getMinutes();
      const startTime = parseInt(settings.quietHoursStart.replace(':', ''), 10);
      const endTime = parseInt(settings.quietHoursEnd.replace(':', ''), 10);

      if (!Number.isNaN(startTime) && !Number.isNaN(endTime)) {
        const inQuietHours = startTime === endTime
          ? true
          : startTime < endTime
            ? currentTime >= startTime && currentTime <= endTime
            : currentTime >= startTime || currentTime <= endTime;

        if (inQuietHours) return false;
      }
    }

    // Check user preference
    const user = await User.findById(userId).select('preferences.inAppNotifications');
    return user?.preferences?.inAppNotifications !== false;
  } catch (error) {
    logger.error('Error checking notification preferences:', error?.message || error);
    return false; // Default to not sending on error
  }
};

// Helper function to filter users based on preferences
const filterUsersByPreferences = async (organizationId, userIds, notificationType) => {
  const filtered = [];
  for (const userId of userIds) {
    if (await shouldSendInAppNotification(organizationId, userId, notificationType)) {
      filtered.push(userId);
    }
  }
  return filtered;
};

const createNotification = async (payload, options = {}) => {
  try {
    // Check if user should receive this notification
    if (!options.force) {
      const shouldSend = await shouldSendInAppNotification(payload.organization, payload.user, payload.type);
      if (!shouldSend) return null;
    }

    return await Notification.create(payload);
  } catch (error) {
    if (error.code === 11000) {
      return null;
    }
    throw error;
  }
};

const createNotificationsForUsers = async (userIds, payload, options = {}) => {
  if (!userIds || userIds.length === 0) return [];

  // Filter users based on preferences
  const allowedUserIds = options.force
    ? userIds
    : await filterUsersByPreferences(payload.organization, userIds, payload.type);
  if (!options.force && allowedUserIds.length === 0) return [];

  const notifications = [];

  for (const userId of allowedUserIds) {
    try {
      const notification = await createNotification({ ...payload, user: userId }, options);
      if (notification) {
        notifications.push(notification);
      }
    } catch (error) {
      // continue on error to avoid blocking other users; log for diagnosis
      logger.error('Failed to create individual notification', { userId, error: error.message || error });
    }
  }

  return notifications;
};

const getNotifications = async (organizationId, userId, page = 1, limit = 20, unreadOnly = false) => {
  const skip = (page - 1) * limit;
  const filter = { user: userId, organization: organizationId };
  if (unreadOnly) filter.read = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, organization: organizationId, read: false })
  ]);

  return {
    notifications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    },
    unreadCount
  };
};

const markRead = async (organizationId, userId, notificationId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId, organization: organizationId },
    { read: true },
    { new: true }
  );
};

const markAllRead = async (organizationId, userId) => {
  return Notification.updateMany({ user: userId, organization: organizationId, read: false }, { read: true });
};

const getRoleUserIds = async (roles = [], organizationId) => {
  if (!roles.length) return [];
  console.log('Getting users with roles:', roles, 'in organization:', organizationId);
  const users = await User.find({ role: { $in: roles }, organization: organizationId }).select('_id role email firstName lastName active');
  console.log('Found users:', users.map(u => ({ id: u._id, role: u.role, email: u.email, active: u.active })));
  return users.filter(u => u.active).map((u) => u._id);
};

const ensureDueSoonNotifications = async (user, days = 7) => {
  const now = new Date();
  const due = new Date();
  due.setDate(due.getDate() + days);

  const overdueFilter = {
    organization: user.organization,
    dueDate: { $lt: now },
    status: { $nin: [constants.WORK_ORDER_STATUS.COMPLETED, constants.WORK_ORDER_STATUS.CANCELLED] }
  };

  const workOrderFilter = {
    organization: user.organization,
    dueDate: { $gte: now, $lte: due },
    status: { $nin: [constants.WORK_ORDER_STATUS.COMPLETED, constants.WORK_ORDER_STATUS.CANCELLED] }
  };

  if (user.role === constants.ROLES.ADMIN || user.role === constants.ROLES.FACILITY_MANAGER) {
    // no extra filter
  } else if (user.role === constants.ROLES.TECHNICIAN || user.role === constants.ROLES.VENDOR) {
    overdueFilter.$or = [
      { assignedTo: user.id },
      { team: user.id },
      { createdBy: user.id }
    ];
    workOrderFilter.$or = [
      { assignedTo: user.id },
      { team: user.id },
      { createdBy: user.id }
    ];
  } else {
    return;
  }

  const overdueWorkOrders = await WorkOrder.find(overdueFilter).select('_id title dueDate');
  for (const workOrder of overdueWorkOrders) {
    await createNotification({
      user: user.id,
      organization: user.organization,
      title: 'Work order overdue',
      message: `${workOrder.title} is overdue`,
      type: 'workorder_overdue',
      entityType: 'WorkOrder',
      entityId: workOrder._id,
      link: `/work-orders/${workOrder._id}`,
      dedupeKey: `workorder-overdue-${workOrder._id}`
    });
  }

  const workOrders = await WorkOrder.find(workOrderFilter).select('_id title dueDate');
  for (const workOrder of workOrders) {
    await createNotification({
      user: user.id,
      organization: user.organization,
      title: 'Work order due soon',
      message: `${workOrder.title} is due soon`,
      type: 'workorder_due_soon',
      entityType: 'WorkOrder',
      entityId: workOrder._id,
      link: `/work-orders/${workOrder._id}`,
      dedupeKey: `workorder-due-${workOrder._id}`
    });
  }

  const maintenanceFilter = {
    organization: user.organization,
    nextDueDate: { $gte: now, $lte: due },
    active: true
  };

  if (user.role === constants.ROLES.ADMIN || user.role === constants.ROLES.FACILITY_MANAGER) {
    // no extra filter
  } else if (user.role === constants.ROLES.TECHNICIAN || user.role === constants.ROLES.VENDOR) {
    maintenanceFilter.assignedTo = user.id;
  } else {
    return;
  }

  const maintenances = await PreventiveMaintenance.find(maintenanceFilter).select('_id name nextDueDate');
  for (const maintenance of maintenances) {
    await createNotification({
      user: user.id,
      organization: user.organization,
      title: 'Maintenance due soon',
      message: `${maintenance.name} is due soon`,
      type: 'maintenance_due_soon',
      entityType: 'PreventiveMaintenance',
      entityId: maintenance._id,
      link: '/preventive-maintenance',
      dedupeKey: `maintenance-due-${maintenance._id}`
    });
  }
};

const notifyAdminsAndManagers = async (organizationId, sender, message, meta = {}) => {
  const recipients = await getRoleUserIds(
    [constants.ROLES.ADMIN, constants.ROLES.FACILITY_MANAGER],
    organizationId
  );
  if (!recipients.length) return [];
  const senderName = [sender?.firstName, sender?.lastName].filter(Boolean).join(' ').trim() || sender?.email || 'Technician';
  const payload = {
    organization: organizationId,
    title: 'Message from technician',
    message: message,
    type: 'technician_message',
    entityType: 'User',
    entityId: sender?._id || sender?.id,
    link: '/technician-portal',
    metadata: {
      senderId: sender?._id || sender?.id,
      senderName,
      senderEmail: sender?.email || '',
      senderPhone: sender?.phone || '',
      ...meta
    }
  };
  return createNotificationsForUsers(recipients, payload);
};

const notifyUser = async (organizationId, recipientId, sender, message, meta = {}) => {
  if (!recipientId) return null;
  const senderName = [sender?.firstName, sender?.lastName].filter(Boolean).join(' ').trim() || sender?.email || 'Admin';
  const payload = {
    organization: organizationId,
    title: 'Reply from admin',
    message: message,
    type: 'admin_reply',
    entityType: 'User',
    entityId: sender?._id || sender?.id,
    link: '/technician-portal',
    metadata: {
      senderId: sender?._id || sender?.id,
      senderName,
      senderEmail: sender?.email || '',
      senderPhone: sender?.phone || '',
      ...meta
    }
  };
  return createNotification({ ...payload, user: recipientId });
};

module.exports = {
  createNotification,
  createNotificationsForUsers,
  getNotifications,
  markRead,
  markAllRead,
  getRoleUserIds,
  ensureDueSoonNotifications,
  notifyAdminsAndManagers,
  notifyUser
};
