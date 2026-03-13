// Organization Validation Schemas
const Joi = require('joi');
const constants = require('../constants/constants');

const logoDataUrlSchema = Joi.string()
  .allow('')
  .custom((value, helpers) => {
    if (!value) return value;
    const regex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i;
    if (!regex.test(value)) {
      return helpers.error('any.invalid');
    }
    const maxLength = 2_000_000;
    if (value.length > maxLength) {
      return helpers.error('string.max', { limit: maxLength });
    }
    return value;
  }, 'logo data url validation');

const listInvitesQuerySchema = Joi.object({
  role: Joi.string().valid('facility_manager', 'technician', 'staff', 'vendor', 'finance', 'procurement').optional(),
  createdBy: Joi.string().hex().length(24).optional()
});

const setUserActiveSchema = Joi.object({
  active: Joi.boolean().required()
});

const updateOrgSettingsSchema = Joi.object({
  securityPolicy: Joi.object({
    twoFactorAuth: Joi.boolean().optional(),
    enforceMfa: Joi.boolean().optional(),
    sessionTimeoutMinutes: Joi.number().integer().min(15).max(720).optional(),
    strongPassword: Joi.boolean().optional(),
    minPasswordLength: Joi.number().integer().min(6).max(128).optional(),
    lockoutThreshold: Joi.number().integer().min(3).max(20).optional(),
    restrictInviteDomains: Joi.boolean().optional(),
    allowedInviteDomains: Joi.array().items(Joi.string().trim().lowercase()).optional()
  }).optional(),
  notifications: Joi.object({
    notifyWoCreated: Joi.boolean().optional(),
    notifyWoAssigned: Joi.boolean().optional(),
    notifyWoOverdue: Joi.boolean().optional(),
    notifyPmDue: Joi.boolean().optional(),
    notifyEmail: Joi.boolean().optional(),
    notifyInApp: Joi.boolean().optional(),
    quietHoursEnabled: Joi.boolean().optional(),
    quietHoursStart: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
    quietHoursEnd: Joi.string().pattern(/^\d{2}:\d{2}$/).optional()
  }).optional(),
  companyProfile: Joi.object({
    companyName: Joi.string().allow('').max(200).optional(),
    logoUrl: Joi.string().uri({ scheme: ['http', 'https'] }).allow('').max(500).optional(),
    logoDataUrl: logoDataUrlSchema.optional(),
    address: Joi.string().allow('').max(500).optional(),
    contactEmail: Joi.string().email().allow('').optional(),
    contactPhone: Joi.string().allow('').max(50).optional(),
    industry: Joi.string().allow('').max(100).optional(),
    supportEmail: Joi.string().email().allow('').optional(),
    supportPhone: Joi.string().allow('').max(50).optional()
  }).optional(),
  billing: Joi.object({
    plan: Joi.string().valid('starter', 'pro', 'enterprise').optional(),
    billingCycle: Joi.string().valid('monthly', 'annual').optional(),
    seatsIncluded: Joi.number().integer().min(1).max(10000).optional(),
    seatCount: Joi.number().integer().min(1).max(100000).optional(),
    extraSeatPrice: Joi.number().min(0).max(1000).optional(),
    trialEndsAt: Joi.date().optional(),
    status: Joi.string().valid('trialing', 'active', 'past_due', 'canceled').optional()
  }).optional()
}).min(1);

const publicSecurityPolicyQuerySchema = Joi.object({
  orgCode: Joi.string().alphanum().min(6).max(12).optional(),
  inviteCode: Joi.string().alphanum().min(8).max(12).optional()
}).xor('orgCode', 'inviteCode');

const verifyOrgEmailQuerySchema = Joi.object({
  token: Joi.string().min(20).required(),
  orgCode: Joi.string().alphanum().min(6).max(12).optional(),
  email: Joi.string().email().optional()
});

const sendOrgEmailAgainBodySchema = Joi.object({
  orgCode: Joi.string().alphanum().min(6).max(12).required(),
  email: Joi.string().email().required()
});

const createWebhookSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  url: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
  type: Joi.string().valid('generic', 'slack', 'teams', 'zapier').optional(),
  events: Joi.array().items(Joi.string().valid(...constants.WEBHOOK_EVENTS)).min(1).required(),
  active: Joi.boolean().optional()
});

const createApiKeySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  scopes: Joi.array().items(Joi.string().valid(...constants.API_KEY_SCOPES)).min(1).required(),
  expiresAt: Joi.date().optional(),
  rateLimit: Joi.object({
    windowMs: Joi.number().integer().min(1000).max(24 * 60 * 60 * 1000).optional(),
    max: Joi.number().integer().min(1).max(10000).optional()
}).optional()
});

const updateCertificateStatusSchema = Joi.object({
  publicId: Joi.string().required(),
  status: Joi.string().valid('approved', 'rejected').required(),
  reviewNotes: Joi.string().allow('').max(500).optional()
});

module.exports = {
  listInvitesQuerySchema,
  setUserActiveSchema,
  updateOrgSettingsSchema,
  publicSecurityPolicyQuerySchema,
  verifyOrgEmailQuerySchema,
  sendOrgEmailAgainBodySchema,
  createWebhookSchema,
  createApiKeySchema,
  updateCertificateStatusSchema
};
