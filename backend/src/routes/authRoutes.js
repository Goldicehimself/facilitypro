// Auth Routes
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest, validateQuery } = require('../middleware/validation');
const { parseMultipartJson } = require('../middleware/parseMultipartJson');
const { updateUserSchema, registerSchema, registerOrgSchema, inviteSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, verifyUserEmailQuerySchema, sendUserEmailAgainBodySchema } = require('../validators/userValidator');
const { uploadAvatar, uploadCertificateMultiple } = require('../../multer/multer');
const { uploadSingle, uploadMultiple } = require('../middleware/cloudinaryUpload');

const attachAvatarPath = (req, res, next) => {
  if (req.file?.path) {
    req.body.avatar = req.file.path;
  }
  next();
};

const uploadAvatarToCloudinary = uploadSingle('facilitypro/avatars', 'image');
const uploadCertificatesToCloudinary = uploadMultiple('facilitypro/certificates', null, { type: 'authenticated' });

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/register-org', validateRequest(registerOrgSchema), authController.registerOrganization);
router.post('/invite', protect, authorize('admin', 'facility_manager'), validateRequest(inviteSchema), authController.createInvite);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);
router.post('/logout', protect, authController.logout);
router.get('/verify', protect, authController.verifyToken);
router.get('/verify-user-email', validateQuery(verifyUserEmailQuerySchema), authController.verifyUserEmail);
router.post('/send-verify-user-email', validateRequest(sendUserEmailAgainBodySchema), authController.sendUserEmailVerificationAgain);
router.get('/profile', protect, authController.getProfile);
router.put(
  '/profile',
  protect,
  uploadAvatar,
  uploadAvatarToCloudinary,
  attachAvatarPath,
  parseMultipartJson(['preferences']),
  validateRequest(updateUserSchema),
  authController.updateProfile
);
router.post('/certificates', protect, uploadCertificateMultiple, uploadCertificatesToCloudinary, authController.uploadCertificates);
router.get('/certificates/url', protect, authController.getCertificateUrl);
router.delete('/certificates', protect, authController.deleteCertificate);
router.delete('/certificates/:publicId', protect, authController.deleteCertificate);

module.exports = router;
