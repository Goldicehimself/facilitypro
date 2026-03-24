// User Validation Schemas
const Joi = require('joi');

const registerSchema = Joi.object({
  firstName: Joi.string().required().min(2).max(50),
  lastName: Joi.string().required().min(2).max(50),
  email: Joi.string().email().required(),
  password: Joi.string().required().min(6).max(50),
  role: Joi.string().valid('admin', 'facility_manager', 'technician', 'staff', 'vendor', 'finance', 'procurement', 'user'),
  orgCode: Joi.string().alphanum().min(6).max(12).empty(''),
  inviteCode: Joi.string().alphanum().min(8).max(12).empty(''),
  phone: Joi.string().optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  department: Joi.string().optional(),
  vendorProfile: Joi.object({
    name: Joi.string().min(2).max(120).required(),
    category: Joi.string().min(2).max(120).required(),
    contactPerson: Joi.string().optional().allow('', null),
    address: Joi.string().optional().allow('', null),
    city: Joi.string().optional().allow('', null),
    state: Joi.string().optional().allow('', null),
    zipCode: Joi.string().optional().allow('', null),
    contractStartDate: Joi.date().optional(),
    contractEndDate: Joi.date().optional(),
    rating: Joi.number().min(0).max(5).optional(),
    monthlySpend: Joi.number().min(0).optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
    services: Joi.array().items(Joi.string().min(1)).optional(),
    notes: Joi.string().optional().max(500)
  }).when('role', { is: 'vendor', then: Joi.required() })
}).xor('orgCode', 'inviteCode');

const registerOrgSchema = Joi.object({
  organizationName: Joi.string().required().min(2).max(100),
  industry: Joi.string().optional().max(100),
  firstName: Joi.string().required().min(2).max(50),
  lastName: Joi.string().required().min(2).max(50),
  email: Joi.string().email().required(),
  password: Joi.string().required().min(6).max(50),
  phone: Joi.string().optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional()
});

const inviteSchema = Joi.object({
  role: Joi.string().required().valid('facility_manager', 'technician', 'staff', 'vendor', 'finance', 'procurement'),
  expiresAt: Joi.date().optional(),
  email: Joi.string().email().optional(),
  message: Joi.string().max(500).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  orgCode: Joi.string().alphanum().min(6).max(12).required(),
  rememberMe: Joi.boolean().optional()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  orgCode: Joi.string().alphanum().min(6).max(12).required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().min(20).required(),
  orgCode: Joi.string().alphanum().min(6).max(12).required(),
  password: Joi.string().required().min(6).max(50)
});

const verifyUserEmailQuerySchema = Joi.object({
  token: Joi.string().min(20).required(),
  orgCode: Joi.string().alphanum().min(6).max(12).optional(),
  email: Joi.string().email().optional()
});

const sendUserEmailAgainBodySchema = Joi.object({
  orgCode: Joi.string().alphanum().min(6).max(12).required(),
  email: Joi.string().email().required()
});

const updateUserSchema = Joi.object({
  firstName: Joi.string().optional().min(2).max(50),
  lastName: Joi.string().optional().min(2).max(50),
  phone: Joi.string().optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  department: Joi.string().optional(),
  avatar: Joi.string().optional(),
  preferences: Joi.object({
    emailNotifications: Joi.boolean().optional(),
    inAppNotifications: Joi.boolean().optional()
  }).optional(),
  role: Joi.string().optional().valid('admin', 'facility_manager', 'technician', 'staff', 'vendor', 'finance', 'procurement', 'user'),
  active: Joi.boolean().optional()
}).min(1);

module.exports = {
  registerSchema,
  registerOrgSchema,
  inviteSchema,
  loginSchema,
  updateUserSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyUserEmailQuerySchema,
  sendUserEmailAgainBodySchema
};
