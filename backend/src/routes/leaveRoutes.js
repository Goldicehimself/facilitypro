// Leave Routes
const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest, validateQuery } = require('../middleware/validation');
const { createLeaveSchema, approveDecisionSchema, rejectDecisionSchema, listLeaveQuerySchema } = require('../validators/leaveValidator');

router.post('/', protect, validateRequest(createLeaveSchema), leaveController.createLeaveRequest);
router.get('/', protect, authorize('admin', 'facility_manager'), validateQuery(listLeaveQuerySchema), leaveController.listLeaves);
router.get('/my', protect, leaveController.getMyLeaves);
router.get('/pending', protect, authorize('admin', 'facility_manager'), leaveController.getPendingLeaves);
router.patch('/:id/approve', protect, authorize('admin', 'facility_manager'), validateRequest(approveDecisionSchema), leaveController.approveLeave);
router.patch('/:id/reject', protect, authorize('admin', 'facility_manager'), validateRequest(rejectDecisionSchema), leaveController.rejectLeave);

module.exports = router;
