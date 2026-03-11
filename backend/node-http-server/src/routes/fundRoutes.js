// Fund Request Routes
const express = require('express');
const router = express.Router();
const fundController = require('../controllers/fundController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest, validateQuery } = require('../middleware/validation');
const { createFundSchema, decisionSchema, listFundsQuerySchema } = require('../validators/fundValidator');

router.post('/', protect, validateRequest(createFundSchema), fundController.createFundRequest);
router.get('/', protect, authorize('admin'), validateQuery(listFundsQuerySchema), fundController.listFunds);
router.get('/my', protect, validateQuery(listFundsQuerySchema), fundController.listMyFunds);
router.patch('/:id/approve', protect, authorize('admin'), validateRequest(decisionSchema), fundController.approveFund);
router.patch('/:id/reject', protect, authorize('admin'), validateRequest(decisionSchema), fundController.rejectFund);

module.exports = router;
