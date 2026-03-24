// Authentication Service
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Organization = require('../models/Organization');
const constants = require('../constants/constants');
const { ValidationError, AuthenticationError, ConflictError, BadRequestError } = require('../utils/errorHandler');
const { normalizeSettings } = require('./orgService');
const { sendEmail } = require('../utils/email');
const { renderTemplate } = require('../utils/emailTemplates');
const { isLegacyUploadPath, sanitizeAvatarValue } = require('../utils/userSanitizer');

const getSupportEmail = (organization) => {
  const orgSupport = organization?.settings?.companyProfile?.supportEmail;
  return orgSupport || process.env.SUPPORT_EMAIL || 'support@facilitypro.local';
};

const DEBUG_VERIFY_EMAIL = String(process.env.DEBUG_VERIFY_EMAIL || '').toLowerCase() === 'true';
const getEmailBaseUrl = () => process.env.EMAIL_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

const getRecipientName = (user) => {
  const first = user?.firstName || '';
  const last = user?.lastName || '';
  const full = `${first} ${last}`.trim();
  return full || user?.email || 'there';
};

const getRoleLabel = (role) => {
  switch (role) {
    case constants.ROLES.ADMIN:
      return 'Admin';
    case constants.ROLES.FACILITY_MANAGER:
      return 'Facility Manager';
    case constants.ROLES.TECHNICIAN:
      return 'Technician';
    case constants.ROLES.STAFF:
      return 'Staff';
    case constants.ROLES.VENDOR:
      return 'Vendor';
    case constants.ROLES.FINANCE:
      return 'Finance';
    case constants.ROLES.PROCUREMENT:
      return 'Procurement';
    default:
      return 'Team Member';
  }
};

const isEmailAllowedByPolicy = (email, securityPolicy) => {
  if (!securityPolicy?.restrictInviteDomains) return true;
  const domain = String(email || '').split('@')[1]?.toLowerCase();
  if (!domain) return false;
  const allowed = Array.isArray(securityPolicy.allowedInviteDomains)
    ? securityPolicy.allowedInviteDomains
    : [];
  if (!allowed.length) return false;
  return allowed.includes(domain);
};

const generateToken = (user, expiresIn) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, organization: user.organization },
    constants.JWT_SECRET,
    { expiresIn: expiresIn || constants.JWT_EXPIRE }
  );
};

const registerOrganization = async ({
  organizationName,
  industry,
  firstName,
  lastName,
  email,
  password,
  phone,
  gender
}) => {
  if (!organizationName) throw new ValidationError('Organization name is required');
  if (!firstName || !lastName || !email || !password) {
    throw new ValidationError('Admin user details are required');
  }

  let orgCode;
  for (let i = 0; i < 5; i += 1) {
    orgCode = Organization.generateOrgCode();
    const exists = await Organization.findOne({ orgCode });
    if (!exists) break;
  }
  if (!orgCode) throw new ValidationError('Failed to generate organization code');

  const organization = new Organization({
    name: organizationName,
    industry,
    orgCode,
    orgEmail: email,
    status: 'pending'
  });

  const trialEndsAt = new Date(Date.now() + constants.TRIAL_DAYS * 24 * 60 * 60 * 1000);
  organization.settings = organization.settings || {};
  organization.settings.billing = {
    ...(organization.settings.billing || {}),
    trialEndsAt,
    status: 'trialing'
  };

  await organization.save();

  const user = new User({
    firstName,
    lastName,
    email,
    password,
    phone,
    gender,
    role: constants.ROLES.ADMIN,
    organization: organization._id
  });

  await user.save();

  const rawToken = crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  organization.orgEmailVerificationTokenHash = tokenHash;
  organization.orgEmailVerificationExpiresAt = expiresAt;
  await organization.save();

  const emailBaseUrl = getEmailBaseUrl();
  const verifyLink = `${emailBaseUrl}/verify-org-email?token=${rawToken}&orgCode=${orgCode}&email=${encodeURIComponent(email)}`;
  const verifyHtml = renderTemplate('facilitypro-verify-email.html', {
    recipient_name: getRecipientName({ firstName, lastName, email }),
    org_name: organization.name,
    org_code: orgCode,
    verification_url: verifyLink,
    support_email: getSupportEmail(organization),
    year: new Date().getFullYear()
  });
  const emailSent = await sendEmail({
    to: email,
    subject: 'Verify your organization email and save your org code',
    text: [
      'Welcome to FacilityPro!',
      '',
      `Your organization code: ${orgCode}`,
      'Use this code to log in and invite team members to join your organization.',
      '',
      'Verify your organization email by visiting:',
      verifyLink
    ].join('\n'),
    html: verifyHtml || [
      '<p>Welcome to FacilityPro!</p>',
      `<p><strong>Your organization code:</strong> ${orgCode}</p>`,
      '<p>Use this code to log in and invite team members to join your organization.</p>',
      '<p>Please verify your organization email by clicking the link below:</p>',
      `<p><a href="${verifyLink}">${verifyLink}</a></p>`
    ].join('')
  });

  if (!emailSent) {
    await User.deleteOne({ _id: user._id });
    await Organization.deleteOne({ _id: organization._id });
    throw new BadRequestError('Verification email could not be sent. Please try again later.');
  }

  const token = generateToken(user);
  const userResponse = user.toObject();
  delete userResponse.password;

  userResponse.organizationName = organization.name;
  userResponse.organizationId = organization._id;

  return {
    organization,
    user: userResponse,
    token,
    emailSent,
    ...(DEBUG_VERIFY_EMAIL ? { verificationLink: verifyLink } : {})
  };
};

const register = async ({
  firstName,
  lastName,
  email,
  password,
  role,
  orgCode,
  inviteCode,
  phone,
  gender
}) => {
  if (!orgCode && !inviteCode) {
    throw new ValidationError('orgCode or inviteCode is required');
  }

  const normalizedOrgCode = orgCode ? String(orgCode).toUpperCase() : null;
  const normalizedInviteCode = inviteCode ? String(inviteCode).toUpperCase() : null;

  let organization;
  let assignedRole = role || constants.ROLES.STAFF;
  let inviteIndex = -1;

  if (normalizedInviteCode) {
    organization = await Organization.findOne({ 'invites.code': normalizedInviteCode });
    if (!organization) {
      throw new ValidationError('Invalid invite code');
    }
    if (organization.status !== 'active') {
      throw new ValidationError('Organization is disabled');
    }

    inviteIndex = organization.invites.findIndex((inv) => inv.code === normalizedInviteCode);
    const invite = organization.invites[inviteIndex];
    if (!invite || invite.usedAt) {
      throw new ValidationError('Invite code already used');
    }
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new ValidationError('Invite code expired');
    }
    assignedRole = invite.role;
  }

  if (normalizedOrgCode) {
    if (!organization) {
      organization = await Organization.findOne({ orgCode: normalizedOrgCode });
    }
    if (!organization) {
      throw new ValidationError('Organization not found');
    }
    if (organization.status !== 'active') {
      throw new ValidationError('Organization is disabled');
    }
    if (!inviteCode && assignedRole === constants.ROLES.ADMIN) {
      throw new ValidationError('Admin role requires organization registration');
    }
  }

  const settings = normalizeSettings(organization);
  if (!isEmailAllowedByPolicy(email, settings.securityPolicy)) {
    throw new ValidationError('Email domain is not allowed for this organization');
  }

  // Check if user exists within org
  const existingUser = await User.findOne({ email, organization: organization._id });
  if (existingUser) {
    throw new ConflictError('Email already registered for this organization');
  }

  const user = new User({
    firstName,
    lastName,
    email,
    password,
    phone,
    gender,
    role: assignedRole,
    organization: organization._id,
    // Joined members must verify email before becoming active in the org
    active: false
  });

  await user.save();

  const token = generateToken(user);
  const userResponse = user.toObject();
  delete userResponse.password;

  userResponse.organizationName = organization.name;
  userResponse.organizationId = organization._id;

  const emailBaseUrl = getEmailBaseUrl();
  const rawToken = crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  user.emailVerificationTokenHash = tokenHash;
  user.emailVerificationExpiresAt = expiresAt;
  await user.save();
  const verifyLink = `${emailBaseUrl}/verify-user-email?token=${rawToken}&orgCode=${organization.orgCode}&email=${encodeURIComponent(user.email)}`;
  const verifyHtml = renderTemplate('facilitypro-verify-email.html', {
    recipient_name: getRecipientName(user),
    org_name: organization.name,
    org_code: organization.orgCode,
    verification_url: verifyLink,
    support_email: getSupportEmail(organization),
    year: new Date().getFullYear()
  });
  const emailSent = await sendEmail({
    to: user.email,
    subject: 'Verify your email address',
    text: [
      'Welcome to FacilityPro!',
      '',
      'Please verify your email address by visiting:',
      verifyLink
    ].join('\n'),
    html: verifyHtml || [
      '<p>Welcome to FacilityPro!</p>',
      '<p>Please verify your email address by clicking the link below:</p>',
      `<p><a href="${verifyLink}">${verifyLink}</a></p>`
    ].join('')
  });

  if (!emailSent) {
    if (normalizedInviteCode && inviteIndex >= 0) {
      organization.invites[inviteIndex].usedAt = null;
      organization.invites[inviteIndex].usedBy = null;
      await organization.save();
    }
    await User.deleteOne({ _id: user._id });
    throw new BadRequestError('Verification email could not be sent. Please try again later.');
  }

  if (normalizedInviteCode && inviteIndex >= 0) {
    organization.invites[inviteIndex].usedAt = new Date();
    organization.invites[inviteIndex].usedBy = user._id;
    await organization.save();
  }

  return {
    user: userResponse,
    token,
    organizationCode: organization.orgCode,
    emailSent,
    ...(DEBUG_VERIFY_EMAIL ? { verificationLink: verifyLink } : {})
  };
};

const createInviteCode = async ({ organizationId, role, expiresAt, createdBy, inviteEmail, inviter }) => {
  if (!organizationId) throw new ValidationError('Organization is required');
  if (!role) throw new ValidationError('Role is required');

  const organization = await Organization.findById(organizationId);
  if (!organization) {
    throw new ValidationError('Organization not found');
  }
  if (organization.status !== 'active') {
    throw new ValidationError('Organization is disabled');
  }

  const code = Organization.generateInviteCode();
  organization.invites.push({
    code,
    role,
    expiresAt: expiresAt || null,
    createdBy
  });

  await organization.save();

  if (inviteEmail) {
  const emailBaseUrl = getEmailBaseUrl();
  const inviteLink = `${emailBaseUrl}/register?invite=${code}`;
    const inviteHtml = renderTemplate('facilitypro-invite.html', {
      recipient_name: inviteEmail,
      org_name: organization.name,
      inviter_name: inviter?.name || inviter?.email || 'FacilityPro Admin',
      role_name: getRoleLabel(role),
      invite_url: inviteLink,
      org_code: organization.orgCode,
      recipient_email: inviteEmail,
      support_email: getSupportEmail(organization),
      year: new Date().getFullYear()
    });
    await sendEmail({
      to: inviteEmail,
      subject: `You're invited to join ${organization.name} on FacilityPro`,
      text: [
        `You have been invited to join ${organization.name} on FacilityPro.`,
        `Role: ${getRoleLabel(role)}`,
        '',
        'Accept the invite:',
        inviteLink
      ].join('\n'),
      html: inviteHtml || [
        `<p>You have been invited to join <strong>${organization.name}</strong> on FacilityPro.</p>`,
        `<p>Role: ${getRoleLabel(role)}</p>`,
        `<p><a href="${inviteLink}">Accept invite</a></p>`
      ].join('')
    });
  }

  return { code, role, expiresAt: expiresAt || null };
};

const login = async (email, password, orgCode, rememberMe = false) => {
  if (!email || !password || !orgCode) {
    throw new ValidationError('Email, password, and orgCode are required');
  }

  const normalizedOrgCode = String(orgCode).toUpperCase();
  const organization = await Organization.findOne({ orgCode: normalizedOrgCode });
  if (!organization) {
    throw new AuthenticationError('Invalid org code');
  }
  if (!organization.orgEmailVerifiedAt) {
    throw new AuthenticationError('Organization email is not verified');
  }
  if (organization.status !== 'active') {
    throw new AuthenticationError('Organization is disabled');
  }

  const user = await User.findOne({ email, organization: organization._id }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AuthenticationError('Invalid email or password');
  }
  if (!user.emailVerifiedAt) {
    throw new AuthenticationError('User email is not verified');
  }

  if (isLegacyUploadPath(user.avatar)) {
    user.avatar = sanitizeAvatarValue(user.avatar);
    await user.save();
  }

  // Update last login / last active
  user.lastLogin = new Date();
  user.lastActive = user.lastLogin;
  await user.save();

  const expiresIn = rememberMe ? constants.JWT_EXPIRE_LONG : constants.JWT_EXPIRE_SHORT;
  const token = generateToken(user, expiresIn);
  const userResponse = user.toObject();
  delete userResponse.password;

  userResponse.organizationName = organization.name;
  userResponse.organizationId = organization._id;

  return { user: userResponse, token };
};

const verifyUserEmail = async (token, { orgCode, email } = {}) => {
  const normalizedToken = String(token || '').trim();
  const tokenHash = crypto.createHash('sha256').update(normalizedToken).digest('hex');
  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpiresAt: { $gt: new Date() }
  });
  if (!user) {
    const normalizedOrgCode = orgCode ? String(orgCode).toUpperCase() : null;
    const normalizedEmail = email ? String(email).toLowerCase() : null;
    if (normalizedOrgCode && normalizedEmail) {
      const org = await Organization.findOne({ orgCode: normalizedOrgCode });
      if (org) {
        const fallback = await User.findOne({ organization: org._id, email: normalizedEmail });
        if (fallback?.emailVerifiedAt) {
          return { userId: fallback._id, verifiedAt: fallback.emailVerifiedAt };
        }
      }
    }
    throw new ValidationError('Verification token is invalid or expired');
  }

  user.emailVerifiedAt = new Date();
  user.emailVerificationTokenHash = null;
  user.emailVerificationExpiresAt = null;
  if (!user.active) {
    user.active = true;
  }
  await user.save();
  return { userId: user._id, verifiedAt: user.emailVerifiedAt };
};

const sendUserEmailVerificationAgain = async ({ orgCode, email } = {}) => {
  const normalizedOrgCode = String(orgCode || '').toUpperCase();
  const normalizedEmail = String(email || '').toLowerCase();
  const org = await Organization.findOne({ orgCode: normalizedOrgCode });
  if (!org) throw new ValidationError('Organization code is invalid');
  const user = await User.findOne({ organization: org._id, email: normalizedEmail });
  if (!user) throw new ValidationError('User not found for this organization');

  const rawToken = crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  user.emailVerificationTokenHash = tokenHash;
  user.emailVerificationExpiresAt = expiresAt;
  await user.save();

  const emailBaseUrl = getEmailBaseUrl();
  const verifyLink = `${emailBaseUrl}/verify-user-email?token=${rawToken}&orgCode=${org.orgCode}&email=${encodeURIComponent(user.email)}`;
  const verifyHtml = renderTemplate('facilitypro-verify-email.html', {
    recipient_name: getRecipientName(user),
    org_name: org.name,
    org_code: org.orgCode,
    verification_url: verifyLink,
    support_email: getSupportEmail(org),
    year: new Date().getFullYear()
  });
  const emailSent = await sendEmail({
    to: user.email,
    subject: 'Verify your email address',
    text: [
      'Please verify your email address by visiting:',
      verifyLink
    ].join('\n'),
    html: verifyHtml || [
      '<p>Please verify your email address by clicking the link below:</p>',
      `<p><a href="${verifyLink}">${verifyLink}</a></p>`
    ].join('')
  });

  return {
    sent: emailSent,
    ...(DEBUG_VERIFY_EMAIL ? { verificationLink: verifyLink } : {})
  };
};

const requestPasswordReset = async (email, orgCode) => {
  if (!email || !orgCode) {
    throw new ValidationError('Email and orgCode are required');
  }

  const normalizedOrgCode = String(orgCode).toUpperCase();
  const organization = await Organization.findOne({ orgCode: normalizedOrgCode });
  if (!organization) return { sent: false };

  const user = await User.findOne({ email: String(email).toLowerCase(), organization: organization._id });
  if (!user) return { sent: false };

  const rawToken = crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  user.resetPasswordTokenHash = tokenHash;
  user.resetPasswordExpiresAt = expiresAt;
  await user.save();

  const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendBaseUrl}/reset-password?token=${rawToken}&orgCode=${normalizedOrgCode}`;
  const resetHtml = renderTemplate('facilitypro-password-reset.html', {
    recipient_name: getRecipientName(user),
    org_name: organization.name,
    reset_url: resetLink,
    reset_expiry: '1 hour',
    support_email: getSupportEmail(organization),
    year: new Date().getFullYear()
  });
  const emailSent = await sendEmail({
    to: user.email,
    subject: 'Reset your FacilityPro password',
    text: `Reset your password using this link: ${resetLink}`,
    html: resetHtml || `<p>Reset your password using the link below:</p><p><a href="${resetLink}">${resetLink}</a></p>`
  });

  return { sent: emailSent };
};

const resetPassword = async (token, orgCode, newPassword) => {
  const normalizedOrgCode = String(orgCode || '').toUpperCase();
  const organization = await Organization.findOne({ orgCode: normalizedOrgCode });
  if (!organization) throw new ValidationError('Invalid or expired reset token');

  const tokenHash = crypto.createHash('sha256').update(String(token || '')).digest('hex');
  const user = await User.findOne({
    organization: organization._id,
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() }
  }).select('+password');

  if (!user) throw new ValidationError('Invalid or expired reset token');

  user.password = newPassword;
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpiresAt = null;
  await user.save();

  return { success: true };
};

const validateToken = (token) => {
  try {
    const decoded = jwt.verify(token, constants.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new AuthenticationError('Invalid token');
  }
};

module.exports = {
  register,
  registerOrganization,
  createInviteCode,
  login,
  verifyUserEmail,
  sendUserEmailVerificationAgain,
  requestPasswordReset,
  resetPassword,
  validateToken,
  generateToken
};
