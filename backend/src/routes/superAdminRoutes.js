const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const superAdminController = require('../controllers/superAdminController');
const {
  createOrganizationSchema,
  updateOrgStatusSchema,
  assignOrgAdminSchema,
  updateFeatureFlagsSchema,
  updateLicensingSchema,
  updateBillingSchema,
  updateUserStatusSchema,
  updateUserRoleSchema
} = require('../validators/superAdminValidator');

router.use(protect, authorize('super_admin'));

router.get('/overview', superAdminController.getOverview);

router.get('/organizations', superAdminController.listOrganizations);
router.post('/organizations', validateRequest(createOrganizationSchema), superAdminController.createOrganization);
router.patch('/organizations/:id/status', validateRequest(updateOrgStatusSchema), superAdminController.updateOrganizationStatus);
router.patch('/organizations/:id/admin', validateRequest(assignOrgAdminSchema), superAdminController.assignOrgAdmin);
router.patch('/organizations/:id/feature-flags', validateRequest(updateFeatureFlagsSchema), superAdminController.updateOrganizationFeatureFlags);
router.patch('/organizations/:id/licensing', validateRequest(updateLicensingSchema), superAdminController.updateOrganizationLicensing);
router.patch('/organizations/:id/billing', validateRequest(updateBillingSchema), superAdminController.updateOrganizationBilling);
router.get('/organizations/:id/integrations', superAdminController.getOrganizationIntegrations);
router.patch('/organizations/:id/api-keys/:keyId/revoke', superAdminController.revokeOrganizationApiKey);

router.get('/users', superAdminController.listUsers);
router.patch('/users/:id/active', validateRequest(updateUserStatusSchema), superAdminController.setUserActiveStatus);
router.patch('/users/:id/role', validateRequest(updateUserRoleSchema), superAdminController.updateUserRole);
router.post('/users/:id/force-password-reset', superAdminController.forcePasswordReset);
router.post('/users/:id/revoke-sessions', superAdminController.revokeUserSessions);
router.post('/users/:id/impersonate', superAdminController.impersonateUser);

router.get('/audit', superAdminController.listAuditLogs);

module.exports = router;
