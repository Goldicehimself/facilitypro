// Organization Service
const Organization = require('../models/Organization');
const User = require('../models/User');
const crypto = require('crypto');
const constants = require('../constants/constants');
const { NotFoundError, ValidationError } = require('../utils/errorHandler');
const { renderTemplate } = require('../utils/emailTemplates');
const { isLegacyUploadPath, sanitizeAvatarValue, sanitizeUserObject } = require('../utils/userSanitizer');
const { countApprovedCertificates, countPendingCertificates } = require('../utils/certificateUtils');

const getSupportEmail = (organization) => {
  const orgSupport = organization?.settings?.companyProfile?.supportEmail;
  return orgSupport || process.env.SUPPORT_EMAIL || 'support@facilitypro.local';
};

const DEBUG_VERIFY_EMAIL = String(process.env.DEBUG_VERIFY_EMAIL || '').toLowerCase() === 'true';
const getEmailBaseUrl = () => process.env.EMAIL_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

const DEFAULT_SETTINGS = {
  securityPolicy: {
    twoFactorAuth: false,
    enforceMfa: false,
    sessionTimeoutMinutes: 120,
    strongPassword: true,
    minPasswordLength: 12,
    lockoutThreshold: 5,
    restrictInviteDomains: false,
    allowedInviteDomains: []
  },
  notifications: {
    notifyWoCreated: true,
    notifyWoAssigned: true,
    notifyWoOverdue: true,
    notifyPmDue: true,
    notifyEmail: true,
    notifyInApp: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '06:00'
  },
  companyProfile: {
    companyName: '',
    logoUrl: '',
    logoDataUrl: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    industry: '',
    supportEmail: '',
    supportPhone: ''
  },
  integrations: {
    webhooks: [],
    apiKeys: []
  },
  billing: {
    plan: 'starter',
    billingCycle: 'monthly',
    seatsIncluded: 5,
    seatCount: 1,
    extraSeatPrice: 4,
    trialEndsAt: null,
    status: 'trialing'
  }
};

const normalizeAllowedDomains = (domains = []) => {
  const list = Array.isArray(domains) ? domains : [];
  return Array.from(
    new Set(
      list
        .map((d) => String(d || '').trim().toLowerCase())
        .filter(Boolean)
    )
  );
};

const normalizeSettings = (organization) => {
  const current = organization?.settings || {};
  const securityPolicy = {
    ...DEFAULT_SETTINGS.securityPolicy,
    ...(current.securityPolicy || {})
  };
  securityPolicy.allowedInviteDomains = normalizeAllowedDomains(securityPolicy.allowedInviteDomains);

  const notifications = {
    ...DEFAULT_SETTINGS.notifications,
    ...(current.notifications || {})
  };

  const companyProfile = {
    ...DEFAULT_SETTINGS.companyProfile,
    ...(current.companyProfile || {})
  };

  const integrations = {
    ...DEFAULT_SETTINGS.integrations,
    ...(current.integrations || {})
  };

  const billing = {
    ...DEFAULT_SETTINGS.billing,
    ...(current.billing || {})
  };

  if (!companyProfile.companyName && organization?.name) {
    companyProfile.companyName = organization.name;
  }
  if (!companyProfile.industry && organization?.industry) {
    companyProfile.industry = organization.industry;
  }

  return { securityPolicy, notifications, companyProfile, integrations, billing };
};

const getEntitlements = (billing = {}) => {
  const plan = billing.plan || 'starter';
  const planFeatures = {
    starter: [
      'work_orders',
      'assets',
      'vendors',
      'basic_roles',
      'basic_reporting',
      'org_code_onboarding',
      'email_support'
    ],
    pro: [
      'work_orders',
      'assets',
      'vendors',
      'basic_roles',
      'basic_reporting',
      'org_code_onboarding',
      'email_support',
      'advanced_reporting',
      'pm_scheduling',
      'notifications_automation',
      'role_permissions_custom',
      'file_attachments',
      'api_access',
      'priority_support'
    ],
    enterprise: [
      'work_orders',
      'assets',
      'vendors',
      'basic_roles',
      'basic_reporting',
      'org_code_onboarding',
      'email_support',
      'advanced_reporting',
      'pm_scheduling',
      'notifications_automation',
      'role_permissions_custom',
      'file_attachments',
      'api_access',
      'priority_support',
      'sso',
      'audit_logs',
      'advanced_security',
      'sla_support',
      'custom_integrations',
      'dedicated_onboarding',
      'multi_location',
      'custom_roles',
      'data_export_automation',
      'advanced_analytics'
    ]
  };

  return {
    plan,
    features: planFeatures[plan] || planFeatures.starter,
    seatsIncluded: billing.seatsIncluded ?? DEFAULT_SETTINGS.billing.seatsIncluded,
    seatCount: billing.seatCount ?? DEFAULT_SETTINGS.billing.seatCount,
    extraSeatPrice: billing.extraSeatPrice ?? DEFAULT_SETTINGS.billing.extraSeatPrice,
    billingCycle: billing.billingCycle || DEFAULT_SETTINGS.billing.billingCycle,
    trialEndsAt: billing.trialEndsAt || null,
    status: billing.status || DEFAULT_SETTINGS.billing.status
  };
};

const listMembers = async (organizationId, { page = 1, limit = 20, role, search, includeStats = false } = {}) => {
  const skip = (page - 1) * limit;
  const filter = { organization: organizationId };
  if (role) filter.role = role;

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    filter.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex }
    ];
  }

  const [members, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter)
  ]);

  const legacyIds = members
    .filter((member) => isLegacyUploadPath(member.avatar))
    .map((member) => member._id);
  if (legacyIds.length) {
    await User.updateMany({ _id: { $in: legacyIds } }, { $set: { avatar: null } });
  }

  const sanitizedMembers = members.map(sanitizeUserObject);

  let membersWithStats = sanitizedMembers;
  if (includeStats) {
    membersWithStats = sanitizedMembers.map((member) => ({
      ...member,
      performanceScore: member.performanceScore ?? 0,
      rating: member.rating ?? 0,
      completedOrders: member.completedOrders ?? 0,
      assignedOrders: member.assignedOrders ?? 0,
      certifications: member.certificationsCount ?? countApprovedCertificates(member.certificates),
      certificationsPending: countPendingCertificates(member.certificates),
      lastActive: member.lastActive || member.lastLogin || member.updatedAt || member.createdAt
    }));
  }

  return {
    members: membersWithStats,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const listInvites = async (organizationId, { role, createdBy } = {}) => {
  const org = await Organization.findById(organizationId).select('invites');
  if (!org) throw new NotFoundError('Organization');
  let invites = (org.invites || []).filter((invite) => !invite.usedAt);
  if (role) {
    invites = invites.filter((invite) => invite.role === role);
  }
  if (createdBy) {
    invites = invites.filter((invite) => invite.createdBy?.toString?.() === createdBy);
  }
  return { invites };
};

const revokeInvite = async (organizationId, code) => {
  const normalizedCode = String(code || '').toUpperCase();
  const org = await Organization.findById(organizationId);
  if (!org) throw new NotFoundError('Organization');

  const inviteIndex = org.invites.findIndex((invite) => invite.code === normalizedCode);
  if (inviteIndex === -1) throw new NotFoundError('Invite');

  if (org.invites[inviteIndex].usedAt) {
    throw new ValidationError('Invite already used');
  }

  org.invites.splice(inviteIndex, 1);
  await org.save();
  return { code: normalizedCode };
};

const disableOrganization = async (organizationId) => {
  const org = await Organization.findByIdAndUpdate(
    organizationId,
    { status: 'disabled' },
    { new: true }
  );

  if (!org) throw new NotFoundError('Organization');

  await User.updateMany({ organization: organizationId }, { active: false });
  return org;
};

const enableOrganization = async (organizationId) => {
  const org = await Organization.findByIdAndUpdate(
    organizationId,
    { status: 'active' },
    { new: true }
  );

  if (!org) throw new NotFoundError('Organization');
  await User.updateMany({ organization: organizationId }, { active: true });
  return org;
};

const setUserActiveStatus = async (organizationId, userId, active) => {
  const user = await User.findOneAndUpdate(
    { _id: userId, organization: organizationId },
    { active: !!active },
    { new: true }
  ).select('-password');

  if (!user) throw new NotFoundError('User');
  if (isLegacyUploadPath(user.avatar)) {
    user.avatar = sanitizeAvatarValue(user.avatar);
    await user.save();
  }
  return user;
};

const updateCertificateStatus = async (organizationId, userId, { publicId, status, reviewNotes }, reviewerId) => {
  const allowed = ['approved', 'rejected'];
  if (!allowed.includes(status)) {
    throw new ValidationError('Invalid certificate status');
  }
  const user = await User.findOne({ _id: userId, organization: organizationId }).select('certificates certificationsCount');
  if (!user) throw new NotFoundError('User');

  const certs = Array.isArray(user.certificates) ? user.certificates : [];
  const idx = certs.findIndex((entry) =>
    typeof entry === 'string' ? entry === publicId : entry?.publicId === publicId
  );
  if (idx === -1) {
    throw new NotFoundError('Certificate');
  }

  const existing = certs[idx];
  const next = typeof existing === 'string'
    ? { publicId: existing }
    : { ...existing };

  next.status = status;
  next.reviewedAt = new Date();
  next.reviewedBy = reviewerId;
  if (reviewNotes) next.reviewNotes = reviewNotes;

  certs[idx] = next;
  user.certificates = certs;
  user.certificationsCount = countApprovedCertificates(certs);
  await user.save();

  return { userId: user._id, certificate: next, certificationsCount: user.certificationsCount };
};

const getSettings = async (organizationId) => {
  const org = await Organization.findById(organizationId).select('settings name industry');
  if (!org) throw new NotFoundError('Organization');
  const settings = normalizeSettings(org);
  return { settings, entitlements: getEntitlements(settings.billing) };
};

const updateSettings = async (organizationId, payload = {}) => {
  const org = await Organization.findById(organizationId);
  if (!org) throw new NotFoundError('Organization');

  if (!org.settings) {
    org.settings = {};
  }

  if (payload.securityPolicy) {
    const updatedPolicy = {
      ...DEFAULT_SETTINGS.securityPolicy,
      ...(org.settings.securityPolicy || {}),
      ...(payload.securityPolicy || {})
    };
    updatedPolicy.allowedInviteDomains = normalizeAllowedDomains(updatedPolicy.allowedInviteDomains);
    org.settings.securityPolicy = updatedPolicy;
  }

  if (payload.notifications) {
    org.settings.notifications = {
      ...DEFAULT_SETTINGS.notifications,
      ...(org.settings.notifications || {}),
      ...(payload.notifications || {})
    };
  }

  if (payload.companyProfile) {
    const updatedProfile = {
      ...DEFAULT_SETTINGS.companyProfile,
      ...(org.settings.companyProfile || {}),
      ...(payload.companyProfile || {})
    };
    org.settings.companyProfile = updatedProfile;

    if (updatedProfile.companyName) {
      org.name = updatedProfile.companyName;
    }
    if (updatedProfile.industry) {
      org.industry = updatedProfile.industry;
    }
  }

  if (payload.billing) {
    const updatedBilling = {
      ...DEFAULT_SETTINGS.billing,
      ...(org.settings.billing || {}),
      ...(payload.billing || {})
    };
    org.settings.billing = updatedBilling;
  }

  await org.save();
  return { settings: normalizeSettings(org) };
};

const getPublicSecurityPolicy = async ({ orgCode, inviteCode } = {}) => {
  const normalizedOrgCode = orgCode ? String(orgCode).toUpperCase() : null;
  const normalizedInviteCode = inviteCode ? String(inviteCode).toUpperCase() : null;

  let org;
  if (normalizedInviteCode) {
    org = await Organization.findOne({ 'invites.code': normalizedInviteCode }).select('settings status');
  }
  if (!org && normalizedOrgCode) {
    org = await Organization.findOne({ orgCode: normalizedOrgCode }).select('settings status');
  }
  if (!org) throw new NotFoundError('Organization');
  if (org.status !== 'active') throw new ValidationError('Organization is disabled');

  const settings = normalizeSettings(org);
  return { securityPolicy: settings.securityPolicy };
};

const verifyOrgEmail = async (token, { orgCode, email } = {}) => {
  const normalizedToken = String(token || '').trim();
  const tokenHash = crypto.createHash('sha256').update(normalizedToken).digest('hex');
  const org = await Organization.findOne({
    orgEmailVerificationTokenHash: tokenHash
  });
  if (!org) {
    const normalizedOrgCode = orgCode ? String(orgCode).toUpperCase() : null;
    const normalizedEmail = email ? String(email).toLowerCase() : null;
    if (normalizedOrgCode && normalizedEmail) {
      const fallbackOrg = await Organization.findOne({
        orgCode: normalizedOrgCode,
        orgEmail: normalizedEmail
      });
      if (fallbackOrg?.orgEmailVerifiedAt) {
        return { orgId: fallbackOrg._id, verifiedAt: fallbackOrg.orgEmailVerifiedAt };
      }
    }
    throw new ValidationError('Verification token is invalid. Please request a new verification email.');
  }

  if (!org.orgEmailVerificationExpiresAt || org.orgEmailVerificationExpiresAt <= new Date()) {
    throw new ValidationError('Verification token expired. Please request a new verification email.');
  }

  org.orgEmailVerifiedAt = new Date();
  org.orgEmailVerificationTokenHash = null;
  org.orgEmailVerificationExpiresAt = null;
  if (org.status !== 'active') {
    org.status = 'active';
  }
  await org.save();
  await User.updateMany(
    { organization: org._id, email: org.orgEmail, emailVerifiedAt: null },
    { $set: { emailVerifiedAt: new Date() } }
  );

  return { orgId: org._id, verifiedAt: org.orgEmailVerifiedAt };
};

const sendOrgEmailVerificationAgain = async ({ orgCode, email } = {}) => {
  const normalizedOrgCode = String(orgCode || '').toUpperCase();
  const normalizedEmail = String(email || '').toLowerCase();
  const org = await Organization.findOne({
    orgCode: normalizedOrgCode,
    orgEmail: normalizedEmail
  });
  if (!org) throw new ValidationError('Organization email or code is invalid');

  const rawToken = crypto.randomBytes(24).toString('hex');
  const newHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  org.orgEmailVerificationTokenHash = newHash;
  org.orgEmailVerificationExpiresAt = expiresAt;
  await org.save();

  const { sendEmail } = require('../utils/email');
  const emailBaseUrl = getEmailBaseUrl();
  const verifyLink = `${emailBaseUrl}/verify-org-email?token=${rawToken}&orgCode=${org.orgCode}&email=${encodeURIComponent(org.orgEmail)}`;
  const verifyHtml = renderTemplate('facilitypro-verify-email.html', {
    recipient_name: org.orgEmail,
    org_name: org.name,
    org_code: org.orgCode,
    verification_url: verifyLink,
    support_email: getSupportEmail(org),
    year: new Date().getFullYear()
  });
  const emailSent = await sendEmail({
    to: org.orgEmail,
    subject: 'Verify your organization email',
    text: `Please verify your organization email by visiting: ${verifyLink}`,
    html: verifyHtml || `<p>Please verify your organization email by clicking the link below:</p><p><a href="${verifyLink}">${verifyLink}</a></p>`
  });

  return {
    sent: emailSent,
    ...(DEBUG_VERIFY_EMAIL ? { verificationLink: verifyLink } : {})
  };
};

const getIntegrations = async (organizationId) => {
  const org = await Organization.findById(organizationId).select('settings');
  if (!org) throw new NotFoundError('Organization');
  const settings = normalizeSettings(org);

  return {
    webhooks: (settings.integrations.webhooks || []).map((hook) => ({
      id: hook.id,
      name: hook.name,
      url: hook.url,
      type: hook.type || 'generic',
      events: hook.events || [],
      active: !!hook.active,
      createdAt: hook.createdAt,
      deliveryLogs: (hook.deliveryLogs || []).slice(-20)
    })),
    apiKeys: (settings.integrations.apiKeys || []).map((key) => ({
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      last4: key.last4,
      scopes: key.scopes || [],
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt,
      rateLimit: key.rateLimit || constants.DEFAULT_API_KEY_RATE_LIMIT,
      createdAt: key.createdAt,
      revokedAt: key.revokedAt
    }))
  };
};

const createWebhook = async (organizationId, { name, url, type = 'generic', events = [], active = true } = {}) => {
  const org = await Organization.findById(organizationId);
  if (!org) throw new NotFoundError('Organization');

  const id = crypto.randomBytes(12).toString('hex');
  const secret = crypto.randomBytes(24).toString('hex');

  if (!org.settings) org.settings = {};
  if (!org.settings.integrations) org.settings.integrations = {};
  if (!Array.isArray(org.settings.integrations.webhooks)) org.settings.integrations.webhooks = [];

  org.settings.integrations.webhooks.push({
    id,
    name,
    url,
    type: type || 'generic',
    secret,
    events,
    active: !!active
  });

  await org.save();

  return {
    webhook: { id, name, url, type: type || 'generic', events, active: !!active, createdAt: new Date(), deliveryLogs: [] },
    secret
  };
};

const deleteWebhook = async (organizationId, webhookId) => {
  const org = await Organization.findById(organizationId);
  if (!org) throw new NotFoundError('Organization');

  const webhooks = org.settings?.integrations?.webhooks || [];
  const nextWebhooks = webhooks.filter((hook) => hook.id !== webhookId);
  if (nextWebhooks.length === webhooks.length) {
    throw new NotFoundError('Webhook');
  }

  org.settings.integrations.webhooks = nextWebhooks;
  await org.save();

  return { id: webhookId };
};

const createApiKey = async (organizationId, { name, scopes = [], expiresAt = null, rateLimit = {} } = {}) => {
  const org = await Organization.findById(organizationId);
  if (!org) throw new NotFoundError('Organization');

  const raw = crypto.randomBytes(24).toString('hex');
  const key = `mp_${raw}`;
  const prefix = key.slice(0, 8);
  const last4 = key.slice(-4);
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const id = crypto.randomBytes(12).toString('hex');
  const resolvedRateLimit = {
    ...constants.DEFAULT_API_KEY_RATE_LIMIT,
    ...(rateLimit || {})
  };

  if (!org.settings) org.settings = {};
  if (!org.settings.integrations) org.settings.integrations = {};
  if (!Array.isArray(org.settings.integrations.apiKeys)) org.settings.integrations.apiKeys = [];

  org.settings.integrations.apiKeys.push({
    id,
    name,
    prefix,
    last4,
    hash,
    scopes,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    rateLimit: resolvedRateLimit
  });

  await org.save();

  return {
    apiKey: { id, name, prefix, last4, scopes, expiresAt: expiresAt ? new Date(expiresAt) : null, rateLimit: resolvedRateLimit, createdAt: new Date(), revokedAt: null, lastUsedAt: null },
    key
  };
};

const revokeApiKey = async (organizationId, apiKeyId) => {
  const org = await Organization.findById(organizationId);
  if (!org) throw new NotFoundError('Organization');

  const keys = org.settings?.integrations?.apiKeys || [];
  const match = keys.find((key) => key.id === apiKeyId);
  if (!match) throw new NotFoundError('API key');

  match.revokedAt = new Date();
  await org.save();

  return { id: apiKeyId, revokedAt: match.revokedAt };
};

const appendWebhookDeliveryLog = async (organizationId, webhookId, logEntry) => {
  const org = await Organization.findById(organizationId);
  if (!org) throw new NotFoundError('Organization');

  const webhooks = org.settings?.integrations?.webhooks || [];
  const webhook = webhooks.find((hook) => hook.id === webhookId);
  if (!webhook) throw new NotFoundError('Webhook');

  webhook.deliveryLogs = [...(webhook.deliveryLogs || []), logEntry].slice(-20);
  await org.save();
};

const touchApiKeyLastUsed = async (organizationId, apiKeyId) => {
  await Organization.updateOne(
    { _id: organizationId, 'settings.integrations.apiKeys.id': apiKeyId },
    { $set: { 'settings.integrations.apiKeys.$.lastUsedAt': new Date() } }
  );
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
  normalizeSettings,
  getEntitlements,
  getIntegrations,
  createWebhook,
  deleteWebhook,
  createApiKey,
  revokeApiKey,
  appendWebhookDeliveryLog,
  touchApiKeyLastUsed
};
