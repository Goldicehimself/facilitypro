// Service Request Controller
const serviceRequestService = require('../services/serviceRequestService');
const response = require('../utils/response');
const notificationService = require('../services/notificationService');
const activityService = require('../services/activityService');
const constants = require('../constants/constants');
const User = require('../models/User');
const Asset = require('../models/Asset');
const { ValidationError } = require('../utils/errorHandler');

const ensureUserInOrg = async (organizationId, userId) => {
  if (!userId) return;
  const user = await User.findOne({ _id: userId, organization: organizationId, active: true }).select('_id');
  if (!user) {
    throw new ValidationError('User must belong to your organization and be active');
  }
};

const ensureAssetInOrg = async (organizationId, assetId) => {
  if (!assetId) return;
  const asset = await Asset.findOne({ _id: assetId, organization: organizationId }).select('_id');
  if (!asset) {
    throw new ValidationError('Asset does not belong to your organization');
  }
};

const resolveUserId = (user) => {
  if (!user) return null;
  return user._id || user.id || user;
};

const getServiceRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, priority, category, location } = req.query;
    const filters = {};
    if (search) filters.search = search;
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (category) filters.category = category;
    if (location) filters.location = location;
    const result = await serviceRequestService.getServiceRequests(
      req.user.organization,
      filters,
      parseInt(page),
      parseInt(limit)
    );
    response.success(res, 'Service requests retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

const getServiceRequestSummary = async (req, res, next) => {
  try {
    const result = await serviceRequestService.getServiceRequestSummary(req.user.organization);
    response.success(res, 'Service request summary retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

const getServiceRequestById = async (req, res, next) => {
  try {
    const request = await serviceRequestService.getServiceRequestById(req.user.organization, req.params.id);
    response.success(res, 'Service request retrieved successfully', request);
  } catch (error) {
    next(error);
  }
};

const createServiceRequest = async (req, res, next) => {
  try {
    const organizationId = req.user.organization;
    await ensureAssetInOrg(organizationId, req.body.asset);
    await ensureUserInOrg(organizationId, req.body.assignee);
    const request = await serviceRequestService.createServiceRequest(organizationId, req.user.id, req.body);

    const adminManagerIds = await notificationService.getRoleUserIds([
      constants.ROLES.ADMIN,
      constants.ROLES.FACILITY_MANAGER
    ], organizationId);
    const recipients = new Set(adminManagerIds.map((id) => id.toString()));
    const assigneeId = resolveUserId(request.assignee);
    if (assigneeId) {
      recipients.add(assigneeId.toString());
    }
    await notificationService.createNotificationsForUsers([...recipients], {
      organization: organizationId,
      title: 'New service request',
      message: request.title,
      type: 'service_request_created',
      entityType: 'ServiceRequest',
      entityId: request._id,
      link: `/service-requests`
    });
    activityService.broadcast({
      type: 'service_request_created',
      message: request.title,
      entityType: 'ServiceRequest',
      entityId: request._id,
      link: `/service-requests`,
      createdAt: new Date().toISOString(),
      organization: req.user.organization,
      user: req.user.email
    });
    response.created(res, 'Service request created successfully', request);
  } catch (error) {
    next(error);
  }
};

const updateServiceRequest = async (req, res, next) => {
  try {
    const organizationId = req.user.organization;
    if (req.body.asset) {
      await ensureAssetInOrg(organizationId, req.body.asset);
    }
    if (req.body.assignee) {
      await ensureUserInOrg(organizationId, req.body.assignee);
    }
    const request = await serviceRequestService.updateServiceRequest(organizationId, req.params.id, req.body);
    response.success(res, 'Service request updated successfully', request);
  } catch (error) {
    next(error);
  }
};

const assignServiceRequest = async (req, res, next) => {
  try {
    const organizationId = req.user.organization;
    await ensureUserInOrg(organizationId, req.body.assigneeId);
    const request = await serviceRequestService.assignServiceRequest(
      organizationId,
      req.params.id,
      req.body.assigneeId,
      req.body.note
    );
    const assigneeId = resolveUserId(request.assignee);
    if (assigneeId) {
        const note = request.assignmentNote ? String(request.assignmentNote).trim() : '';
        const dedupeKey = `service-request-assigned-${request._id}-${assigneeId}-${request.assignedAt ? new Date(request.assignedAt).getTime() : Date.now()}`;
        await notificationService.createNotificationsForUsers([assigneeId.toString()], {
          organization: organizationId,
          title: 'Service request assigned',
          message: note ? `${request.title} — ${note}` : request.title,
          type: 'service_request_assigned',
          entityType: 'ServiceRequest',
          entityId: request._id,
          link: `/service-requests`,
          metadata: note ? { assignmentNote: note } : undefined,
          read: false,
          dedupeKey
        }, { force: true });
      }
    activityService.broadcast({
      type: 'service_request_assigned',
      message: request.title,
      entityType: 'ServiceRequest',
      entityId: request._id,
      link: `/service-requests`,
      createdAt: new Date().toISOString(),
      organization: req.user.organization,
      user: req.user.email
    });
    response.success(res, 'Service request assigned successfully', request);
  } catch (error) {
    next(error);
  }
};

const updateServiceRequestStatus = async (req, res, next) => {
  try {
    const request = await serviceRequestService.updateServiceRequestStatus(
      req.user.organization,
      req.params.id,
      req.body.status
    );
    response.success(res, 'Service request status updated successfully', request);
  } catch (error) {
    next(error);
  }
};

const deleteServiceRequest = async (req, res, next) => {
  try {
    await serviceRequestService.deleteServiceRequest(req.user.organization, req.params.id);
    response.success(res, 'Service request deleted successfully', null);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServiceRequests,
  getServiceRequestById,
  createServiceRequest,
  updateServiceRequest,
  assignServiceRequest,
  updateServiceRequestStatus,
  deleteServiceRequest,
  getServiceRequestSummary
};
