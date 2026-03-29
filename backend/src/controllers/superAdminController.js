const jwt = require('jsonwebtoken');
const Organization = require('../models/Organization');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const constants = require('../constants/constants');
const response = require('../utils/response');
const { NotFoundError, ValidationError } = require('../utils/errorHandler');
const orgService = require('../services/orgService');
const authService = require('../services/authService');
const auditService = require('../services/auditService');

const getOverview = async (req, res, next) => {
  try {
    const [
      totalOrgs,
      activeOrgs,
      disabledOrgs,
      totalUsers,
      activeUsers,
      suspendedUsers
    ] = await Promise.all([
      Organization.countDocuments({}),
      Organization.countDocuments({ status: 'active' }),
      Organization.countDocuments({ status: 'disabled' }),
      User.countDocuments({}),
      User.countDocuments({ active: true }),
      User.countDocuments({ active: false })
    ]);

    response.success(res, 'Overview loaded', {
      organizations: {
        total: totalOrgs,
        active: activeOrgs,
        disabled: disabledOrgs
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

const listOrganizations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};
    if (status) filter.status = status;

    if (search) {
      const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ name: regex }, { orgCode: regex }, { orgEmail: regex }];
    }

    const [orgs, total] = await Promise.all([
      Organization.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Organization.countDocuments(filter)
    ]);

    const orgIds = orgs.map((org) => org._id);
    const admins = await User.find({
      organization: { $in: orgIds },
      role: constants.ROLES.ADMIN
    })
      .select('firstName lastName email organization active')
      .lean();

    const adminByOrg = admins.reduce((acc, admin) => {
      const orgId = admin.organization?.toString?.() || String(admin.organization);
      if (!acc[orgId]) acc[orgId] = admin;
      return acc;
    }, {});

    const results = orgs.map((org) => ({
      ...org,
      admin: adminByOrg[org._id.toString()] || null
    }));

    response.success(res, 'Organizations loaded', {
      organizations: results,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

const createOrganization = async (req, res, next) => {
  try {
    const payload = req.validatedData || req.body;
    let orgCode;
    for (let i = 0; i < 5; i += 1) {
      orgCode = Organization.generateOrgCode();
      const exists = await Organization.findOne({ orgCode });
      if (!exists) break;
    }
    if (!orgCode) throw new ValidationError('Failed to generate organization code');

    const status = payload.status || 'active';
    const isSystem = !!payload.isSystem;
    const organization = new Organization({
      name: payload.name,
      industry: payload.industry,
      orgEmail: payload.orgEmail,
      orgCode,
      status,
      isSystem,
      orgEmailVerifiedAt: new Date(),
      settings: {
        billing: isSystem
          ? {
              ...(payload.billing || {}),
              status: 'active',
              trialEndsAt: null
            }
          : {
              ...(payload.billing || {})
            }
      }
    });
    await organization.save();

    const admin = new User({
      firstName: payload.admin.firstName,
      lastName: payload.admin.lastName,
      email: payload.admin.email,
      password: payload.admin.password,
      role: constants.ROLES.ADMIN,
      organization: organization._id,
      active: status === 'active',
      emailVerifiedAt: new Date()
    });
    await admin.save();

    await auditService.createAuditLog({
      organization: organization._id,
      actor: req.user.id,
      action: 'super_admin_create_org',
      entityType: 'Organization',
      entityId: organization._id,
      metadata: { orgCode, adminEmail: admin.email }
    });

    response.created(res, 'Organization created', {
      organization,
      admin: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateOrganizationStatus = async (req, res, next) => {
  try {
    const { status } = req.validatedData || req.body;
    const orgId = req.params.id;
    const updated =
      status === 'active'
        ? await orgService.enableOrganization(orgId)
        : await orgService.disableOrganization(orgId);

    await auditService.createAuditLog({
      organization: orgId,
      actor: req.user.id,
      action: status === 'active' ? 'super_admin_enable_org' : 'super_admin_disable_org',
      entityType: 'Organization',
      entityId: orgId
    });

    response.success(res, 'Organization updated', updated);
  } catch (error) {
    next(error);
  }
};

const assignOrgAdmin = async (req, res, next) => {
  try {
    const { userId } = req.validatedData || req.body;
    const orgId = req.params.id;
    const user = await User.findOneAndUpdate(
      { _id: userId, organization: orgId },
      { role: constants.ROLES.ADMIN },
      { new: true }
    ).select('-password');
    if (!user) throw new NotFoundError('User');

    await auditService.createAuditLog({
      organization: orgId,
      actor: req.user.id,
      action: 'super_admin_assign_org_admin',
      entityType: 'User',
      entityId: user._id,
      metadata: { role: constants.ROLES.ADMIN }
    });

    response.success(res, 'Organization admin assigned', user);
  } catch (error) {
    next(error);
  }
};

const updateOrganizationFeatureFlags = async (req, res, next) => {
  try {
    const { flags } = req.validatedData || req.body;
    const org = await Organization.findById(req.params.id);
    if (!org) throw new NotFoundError('Organization');
    if (!org.settings) org.settings = {};
    org.settings.featureFlags = {
      flags,
      updatedAt: new Date()
    };
    await org.save();

    await auditService.createAuditLog({
      organization: org._id,
      actor: req.user.id,
      action: 'super_admin_update_feature_flags',
      entityType: 'Organization',
      entityId: org._id
    });

    response.success(res, 'Feature flags updated', org.settings.featureFlags);
  } catch (error) {
    next(error);
  }
};

const updateOrganizationLicensing = async (req, res, next) => {
  try {
    const payload = req.validatedData || req.body;
    const org = await Organization.findById(req.params.id);
    if (!org) throw new NotFoundError('Organization');
    if (!org.settings) org.settings = {};
    org.settings.licensing = {
      ...org.settings.licensing,
      ...payload,
      updatedAt: new Date()
    };
    await org.save();

    await auditService.createAuditLog({
      organization: org._id,
      actor: req.user.id,
      action: 'super_admin_update_licensing',
      entityType: 'Organization',
      entityId: org._id
    });

    response.success(res, 'Licensing updated', org.settings.licensing);
  } catch (error) {
    next(error);
  }
};

const updateOrganizationBilling = async (req, res, next) => {
  try {
    const { billing } = req.validatedData || req.body;
    const result = await orgService.updateSettings(req.params.id, { billing });
    await auditService.createAuditLog({
      organization: req.params.id,
      actor: req.user.id,
      action: 'super_admin_update_billing',
      entityType: 'Organization',
      entityId: req.params.id
    });
    response.success(res, 'Billing updated', result.settings.billing);
  } catch (error) {
    next(error);
  }
};

const getOrganizationIntegrations = async (req, res, next) => {
  try {
    const integrations = await orgService.getIntegrations(req.params.id);
    response.success(res, 'Integrations loaded', integrations);
  } catch (error) {
    next(error);
  }
};

const revokeOrganizationApiKey = async (req, res, next) => {
  try {
    const result = await orgService.revokeApiKey(req.params.id, req.params.keyId);
    await auditService.createAuditLog({
      organization: req.params.id,
      actor: req.user.id,
      action: 'super_admin_revoke_api_key',
      entityType: 'ApiKey',
      entityId: null,
      metadata: { apiKeyId: req.params.keyId }
    });
    response.success(res, 'API key revoked', result);
  } catch (error) {
    next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, orgId, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};
    if (orgId) filter.organization = orgId;
    if (status === 'active') filter.active = true;
    if (status === 'suspended') filter.active = false;

    if (search) {
      const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .populate('organization', 'name orgCode status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(filter)
    ]);

    response.success(res, 'Users loaded', {
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

const setUserActiveStatus = async (req, res, next) => {
  try {
    const { active } = req.validatedData || req.body;
    const user = await User.findById(req.params.id).select('organization emailVerifiedAt');
    if (!user) throw new NotFoundError('User');
    if (active && !user.emailVerifiedAt) {
      throw new ValidationError('User email must be verified before activation');
    }
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { active: !!active },
      { new: true }
    ).select('-password');

    await auditService.createAuditLog({
      organization: updated.organization,
      actor: req.user.id,
      action: active ? 'super_admin_activate_user' : 'super_admin_suspend_user',
      entityType: 'User',
      entityId: updated._id
    });

    response.success(res, 'User status updated', updated);
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.validatedData || req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    if (!user) throw new NotFoundError('User');

    await auditService.createAuditLog({
      organization: user.organization,
      actor: req.user.id,
      action: 'super_admin_update_user_role',
      entityType: 'User',
      entityId: user._id,
      metadata: { role }
    });

    response.success(res, 'User role updated', user);
  } catch (error) {
    next(error);
  }
};

const forcePasswordReset = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('email organization tokenVersion');
    if (!user) throw new NotFoundError('User');
    const org = await Organization.findById(user.organization).select('orgCode');
    if (!org) throw new NotFoundError('Organization');

    const result = await authService.requestPasswordReset(user.email, org.orgCode);
    await User.updateOne(
      { _id: user._id },
      {
        passwordResetRequired: true,
        tokenVersion: (user.tokenVersion || 0) + 1
      }
    );

    await auditService.createAuditLog({
      organization: user.organization,
      actor: req.user.id,
      action: 'super_admin_force_password_reset',
      entityType: 'User',
      entityId: user._id
    });

    response.success(res, 'Password reset forced', result);
  } catch (error) {
    next(error);
  }
};

const revokeUserSessions = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('organization tokenVersion');
    if (!user) throw new NotFoundError('User');
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    await auditService.createAuditLog({
      organization: user.organization,
      actor: req.user.id,
      action: 'super_admin_revoke_sessions',
      entityType: 'User',
      entityId: user._id
    });

    response.success(res, 'Sessions revoked', { tokenVersion: user.tokenVersion });
  } catch (error) {
    next(error);
  }
};

const impersonateUser = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id).select('firstName lastName email role organization tokenVersion active');
    if (!target) throw new NotFoundError('User');
    if (!target.active) throw new ValidationError('User is suspended');

    const token = jwt.sign(
      {
        id: target._id,
        email: target.email,
        role: target.role,
        organization: target.organization,
        tokenVersion: typeof target.tokenVersion === 'number' ? target.tokenVersion : 0,
        authType: 'impersonation',
        readOnly: true,
        impersonatorId: req.user.id
      },
      constants.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await auditService.createAuditLog({
      organization: target.organization,
      actor: req.user.id,
      action: 'super_admin_impersonate_read_only',
      entityType: 'User',
      entityId: target._id
    });

    response.success(res, 'Impersonation token created', {
      token,
      expiresIn: '1h',
      user: {
        id: target._id,
        firstName: target.firstName,
        lastName: target.lastName,
        email: target.email,
        role: target.role,
        organization: target.organization
      }
    });
  } catch (error) {
    next(error);
  }
};

const listAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, orgId, actorId, action } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};
    if (orgId) filter.organization = orgId;
    if (actorId) filter.actor = actorId;
    if (action) filter.action = action;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actor', 'firstName lastName email')
        .populate('organization', 'name orgCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    response.success(res, 'Audit logs loaded', {
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  listOrganizations,
  createOrganization,
  updateOrganizationStatus,
  assignOrgAdmin,
  updateOrganizationFeatureFlags,
  updateOrganizationLicensing,
  updateOrganizationBilling,
  getOrganizationIntegrations,
  revokeOrganizationApiKey,
  listUsers,
  setUserActiveStatus,
  updateUserRole,
  forcePasswordReset,
  revokeUserSessions,
  impersonateUser,
  listAuditLogs
};
