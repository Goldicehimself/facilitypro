// Organization Model
const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');

const orgCodeAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const generateOrgCode = customAlphabet(orgCodeAlphabet, 8);
const generateInviteCode = customAlphabet(orgCodeAlphabet, 10);

const inviteSchema = new mongoose.Schema({
  code: { type: String, required: true },
  role: { type: String, required: true },
  expiresAt: { type: Date, default: null },
  message: { type: String, trim: true },
  usedAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const securityPolicySchema = new mongoose.Schema({
  twoFactorAuth: { type: Boolean, default: false },
  enforceMfa: { type: Boolean, default: false },
  sessionTimeoutMinutes: { type: Number, default: 120 },
  strongPassword: { type: Boolean, default: true },
  minPasswordLength: { type: Number, default: 12 },
  lockoutThreshold: { type: Number, default: 5 },
  restrictInviteDomains: { type: Boolean, default: false },
  allowedInviteDomains: { type: [String], default: [] }
}, { _id: false });

const notificationSettingsSchema = new mongoose.Schema({
  notifyWoCreated: { type: Boolean, default: true },
  notifyWoAssigned: { type: Boolean, default: true },
  notifyWoOverdue: { type: Boolean, default: true },
  notifyPmDue: { type: Boolean, default: true },
  notifyEmail: { type: Boolean, default: true },
  notifyInApp: { type: Boolean, default: true },
  quietHoursEnabled: { type: Boolean, default: false },
  quietHoursStart: { type: String, default: '22:00' },
  quietHoursEnd: { type: String, default: '06:00' }
}, { _id: false });

const companyProfileSchema = new mongoose.Schema({
  companyName: { type: String, trim: true },
  logoUrl: { type: String, trim: true },
  logoDataUrl: { type: String },
  address: { type: String, trim: true },
  contactEmail: { type: String, trim: true },
  contactPhone: { type: String, trim: true },
  industry: { type: String, trim: true },
  supportEmail: { type: String, trim: true },
  supportPhone: { type: String, trim: true }
}, { _id: false });

const webhookDeliveryLogSchema = new mongoose.Schema({
  event: { type: String, required: true },
  attempt: { type: Number, required: true },
  success: { type: Boolean, default: false },
  statusCode: { type: Number },
  responseSnippet: { type: String },
  error: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const webhookSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  type: { type: String, trim: true, default: 'generic' },
  secret: { type: String, required: true },
  events: { type: [String], default: [] },
  active: { type: Boolean, default: true },
  deliveryLogs: { type: [webhookDeliveryLogSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const apiKeySchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  prefix: { type: String, required: true },
  last4: { type: String, required: true },
  hash: { type: String, required: true },
  scopes: { type: [String], default: [] },
  expiresAt: { type: Date, default: null },
  lastUsedAt: { type: Date, default: null },
  rateLimit: {
    windowMs: { type: Number, default: 60000 },
    max: { type: Number, default: 60 }
  },
  createdAt: { type: Date, default: Date.now },
  revokedAt: { type: Date, default: null }
}, { _id: false });

const integrationSettingsSchema = new mongoose.Schema({
  webhooks: { type: [webhookSchema], default: [] },
  apiKeys: { type: [apiKeySchema], default: [] }
}, { _id: false });

const billingSettingsSchema = new mongoose.Schema({
  plan: { type: String, default: 'starter' },
  billingCycle: { type: String, default: 'monthly' },
  seatsIncluded: { type: Number, default: 5 },
  seatCount: { type: Number, default: 1 },
  extraSeatPrice: { type: Number, default: 4000 },
  trialEndsAt: { type: Date, default: null },
  status: { type: String, default: 'trialing' },
  provider: { type: String, default: null },
  lastPaidAt: { type: Date, default: null },
  lastPaymentReference: { type: String, default: null },
  lastPaymentAmount: { type: Number, default: null }
}, { _id: false });

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  industry: { type: String, trim: true },
  orgEmail: { type: String, trim: true, lowercase: true },
  orgEmailVerifiedAt: { type: Date, default: null },
  orgEmailVerificationTokenHash: { type: String, default: null },
  orgEmailVerificationExpiresAt: { type: Date, default: null },
  orgCode: { type: String, required: true, unique: true, index: true },
  status: { type: String, default: 'active' },
  invites: [inviteSchema],
  settings: {
    securityPolicy: { type: securityPolicySchema, default: () => ({}) },
    notifications: { type: notificationSettingsSchema, default: () => ({}) },
    companyProfile: { type: companyProfileSchema, default: () => ({}) },
    integrations: { type: integrationSettingsSchema, default: () => ({}) },
    billing: { type: billingSettingsSchema, default: () => ({}) }
  }
}, {
  timestamps: true
});

organizationSchema.statics.generateOrgCode = function generateCode() {
  return generateOrgCode();
};

organizationSchema.statics.generateInviteCode = function generateCode() {
  return generateInviteCode();
};

module.exports = mongoose.model('Organization', organizationSchema);
