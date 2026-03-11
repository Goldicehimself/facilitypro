// Service Request Routes
const express = require('express');
const router = express.Router();
const serviceRequestController = require('../controllers/serviceRequestController');
const { protect, requireScope } = require('../middleware/auth');
const { validateRequest, validateQuery } = require('../middleware/validation');
const {
  createServiceRequestSchema,
  updateServiceRequestSchema,
  serviceRequestListQuerySchema,
  assignServiceRequestSchema,
  updateServiceRequestStatusSchema
} = require('../validators/serviceRequestValidator');

router.get('/', protect, requireScope('service-requests:read'), validateQuery(serviceRequestListQuerySchema), serviceRequestController.getServiceRequests);
router.get('/summary', protect, requireScope('service-requests:read'), serviceRequestController.getServiceRequestSummary);
router.get('/:id', protect, requireScope('service-requests:read'), serviceRequestController.getServiceRequestById);
router.post('/', protect, requireScope('service-requests:write'), validateRequest(createServiceRequestSchema), serviceRequestController.createServiceRequest);
router.put('/:id', protect, requireScope('service-requests:write'), validateRequest(updateServiceRequestSchema), serviceRequestController.updateServiceRequest);
router.post('/:id/assign', protect, requireScope('service-requests:write'), validateRequest(assignServiceRequestSchema), serviceRequestController.assignServiceRequest);
router.patch('/:id/status', protect, requireScope('service-requests:write'), validateRequest(updateServiceRequestStatusSchema), serviceRequestController.updateServiceRequestStatus);
router.delete('/:id', protect, requireScope('service-requests:write'), serviceRequestController.deleteServiceRequest);

module.exports = router;
