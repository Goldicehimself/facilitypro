// Auth Controller
const authService = require('../services/authService');
const auditService = require('../services/auditService');
const response = require('../utils/response');
const { NotFoundError, ValidationError, AuthorizationError } = require('../utils/errorHandler');
const userStatsService = require('../services/userStatsService');
const User = require('../models/User');
const constants = require('../constants/constants');
const { getSignedUrl } = require('../services/cloudinaryService');
const { isLegacyUploadPath, sanitizeAvatarValue } = require('../utils/userSanitizer');
const cloudinary = require('../utils/cloudinary');
const notificationService = require('../services/notificationService');

const register = async (req, res, next) => {
  try {
    const payload = req.validatedData || req.body;
    const result = await authService.register(payload);
    response.created(res, 'User registered successfully', result);
  } catch (error) {
    next(error);
  }
};

const registerOrganization = async (req, res, next) => {
  try {
    const payload = req.validatedData || req.body;
    const result = await authService.registerOrganization(payload);
    response.created(res, 'Organization registered successfully', result);
  } catch (error) {
    next(error);
  }
};

const createInvite = async (req, res, next) => {
  try {
    const payload = req.validatedData || req.body;
    const inviterUser = await User.findById(req.user.id).select('firstName lastName email');
    const inviterName = [inviterUser?.firstName, inviterUser?.lastName].filter(Boolean).join(' ').trim();
    const result = await authService.createInviteCode({
      organizationId: req.user.organization,
      role: payload.role,
      expiresAt: payload.expiresAt,
      createdBy: req.user.id,
      inviteEmail: payload.email,
      inviter: {
        name: inviterName || inviterUser?.email,
        email: inviterUser?.email
      }
    });
    response.created(res, 'Invite code created', result);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, orgCode, rememberMe } = req.validatedData || req.body;
    const result = await authService.login(email, password, orgCode, rememberMe);
    response.success(res, 'Login successful', result);
    if (result?.user?._id || result?.user?.id) {
      try {
        await auditService.createAuditLog({
          organization: result.user.organizationId || result.user.organization,
          actor: result.user._id || result.user.id,
          action: 'login',
          entityType: 'user',
          entityId: result.user._id || result.user.id,
          metadata: {
            ip: req.ip,
            userAgent: req.get('user-agent') || ''
          }
        });
      } catch (e) {
        // Do not block login on audit failures
      }
    }
    if (result?.user?.organization && result?.user?.id) {
      userStatsService.refreshUserStats({
        organizationId: result.user.organization,
        userId: result.user.id
      }).catch(() => {});
    }
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email, orgCode } = req.validatedData || req.body;
    await authService.requestPasswordReset(email, orgCode);
    response.success(res, 'If the account exists, a reset email has been sent', { sent: true });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, orgCode, password } = req.validatedData || req.body;
    await authService.resetPassword(token, orgCode, password);
    response.success(res, 'Password reset successfully', { success: true });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    response.success(res, 'Logged out successfully', null);
  } catch (error) {
    next(error);
  }
};

const verifyToken = async (req, res, next) => {
  try {
    const result = authService.validateToken(req.headers.authorization?.split(' ')[1]);
    response.success(res, 'Token is valid', { user: result });
  } catch (error) {
    next(error);
  }
};

const verifyUserEmail = async (req, res, next) => {
  try {
    const { token, orgCode, email } = req.validatedQuery || req.query;
    const result = await authService.verifyUserEmail(token, { orgCode, email });
    response.success(res, 'User email verified', result);
  } catch (error) {
    next(error);
  }
};

const sendUserEmailVerificationAgain = async (req, res, next) => {
  try {
    const { orgCode, email } = req.validatedData || req.body;
    const result = await authService.sendUserEmailVerificationAgain({ orgCode, email });
    response.success(res, 'Verification email sent again', result);
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    let user = await User.findById(req.user.id).select('-password');
    if (!user) throw new NotFoundError('User');
    if (isLegacyUploadPath(user.avatar)) {
      user = await User.findByIdAndUpdate(
        req.user.id,
        { avatar: sanitizeAvatarValue(user.avatar) },
        { new: true, runValidators: true }
      ).select('-password');
    }
    response.success(res, 'Profile retrieved', user);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const payload = req.validatedData || req.body;
    let previousAvatarPublicId = null;
    const updates = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
      department: payload.department,
      avatar: payload.avatar,
      preferences: payload.preferences,
      avatarPublicId: undefined
    };

    if (req.file?.path) {
      if (req.file.cloudinary?.publicId) {
        const existing = await User.findById(req.user.id).select('avatarPublicId');
        previousAvatarPublicId = existing?.avatarPublicId || null;
        updates.avatarPublicId = req.file.cloudinary.publicId;
      }
      updates.avatar = req.file.path;
    }

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) delete updates[key];
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) throw new NotFoundError('User');
    response.success(res, 'Profile updated', user);

    if (previousAvatarPublicId && previousAvatarPublicId !== updates.avatarPublicId) {
      cloudinary.uploader
        .destroy(previousAvatarPublicId, { resource_type: 'image' })
        .catch(() => {});
    }
  } catch (error) {
    next(error);
  }
};

const uploadCertificates = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new ValidationError('At least one certificate is required');
    }

    const certificates = req.files.map((file) => ({
      publicId: file.cloudinary?.publicId,
      resourceType: file.cloudinary?.resourceType,
      format: file.cloudinary?.format,
      bytes: file.cloudinary?.bytes,
      originalName: file.originalname,
      mimeType: file.mimetype,
      status: 'pending',
      uploadedAt: new Date()
    })).filter((item) => item.publicId);

    if (!certificates.length) {
      throw new ValidationError('Certificate upload failed');
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { certificates: { $each: certificates } } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) throw new NotFoundError('User');
    response.success(res, 'Certificates uploaded successfully', user);

    try {
      const recipients = await notificationService.getRoleUserIds(
        [constants.ROLES.ADMIN, constants.ROLES.FACILITY_MANAGER],
        req.user.organization
      );
      const senderName = [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ').trim() || req.user?.email || 'Technician';
      await notificationService.createNotificationsForUsers(recipients, {
        organization: req.user.organization,
        title: 'New technician certificate uploaded',
        message: `${senderName} uploaded ${certificates.length} certificate${certificates.length === 1 ? '' : 's'} for review.`,
        type: 'certificate_uploaded',
        entityType: 'User',
        entityId: req.user.id,
        link: '/staff-management',
        metadata: {
          uploaderId: req.user.id,
          uploaderName: senderName,
          count: certificates.length
        }
      });
    } catch (error) {
      // Do not block upload on notification errors
    }
    userStatsService.refreshUserStats({
      organizationId: req.user.organization,
      userId: req.user.id
    }).catch(() => {});
  } catch (error) {
    next(error);
  }
};

const getCertificateUrl = async (req, res, next) => {
  try {
    const publicId = String(req.query.publicId || '').trim();
    const targetUserId = req.query.userId || req.user.id;
    if (!publicId) {
      throw new ValidationError('publicId is required');
    }

    if (targetUserId !== req.user.id) {
      const allowedRoles = [constants.ROLES.ADMIN, constants.ROLES.FACILITY_MANAGER];
      if (!allowedRoles.includes(req.user?.role)) {
        throw new AuthorizationError('Access denied');
      }
    }

    const user = await User.findById(targetUserId).select('certificates');
    if (!user) throw new NotFoundError('User');

    const certificate = (user.certificates || []).find((entry) => {
      if (!entry) return false;
      if (typeof entry === 'string') return entry === publicId;
      return entry.publicId === publicId;
    });

    if (!certificate) {
      throw new AuthorizationError('Access denied');
    }

    const resourceType = typeof certificate === 'string' ? 'raw' : (certificate.resourceType || 'raw');
    const url = getSignedUrl(publicId, { resourceType, expiresInSec: 600 });

    response.success(res, 'Certificate URL generated', { url, expiresInSec: 600 });
  } catch (error) {
    next(error);
  }
};

const deleteCertificate = async (req, res, next) => {
  try {
    const publicId = String(req.params.publicId || req.query.publicId || '').trim();
    if (!publicId) {
      throw new ValidationError('publicId is required');
    }

    const user = await User.findById(req.user.id).select('certificates');
    if (!user) throw new NotFoundError('User');

    const certs = Array.isArray(user.certificates) ? user.certificates : [];
    const exists = certs.find((entry) =>
      typeof entry === 'string' ? entry === publicId : entry?.publicId === publicId
    );
    if (!exists) {
      throw new AuthorizationError('Access denied');
    }

    user.certificates = certs.filter((entry) =>
      typeof entry === 'string' ? entry !== publicId : entry?.publicId !== publicId
    );
    await user.save();
    userStatsService.refreshUserStats({
      organizationId: req.user.organization,
      userId: req.user.id
    }).catch(() => {});

    const resourceType = typeof exists === 'string' ? 'raw' : (exists.resourceType || 'raw');
    cloudinary.uploader.destroy(publicId, { resource_type: resourceType, type: 'authenticated' }).catch(() => {});

    response.success(res, 'Certificate deleted', { publicId });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  registerOrganization,
  login,
  forgotPassword,
  resetPassword,
  logout,
  verifyToken,
  verifyUserEmail,
  sendUserEmailVerificationAgain,
  getProfile,
  updateProfile,
  uploadCertificates,
  getCertificateUrl,
  deleteCertificate,
  createInvite
};
