const Joi = require('joi');

const createOrganizationSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  industry: Joi.string().allow('').max(120).optional(),
  orgEmail: Joi.string().email().required(),
  isSystem: Joi.boolean().optional(),
  status: Joi.string().valid('active', 'disabled', 'pending').optional(),
  billing: Joi.object({
    plan: Joi.string().valid('starter', 'pro', 'enterprise').optional(),
    billingCycle: Joi.string().valid('monthly', 'annual').optional(),
    seatsIncluded: Joi.number().integer().min(1).max(10000).optional(),
    seatCount: Joi.number().integer().min(1).max(100000).optional(),
    extraSeatPrice: Joi.number().min(0).max(1000000).optional(),
    status: Joi.string().valid('trialing', 'active', 'past_due', 'canceled').optional()
  }).optional(),
  admin: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(50).required()
  }).required()
});

const updateOrgStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'disabled').required()
});

const assignOrgAdminSchema = Joi.object({
  userId: Joi.string().hex().length(24).required()
});

const updateFeatureFlagsSchema = Joi.object({
  flags: Joi.object().required()
});

const updateLicensingSchema = Joi.object({
  planOverride: Joi.string().allow(null, '').optional(),
  seatCap: Joi.number().integer().min(1).max(100000).allow(null).optional(),
  notes: Joi.string().allow('', null).max(500).optional()
});

const updateBillingSchema = Joi.object({
  billing: Joi.object({
    plan: Joi.string().valid('starter', 'pro', 'enterprise').optional(),
    billingCycle: Joi.string().valid('monthly', 'annual').optional(),
    seatsIncluded: Joi.number().integer().min(1).max(10000).optional(),
    seatCount: Joi.number().integer().min(1).max(100000).optional(),
    extraSeatPrice: Joi.number().min(0).max(1000000).optional(),
    trialEndsAt: Joi.date().optional().allow(null),
    status: Joi.string().valid('trialing', 'active', 'past_due', 'canceled').optional()
  }).required()
});

const updateUserStatusSchema = Joi.object({
  active: Joi.boolean().required()
});

const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid('super_admin', 'admin', 'facility_manager', 'technician', 'staff', 'vendor', 'finance', 'procurement', 'user').required()
});

module.exports = {
  createOrganizationSchema,
  updateOrgStatusSchema,
  assignOrgAdminSchema,
  updateFeatureFlagsSchema,
  updateLicensingSchema,
  updateBillingSchema,
  updateUserStatusSchema,
  updateUserRoleSchema
};
