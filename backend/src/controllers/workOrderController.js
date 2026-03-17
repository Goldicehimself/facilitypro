// Work Order Controller
const workOrderService = require('../services/workOrderService');
const response = require('../utils/response');
const { ValidationError, AuthorizationError } = require('../utils/errorHandler');
const constants = require('../constants/constants');
const notificationService = require('../services/notificationService');
const activityService = require('../services/activityService');
const webhookService = require('../services/webhookService');
const auditService = require('../services/auditService');
const User = require('../models/User');
const WorkOrder = require('../models/WorkOrder');
const Asset = require('../models/Asset');
const userStatsService = require('../services/userStatsService');
const { countApprovedCertificates } = require('../utils/certificateUtils');

const ensureUsersInOrg = async (organizationId, userIds = []) => {
  if (!userIds || userIds.length === 0) return;
  const uniqueIds = [...new Set(userIds.filter(Boolean).map((id) => id.toString()))];
  if (!uniqueIds.length) return;
  const count = await User.countDocuments({
    _id: { $in: uniqueIds },
    organization: organizationId,
    active: true
  });
  if (count !== uniqueIds.length) {
    throw new ValidationError('One or more users are outside your organization or inactive');
  }
};

const ensureTechnicianCertified = async (organizationId, userId, message) => {
  if (!userId) return;
  const user = await User.findOne({ _id: userId, organization: organizationId }).select('role certificates active');
  if (!user || user.active === false) {
    throw new ValidationError('Assigned user must belong to your organization and be active');
  }
  if (user.role === constants.ROLES.TECHNICIAN) {
    const certified = countApprovedCertificates(user.certificates) > 0;
    if (!certified) {
      throw new AuthorizationError(message || 'Certification required for this action');
    }
  }
};

const ensureAssetInOrg = async (organizationId, assetId) => {
  if (!assetId) throw new ValidationError('Asset is required');
  const asset = await Asset.findOne({ _id: assetId, organization: organizationId }).select('_id');
  if (!asset) {
    throw new ValidationError('Asset does not belong to your organization');
  }
};

const ensureVendorInOrg = async (organizationId, vendorId) => {
  if (!vendorId) return;
  const Vendor = require('../models/Vendor');
  const vendor = await Vendor.findOne({ _id: vendorId, organization: organizationId }).select('_id');
  if (!vendor) {
    throw new ValidationError('Vendor does not belong to your organization');
  }
};

const buildBulkAssignFilter = (organizationId, { ids = null, filters = {} } = {}) => {
  const scopedFilters = { organization: organizationId };
  if (Array.isArray(ids) && ids.length > 0) {
    scopedFilters._id = { $in: ids };
    return scopedFilters;
  }
  if (filters.status && filters.status !== 'all') scopedFilters.status = filters.status;
  if (filters.priority && filters.priority !== 'all') scopedFilters.priority = filters.priority;
  if (filters.assignee && filters.assignee !== 'all') scopedFilters.assignedTo = filters.assignee;
  if (filters.category && filters.category !== 'all') scopedFilters.category = filters.category;
  if (filters.location && filters.location !== 'all') scopedFilters.location = filters.location;
  if (filters.search && filters.search.trim()) {
    const regex = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    scopedFilters.$or = [
      { workOrderNumber: regex },
      { title: regex },
      { description: regex }
    ];
  }
  return scopedFilters;
};

const getOrgAdminId = async (organizationId) => {
  const admin = await User.findOne({ organization: organizationId, role: constants.ROLES.ADMIN }).select('_id');
  return admin?._id;
};

const getWorkOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      assignedTo,
      search,
      category,
      location,
      dateRange
    } = req.query;
    const filters = {};
    const organizationId = req.user.organization;

    if (status && status !== 'all') filters.status = status;
    if (priority && priority !== 'all') filters.priority = priority;
    if (assignedTo && assignedTo !== 'all') filters.assignedTo = assignedTo;
    if (req.query.vendor && req.query.vendor !== 'all') filters.vendor = req.query.vendor;
    if (location && location !== 'all') filters.location = location;

    if (category && category !== 'all') {
      const categoryFilter = {
        $or: [
          { category },
          { serviceCategory: category },
          { serviceType: category }
        ]
      };
      filters.$and = filters.$and ? [...filters.$and, categoryFilter] : [categoryFilter];
    }

    if (search && search.trim()) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      const searchFilter = {
        $or: [
          { workOrderNumber: regex },
          { title: regex },
          { description: regex }
        ]
      };
      filters.$and = filters.$and ? [...filters.$and, searchFilter] : [searchFilter];
    }

    if (dateRange && dateRange !== 'all') {
      const days = Number(dateRange);
      if (!Number.isNaN(days)) {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        filters.createdAt = { $gte: cutoff };
      }
    }

    if (req.user?.role === constants.ROLES.TECHNICIAN) {
      const techFilter = { $or: [{ assignedTo: req.user.id }, { team: req.user.id }] };
      filters.$and = filters.$and ? [...filters.$and, techFilter] : [techFilter];
    }

    const result = await workOrderService.getWorkOrders(
      organizationId,
      filters,
      parseInt(page),
      parseInt(limit)
    );
    response.success(res, 'Work orders retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

const getWorkOrderById = async (req, res, next) => {
  try {
    const workOrder = await workOrderService.getWorkOrderById(req.user.organization, req.params.id);
    if (req.user?.role === constants.ROLES.TECHNICIAN) {
      const assignedToId = workOrder.assignedTo?._id?.toString();
      const teamIds = (workOrder.team || []).map((member) => member._id?.toString?.() || member.toString());
      if (assignedToId !== req.user.id && !teamIds.includes(req.user.id)) {
        throw new AuthorizationError('Access denied');
      }
    }
    response.success(res, 'Work order retrieved successfully', workOrder);
  } catch (error) {
    next(error);
  }
};

const createWorkOrder = async (req, res, next) => {
  try {
    if (Object.prototype.hasOwnProperty.call(req.body, 'requiresCertification')) {
      const allowedRoles = [constants.ROLES.ADMIN, constants.ROLES.FACILITY_MANAGER];
      if (!allowedRoles.includes(req.user?.role)) {
        throw new AuthorizationError('Only admins can mark work orders as certification-required');
      }
    }
    await ensureAssetInOrg(req.user.organization, req.body.asset);
    await ensureVendorInOrg(req.user.organization, req.body.vendor);
    await ensureUsersInOrg(req.user.organization, [
      req.body.assignedTo,
      ...(req.body.team || [])
    ]);
    if (req.body.requiresCertification) {
      const assignees = [
        req.body.assignedTo,
        ...(req.body.team || [])
      ].filter(Boolean);
      for (const assigneeId of assignees) {
        await ensureTechnicianCertified(
          req.user.organization,
          assigneeId,
          'Certification required to assign this work order'
        );
      }
    }
    if (req.user?.authType === 'api_key') {
      req.body.createdBy = await getOrgAdminId(req.user.organization);
    } else {
      req.body.createdBy = req.user.id;
    }
    const workOrder = await workOrderService.createWorkOrder(req.user.organization, req.body);
    webhookService.emitWebhookEvent(req.user.organization, 'workorder.created', { workOrder });
    activityService.broadcast({
      type: 'workorder_created',
      message: `${workOrder.title} created`,
      entityType: 'WorkOrder',
      entityId: workOrder._id,
      link: `/work-orders/${workOrder._id}`,
      createdAt: new Date().toISOString(),
      organization: req.user.organization,
      user: req.user.email
    });
    const adminManagerIds = await notificationService.getRoleUserIds(
      [constants.ROLES.ADMIN, constants.ROLES.FACILITY_MANAGER],
      req.user.organization
    );
    const recipients = new Set(adminManagerIds.map((id) => id.toString()));
    const assignedToId = workOrder.assignedTo?._id || workOrder.assignedTo || null;
    if (assignedToId) recipients.add(assignedToId.toString());
    (workOrder.team || []).forEach((member) => {
      const memberId = member?._id || member;
      if (memberId) recipients.add(memberId.toString());
    });
    recipients.delete(req.user.id);
    if (recipients.size > 0) {
      await notificationService.createNotificationsForUsers([...recipients], {
        organization: req.user.organization,
        title: 'Work order created',
        message: `${workOrder.title} was created`,
        type: 'workorder_created',
        entityType: 'WorkOrder',
        entityId: workOrder._id,
        link: `/work-orders/${workOrder._id}`
      });
    }
    response.created(res, 'Work order created successfully', workOrder);
    if (workOrder.assignedTo) {
      userStatsService.refreshUserStats({
        organizationId: req.user.organization,
        userId: workOrder.assignedTo
      }).catch(() => {});
    }
  } catch (error) {
    next(error);
  }
};

const updateWorkOrder = async (req, res, next) => {
  try {
    let existing = null;
    const hasRequiresFlag = Object.prototype.hasOwnProperty.call(req.body, 'requiresCertification');
    if (hasRequiresFlag) {
      const allowedRoles = [constants.ROLES.ADMIN, constants.ROLES.FACILITY_MANAGER];
      if (!allowedRoles.includes(req.user?.role)) {
        throw new AuthorizationError('Only admins can mark work orders as certification-required');
      }
    }
    if (req.body.asset) {
      await ensureAssetInOrg(req.user.organization, req.body.asset);
    }
    if (req.body.vendor) {
      await ensureVendorInOrg(req.user.organization, req.body.vendor);
    }
    if (req.body.assignedTo || req.body.team) {
      await ensureUsersInOrg(req.user.organization, [
        req.body.assignedTo,
        ...(req.body.team || [])
      ]);
    }
    let previousAssignee = null;
    if (req.body.assignedTo || req.body.team || hasRequiresFlag) {
      existing = await workOrderService.getWorkOrderById(req.user.organization, req.params.id);
      previousAssignee = existing?.assignedTo?._id || existing?.assignedTo || null;
    }
    const requiresCertification = hasRequiresFlag
      ? !!req.body.requiresCertification
      : !!existing?.requiresCertification;
    if (requiresCertification) {
      const assignedToId = req.body.assignedTo || existing?.assignedTo?._id || existing?.assignedTo || null;
      const teamIds = Array.isArray(req.body.team)
        ? req.body.team
        : (existing?.team || []);
      const assignees = [assignedToId, ...teamIds].filter(Boolean);
      for (const assigneeId of assignees) {
        await ensureTechnicianCertified(
          req.user.organization,
          assigneeId,
          'Certification required to assign this work order'
        );
      }
    }
    const workOrder = await workOrderService.updateWorkOrder(req.user.organization, req.params.id, req.body);
    activityService.broadcast({
      type: 'workorder_updated',
      message: `${workOrder.title} updated`,
      entityType: 'WorkOrder',
      entityId: workOrder._id,
      link: `/work-orders/${workOrder._id}`,
      createdAt: new Date().toISOString(),
      organization: req.user.organization,
      user: req.user.email
    });
    response.success(res, 'Work order updated successfully', workOrder);
    if (previousAssignee && previousAssignee.toString() !== String(workOrder.assignedTo?._id || workOrder.assignedTo)) {
      userStatsService.refreshUserStats({
        organizationId: req.user.organization,
        userId: previousAssignee
      }).catch(() => {});
    }
    if (workOrder?.assignedTo?._id || workOrder?.assignedTo) {
      const assigneeId = workOrder.assignedTo._id || workOrder.assignedTo;
      userStatsService.refreshUserStats({
        organizationId: req.user.organization,
        userId: assigneeId
      }).catch(() => {});
    }
  } catch (error) {
    next(error);
  }
};

const updateWorkOrderStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const existing = await workOrderService.getWorkOrderById(req.user.organization, req.params.id);
    if (
      existing?.requiresCertification &&
      req.user?.role === constants.ROLES.TECHNICIAN &&
      [constants.WORK_ORDER_STATUS.IN_PROGRESS, constants.WORK_ORDER_STATUS.COMPLETED].includes(status)
    ) {
      await ensureTechnicianCertified(
        req.user.organization,
        req.user.id,
        'Certification required to start or complete this work order'
      );
    }
    const workOrder = await workOrderService.updateWorkOrderStatus(req.user.organization, req.params.id, status, notes);
    webhookService.emitWebhookEvent(req.user.organization, 'workorder.status_changed', { workOrder, status });
    const recipients = [
      workOrder.createdBy?._id,
      workOrder.assignedTo?._id,
      ...(workOrder.team || []).map((member) => member?._id)
    ].filter(Boolean).map((id) => id.toString());
    const uniqueRecipients = [...new Set(recipients)].filter((id) => id !== req.user.id);

    await notificationService.createNotificationsForUsers(uniqueRecipients, {
      organization: req.user.organization,
      title: 'Work order status updated',
      message: `${workOrder.title} status changed to ${status}`,
      type: 'workorder_status',
      entityType: 'WorkOrder',
      entityId: workOrder._id,
      link: `/work-orders/${workOrder._id}`
    });
    activityService.broadcast({
      type: 'workorder_status',
      message: `${workOrder.title} status changed to ${status}`,
      entityType: 'WorkOrder',
      entityId: workOrder._id,
      link: `/work-orders/${workOrder._id}`,
      createdAt: new Date().toISOString(),
      organization: req.user.organization,
      user: req.user.email
    });
    response.success(res, 'Work order status updated successfully', workOrder);
    if (workOrder?.assignedTo?._id || workOrder?.assignedTo) {
      const assigneeId = workOrder.assignedTo._id || workOrder.assignedTo;
      userStatsService.refreshUserStats({
        organizationId: req.user.organization,
        userId: assigneeId
      }).catch(() => {});
    }
  } catch (error) {
    next(error);
  }
};

const assignWorkOrder = async (req, res, next) => {
  try {
    const { assigneeId } = req.body;
    await ensureUsersInOrg(req.user.organization, [assigneeId]);
    const existing = await workOrderService.getWorkOrderById(req.user.organization, req.params.id);
    if (existing?.requiresCertification) {
      await ensureTechnicianCertified(
        req.user.organization,
        assigneeId,
        'Certification required to assign this work order'
      );
    }
    const previousAssignee = existing?.assignedTo?._id || existing?.assignedTo || null;
    const workOrder = await workOrderService.assignWorkOrder(req.user.organization, req.params.id, assigneeId);
    webhookService.emitWebhookEvent(req.user.organization, 'workorder.assigned', { workOrder, assigneeId });
    if (workOrder.assignedTo?._id) {
      await notificationService.createNotification({
        user: workOrder.assignedTo._id,
        organization: req.user.organization,
        title: 'Work order assigned',
        message: `${workOrder.title} has been assigned to you`,
        type: 'workorder_assigned',
        entityType: 'WorkOrder',
        entityId: workOrder._id,
        link: `/work-orders/${workOrder._id}`
      });
    }
    activityService.broadcast({
      type: 'workorder_assigned',
      message: `${workOrder.title} assigned`,
      entityType: 'WorkOrder',
      entityId: workOrder._id,
      link: `/work-orders/${workOrder._id}`,
      createdAt: new Date().toISOString(),
      organization: req.user.organization,
      user: req.user.email
    });
    response.success(res, 'Work order assigned successfully', workOrder);
    if (assigneeId) {
      userStatsService.refreshUserStats({
        organizationId: req.user.organization,
        userId: assigneeId
      }).catch(() => {});
    }
    if (previousAssignee && previousAssignee.toString() !== String(assigneeId)) {
      userStatsService.refreshUserStats({
        organizationId: req.user.organization,
        userId: previousAssignee
      }).catch(() => {});
    }
  } catch (error) {
    next(error);
  }
};

const bulkAssignWorkOrders = async (req, res, next) => {
  try {
    const { ids = null, assignee = null, filters = {} } = req.validatedData || req.body || {};
    const assigneeId = assignee?.id || assignee?._id || assignee || null;
    await ensureUsersInOrg(req.user.organization, assigneeId ? [assigneeId] : []);
    if (assigneeId) {
      const scopedFilters = buildBulkAssignFilter(req.user.organization, { ids, filters });
      const hasRestricted = await WorkOrder.countDocuments({
        ...scopedFilters,
        requiresCertification: true
      });
      if (hasRestricted) {
        await ensureTechnicianCertified(
          req.user.organization,
          assigneeId,
          'Certification required to assign this work order'
        );
      }
    }

    const result = await workOrderService.bulkAssignWorkOrders(req.user.organization, {
      ids,
      assigneeId,
      filters
    });

    if (result?.updatedWorkOrders?.length) {
      result.updatedWorkOrders.forEach((workOrder) => {
        webhookService.emitWebhookEvent(req.user.organization, 'workorder.assigned', { workOrder, assigneeId });
      });

      if (assigneeId) {
        await notificationService.createNotification({
          user: assigneeId,
          organization: req.user.organization,
          title: 'Work orders assigned',
          message: `You have been assigned ${result.updatedCount} work order${result.updatedCount === 1 ? '' : 's'}`,
          type: 'workorder_bulk_assigned',
          entityType: 'WorkOrder',
          entityId: null,
          link: '/work-orders'
        });
      }

      activityService.broadcast({
        type: 'workorder_bulk_assigned',
        message: `Bulk assigned ${result.updatedCount} work orders`,
        entityType: 'WorkOrder',
        entityId: null,
        link: '/work-orders',
        createdAt: new Date().toISOString(),
        organization: req.user.organization,
        user: req.user.email
      });

      await auditService.createAuditLog({
        organization: req.user.organization,
        actor: req.user.id,
        action: 'workorder_bulk_assigned',
        entityType: 'WorkOrder',
        entityId: null,
        metadata: {
          updatedCount: result.updatedCount,
          ids: Array.isArray(ids) ? ids : null,
          assigneeId,
          filters
        }
      });
    }

    response.success(res, 'Work orders bulk assigned successfully', result);
    if (assigneeId) {
      userStatsService.refreshUserStats({
        organizationId: req.user.organization,
        userId: assigneeId
      }).catch(() => {});
    }
  } catch (error) {
    next(error);
  }
};

const deleteWorkOrder = async (req, res, next) => {
  try {
    const deleted = await workOrderService.deleteWorkOrder(req.user.organization, req.params.id);
    activityService.broadcast({
      type: 'workorder_deleted',
      message: `${deleted.title} deleted`,
      entityType: 'WorkOrder',
      entityId: deleted._id,
      link: `/work-orders/${deleted._id}`,
      createdAt: new Date().toISOString(),
      organization: req.user.organization,
      user: req.user.email
    });
    response.success(res, 'Work order deleted successfully', null);
  } catch (error) {
    next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const workOrder = await workOrderService.addComment(req.user.organization, req.params.id, req.user.id, comment);
    const recipients = [
      workOrder.createdBy?._id,
      workOrder.assignedTo?._id,
      ...(workOrder.team || []).map((member) => member?._id)
    ].filter(Boolean).map((id) => id.toString());
    const uniqueRecipients = [...new Set(recipients)].filter((id) => id !== req.user.id);

    await notificationService.createNotificationsForUsers(uniqueRecipients, {
      organization: req.user.organization,
      title: 'New comment on work order',
      message: `${workOrder.title} has a new comment`,
      type: 'workorder_comment',
      entityType: 'WorkOrder',
      entityId: workOrder._id,
      link: `/work-orders/${workOrder._id}`
    });
    activityService.broadcast({
      type: 'workorder_comment',
      message: `${workOrder.title} has a new comment`,
      entityType: 'WorkOrder',
      entityId: workOrder._id,
      link: `/work-orders/${workOrder._id}`,
      createdAt: new Date().toISOString(),
      organization: req.user.organization,
      user: req.user.email
    });
    response.created(res, 'Comment added successfully', workOrder);
  } catch (error) {
    next(error);
  }
};

const addWorkOrderPhotos = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new ValidationError('At least one photo is required');
    }

    const filePaths = req.files.map((file) => file.path);
    const workOrder = await workOrderService.addWorkOrderPhotos(req.user.organization, req.params.id, filePaths);
    response.success(res, 'Work order photos uploaded successfully', workOrder);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkOrders,
  getWorkOrderById,
  createWorkOrder,
  updateWorkOrder,
  updateWorkOrderStatus,
  assignWorkOrder,
  bulkAssignWorkOrders,
  deleteWorkOrder,
  addComment,
  addWorkOrderPhotos
};
