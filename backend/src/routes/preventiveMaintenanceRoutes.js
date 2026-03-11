// Preventive Maintenance Routes
const express = require('express');
const router = express.Router();
const preventiveMaintenanceController = require('../controllers/preventiveMaintenanceController');
const { protect } = require('../middleware/auth');

router.get('/', protect, preventiveMaintenanceController.getPreventiveMaintenances);
router.get('/upcoming', protect, preventiveMaintenanceController.getUpcomingMaintenance);
router.get('/:id', protect, preventiveMaintenanceController.getPreventiveMaintenanceById);
router.post('/', protect, preventiveMaintenanceController.createPreventiveMaintenance);
router.put('/:id', protect, preventiveMaintenanceController.updatePreventiveMaintenance);
router.patch('/:id/perform', protect, preventiveMaintenanceController.markAsPerformed);
router.delete('/:id', protect, preventiveMaintenanceController.deletePreventiveMaintenance);

module.exports = router;
