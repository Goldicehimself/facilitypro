// Organization Controller
const orgService = require('../services/orgService');
const response = require('../utils/response');
const { ValidationError } = require('../utils/errorHandler');

const listMembers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, includeStats } = req.query;
    const result = await orgService.listMembers(req.user.organization, {
      page: parseInt(page),
      limit: parseInt(limit),
      role,
      search,
      includeStats: includeStats === 'true'
    });
    response.success(res, 'Organization members retrieved', result);
  } catch (error) {
    next(error);
  }
};

const listInvites = async (req, res, next) => {
  try {
    const { role, createdBy } = req.validatedQuery || req.query;
    const result = await orgService.listInvites(req.user.organization, {
      role,
      createdBy
    });
    response.success(res, 'Organization invites retrieved', result);
  } catch (error) {
    next(error);
  }
};

const revokeInvite = async (req, res, next) => {
  try {
    const result = await orgService.revokeInvite(req.user.organization, req.params.code);
    response.success(res, 'Invite revoked', result);
  } catch (error) {
    next(error);
  }
};

const disableOrganization = async (req, res, next) => {
  try {
    const result = await orgService.disableOrganization(req.user.organization);
    response.success(res, 'Organization disabled', result);
  } catch (error) {
    next(error);
  }
};

const enableOrganization = async (req, res, next) => {
  try {
    const result = await orgService.enableOrganization(req.user.organization);
    response.success(res, 'Organization enabled', result);
  } catch (error) {
    next(error);
  }
};

const setUserActiveStatus = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      throw new ValidationError('You cannot change your own status');
    }
    const { active } = req.validatedData || req.body;
    const user = await orgService.setUserActiveStatus(req.user.organization, req.params.id, active);
    response.success(res, 'User status updated', user);
  } catch (error) {
    next(error);
  }
};

const updateCertificateStatus = async (req, res, next) => {
  try {
    const { publicId, status, reviewNotes } = req.validatedData || req.body;
    const result = await orgService.updateCertificateStatus(
      req.user.organization,
      req.params.id,
      { publicId, status, reviewNotes },
      req.user.id
    );
    response.success(res, 'Certificate status updated', result);
  } catch (error) {
    next(error);
  }
};

const getSettings = async (req, res, next) => {
  try {
    const settings = await orgService.getSettings(req.user.organization);
    response.success(res, 'Organization settings retrieved', settings);
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const payload = req.validatedData || req.body;
    const settings = await orgService.updateSettings(req.user.organization, payload);
    response.success(res, 'Organization settings updated', settings);
  } catch (error) {
    next(error);
  }
};

const getPublicSecurityPolicy = async (req, res, next) => {
  try {
    const { orgCode, inviteCode } = req.validatedQuery || req.query;
    const policy = await orgService.getPublicSecurityPolicy({ orgCode, inviteCode });
    response.success(res, 'Organization security policy retrieved', policy);
  } catch (error) {
    next(error);
  }
};

const verifyOrgEmail = async (req, res, next) => {
  try {
    const { token, orgCode, email } = req.validatedQuery || req.query;
    const result = await orgService.verifyOrgEmail(token, { orgCode, email });
    response.success(res, 'Organization email verified', result);
  } catch (error) {
    next(error);
  }
};

const sendOrgEmailVerificationAgain = async (req, res, next) => {
  try {
    const { orgCode, email } = req.validatedData || req.body;
    const result = await orgService.sendOrgEmailVerificationAgain({ orgCode, email });
    response.success(res, 'Verification email sent again', result);
  } catch (error) {
    next(error);
  }
};

const getIntegrations = async (req, res, next) => {
  try {
    const integrations = await orgService.getIntegrations(req.user.organization);
    response.success(res, 'Organization integrations retrieved', integrations);
  } catch (error) {
    next(error);
  }
};

const createWebhook = async (req, res, next) => {
  try {
    const payload = req.validatedData || req.body;
    const result = await orgService.createWebhook(req.user.organization, payload);
    response.created(res, 'Webhook created', result);
  } catch (error) {
    next(error);
  }
};

const deleteWebhook = async (req, res, next) => {
  try {
    const result = await orgService.deleteWebhook(req.user.organization, req.params.id);
    response.success(res, 'Webhook deleted', result);
  } catch (error) {
    next(error);
  }
};

const createApiKey = async (req, res, next) => {
  try {
    const payload = req.validatedData || req.body;
    const result = await orgService.createApiKey(req.user.organization, payload);
    response.created(res, 'API key created', result);
  } catch (error) {
    next(error);
  }
};

const revokeApiKey = async (req, res, next) => {
  try {
    const result = await orgService.revokeApiKey(req.user.organization, req.params.id);
    response.success(res, 'API key revoked', result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listMembers,
  listInvites,
  revokeInvite,
  disableOrganization,
  enableOrganization,
  setUserActiveStatus,
  updateCertificateStatus,
  getSettings,
  updateSettings,
  getPublicSecurityPolicy,
  verifyOrgEmail,
  sendOrgEmailVerificationAgain,
  getIntegrations,
  createWebhook,
  deleteWebhook,
  createApiKey,
  revokeApiKey
};
