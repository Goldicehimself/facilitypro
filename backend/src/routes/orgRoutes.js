// Organization Routes
const express = require('express');
const router = express.Router();
const orgController = require('../controllers/orgController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest, validateQuery } = require('../middleware/validation');
const {
  listInvitesQuerySchema,
  setUserActiveSchema,
  updateOrgSettingsSchema,
  publicSecurityPolicyQuerySchema,
  verifyOrgEmailQuerySchema,
  sendOrgEmailAgainBodySchema,
  createWebhookSchema,
  createApiKeySchema,
  updateCertificateStatusSchema
} = require('../validators/orgValidator');

router.get('/members', protect, authorize('admin', 'facility_manager'), orgController.listMembers);
router.get('/invites', protect, authorize('admin', 'facility_manager'), validateQuery(listInvitesQuerySchema), orgController.listInvites);
router.delete('/invites/:code', protect, authorize('admin'), orgController.revokeInvite);
router.get('/settings', protect, authorize('admin', 'facility_manager'), orgController.getSettings);
router.put('/settings', protect, authorize('admin', 'facility_manager'), validateRequest(updateOrgSettingsSchema), orgController.updateSettings);
router.get('/public-security-policy', validateQuery(publicSecurityPolicyQuerySchema), orgController.getPublicSecurityPolicy);
router.get('/verify-email', validateQuery(verifyOrgEmailQuerySchema), orgController.verifyOrgEmail);
router.post('/send-verify-email', validateRequest(sendOrgEmailAgainBodySchema), orgController.sendOrgEmailVerificationAgain);
router.get('/integrations', protect, authorize('admin'), orgController.getIntegrations);
router.post('/integrations/webhooks', protect, authorize('admin'), validateRequest(createWebhookSchema), orgController.createWebhook);
router.delete('/integrations/webhooks/:id', protect, authorize('admin'), orgController.deleteWebhook);
router.post('/integrations/api-keys', protect, authorize('admin'), validateRequest(createApiKeySchema), orgController.createApiKey);
router.delete('/integrations/api-keys/:id', protect, authorize('admin'), orgController.revokeApiKey);
router.patch('/disable', protect, authorize('admin'), orgController.disableOrganization);
router.patch('/enable', protect, authorize('admin'), orgController.enableOrganization);
router.patch('/users/:id/active', protect, authorize('admin'), validateRequest(setUserActiveSchema), orgController.setUserActiveStatus);
router.patch(
  '/users/:id/certificates/status',
  protect,
  authorize('admin', 'facility_manager'),
  validateRequest(updateCertificateStatusSchema),
  orgController.updateCertificateStatus
);

module.exports = router;
