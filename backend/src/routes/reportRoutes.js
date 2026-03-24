// Report Routes
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, requireScope } = require('../middleware/auth');

router.get('/', protect, requireScope('reports:read'), reportController.getReports);
router.get('/analytics', protect, requireScope('reports:read'), reportController.getReportAnalytics);
router.get('/warnings', protect, requireScope('reports:read'), reportController.getReportWarnings);
router.get('/my-reports', protect, requireScope('reports:read'), reportController.getMyReports);
router.get('/type/:type', protect, requireScope('reports:read'), reportController.getReportsByType);
router.get('/:id', protect, requireScope('reports:read'), reportController.getReportById);
router.post('/', protect, requireScope('reports:write'), reportController.createReport);
router.post('/export', protect, requireScope('reports:read'), reportController.exportReport);
router.post('/generate', protect, requireScope('reports:write'), reportController.generateReport);
router.put('/:id', protect, requireScope('reports:write'), reportController.updateReport);
router.delete('/:id', protect, requireScope('reports:write'), reportController.deleteReport);

module.exports = router;
