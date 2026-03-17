// Preventive Maintenance Controller
const preventiveMaintenanceService = require('../services/preventiveMaintenanceService');
const response = require('../utils/response');
const notificationService = require('../services/notificationService');
const constants = require('../constants/constants');
const activityService = require('../services/activityService');
const User = require('../models/User');
const Asset = require('../models/Asset');
const { ValidationError, AuthorizationError } = require('../utils/errorHandler');
const { countApprovedCertificates } = require('../utils/certificateUtils');

const ensureUserInOrg = async (organizationId, userId) => {
  if (!userId) return;
  const user = await User.findOne({ _id: userId, organization: organizationId, active: true }).select('_id');
  if (!user) {
    throw new ValidationError('Assigned user must belong to your organization and be active');
  }
};

const ensureCertifiedTechnicianAccess = async (organizationId, userId) => {
  const user = await User.findOne({ _id: userId, organization: organizationId }).select('role certificates');
  if (!user) {
    throw new ValidationError('User not found');
  }
  if (user.role === constants.ROLES.TECHNICIAN) {
    const certified = countApprovedCertificates(user.certificates) > 0;
    if (!certified) {
      throw new AuthorizationError('Certification required to access preventive maintenance');
    }
  }
};

const ensureAssigneeCertifiedIfNeeded = async (organizationId, assigneeId) => {
  if (!assigneeId) return;
  const user = await User.findOne({ _id: assigneeId, organization: organizationId, active: true }).select('role certificates');
  if (!user) {
    throw new ValidationError('Assigned user must belong to your organization and be active');
  }
  if (user.role === constants.ROLES.TECHNICIAN) {
    const certified = countApprovedCertificates(user.certificates) > 0;
    if (!certified) {
      throw new AuthorizationError('Certification required to assign this maintenance task');
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

const getPreventiveMaintenances = async (req, res, next) => {
  try {
    if (req.user?.role === constants.ROLES.TECHNICIAN) {
      await ensureCertifiedTechnicianAccess(req.user.organization, req.user.id);
    }
    const { page = 1, limit = 20, active, asset } = req.query;
    const filters = {};
    const organizationId = req.user.organization;
    
    if (active !== undefined) filters.active = active === 'true';
    if (asset) filters.asset = asset;

    const result = await preventiveMaintenanceService.getPreventiveMaintenances(
      organizationId,
      filters,
      parseInt(page),
      parseInt(limit)
    );
    response.success(res, 'Preventive maintenances retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

const getPreventiveMaintenanceById = async (req, res, next) => {
  try {
    if (req.user?.role === constants.ROLES.TECHNICIAN) {
      await ensureCertifiedTechnicianAccess(req.user.organization, req.user.id);
    }
    const maintenance = await preventiveMaintenanceService.getPreventiveMaintenanceById(req.user.organization, req.params.id);
    response.success(res, 'Preventive maintenance retrieved successfully', maintenance);
  } catch (error) {
    next(error);
  }
};

const createPreventiveMaintenance = async (req, res, next) => {
  try {
    if (Object.prototype.hasOwnProperty.call(req.body, 'requiresCertification')) {
      const allowedRoles = [constants.ROLES.ADMIN, constants.ROLES.FACILITY_MANAGER];
      if (!allowedRoles.includes(req.user?.role)) {
        throw new AuthorizationError('Only admins can mark preventive maintenance as certification-required');
      }
    }
    if (req.user?.role === constants.ROLES.TECHNICIAN) {
      await ensureCertifiedTechnicianAccess(req.user.organization, req.user.id);
    }
    const organizationId = req.user.organization;
    await ensureAssetInOrg(organizationId, req.body.asset);
    await ensureUserInOrg(organizationId, req.body.assignedTo);
    if (req.body.requiresCertification) {
      await ensureAssigneeCertifiedIfNeeded(organizationId, req.body.assignedTo);
    }
    const maintenance = await preventiveMaintenanceService.createPreventiveMaintenance(organizationId, req.body);
    const adminManagerIds = await notificationService.getRoleUserIds([
      constants.ROLES.ADMIN,
      constants.ROLES.FACILITY_MANAGER
    ], organizationId);
    const recipients = new Set(adminManagerIds.map((id) => id.toString()));
    if (maintenance.assignedTo) {
      recipients.add(maintenance.assignedTo.toString());
    }

    await notificationService.createNotificationsForUsers([...recipients], {
      organization: organizationId,
      title: 'Preventive maintenance scheduled',
      message: `${maintenance.name} has been scheduled`,
      type: 'maintenance_scheduled',
      entityType: 'PreventiveMaintenance',
      entityId: maintenance._id,
      link: `/preventive-maintenance/${maintenance._id}`
    });
    activityService.broadcast({
      type: 'maintenance_scheduled',
      message: `${maintenance.name} scheduled`,
      entityType: 'PreventiveMaintenance',
      entityId: maintenance._id,
      link: `/preventive-maintenance/${maintenance._id}`,
      createdAt: new Date().toISOString(),
      organization: req.user.organization,
      user: req.user.email
    });
    response.created(res, 'Preventive maintenance created successfully', maintenance);
  } catch (error) {
    next(error);
  }
};

const updatePreventiveMaintenance = async (req, res, next) => {
  try {
    if (Object.prototype.hasOwnProperty.call(req.body, 'requiresCertification')) {
      const allowedRoles = [constants.ROLES.ADMIN, constants.ROLES.FACILITY_MANAGER];
      if (!allowedRoles.includes(req.user?.role)) {
        throw new AuthorizationError('Only admins can mark preventive maintenance as certification-required');
      }
    }
    if (req.user?.role === constants.ROLES.TECHNICIAN) {
      await ensureCertifiedTechnicianAccess(req.user.organization, req.user.id);
    }
    if (req.body.asset) {
      await ensureAssetInOrg(req.user.organization, req.body.asset);
    }
    if (req.body.assignedTo) {
      await ensureUserInOrg(req.user.organization, req.body.assignedTo);
    }
    if (req.body.requiresCertification && req.body.assignedTo) {
      await ensureAssigneeCertifiedIfNeeded(req.user.organization, req.body.assignedTo);
    }
    const maintenance = await preventiveMaintenanceService.updatePreventiveMaintenance(
      req.user.organization,
      req.params.id,
      req.body
    );
    response.success(res, 'Preventive maintenance updated successfully', maintenance);
  } catch (error) {
    next(error);
  }
};

const deletePreventiveMaintenance = async (req, res, next) => {
  try {
    if (req.user?.role === constants.ROLES.TECHNICIAN) {
      await ensureCertifiedTechnicianAccess(req.user.organization, req.user.id);
    }
    await preventiveMaintenanceService.deletePreventiveMaintenance(req.user.organization, req.params.id);
    response.success(res, 'Preventive maintenance deleted successfully', null);
  } catch (error) {
    next(error);
  }
};

const getUpcomingMaintenance = async (req, res, next) => {
  try {
    if (req.user?.role === constants.ROLES.TECHNICIAN) {
      await ensureCertifiedTechnicianAccess(req.user.organization, req.user.id);
    }
    const { days = 30 } = req.query;
    const maintenances = await preventiveMaintenanceService.getUpcomingMaintenance(req.user.organization, parseInt(days));
    response.success(res, 'Upcoming maintenances retrieved successfully', {
      maintenances,
      totalDays: parseInt(days)
    });
  } catch (error) {
    next(error);
  }
};

const markAsPerformed = async (req, res, next) => {
  try {
    if (req.user?.role === constants.ROLES.TECHNICIAN) {
      await ensureCertifiedTechnicianAccess(req.user.organization, req.user.id);
    }
    const { notes } = req.body;
    const maintenance = await preventiveMaintenanceService.markAsPerformed(req.user.organization, req.params.id, notes);
    response.success(res, 'Maintenance marked as performed successfully', maintenance);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPreventiveMaintenances,
  getPreventiveMaintenanceById,
  createPreventiveMaintenance,
  updatePreventiveMaintenance,
  deletePreventiveMaintenance,
  getUpcomingMaintenance,
  markAsPerformed
};
