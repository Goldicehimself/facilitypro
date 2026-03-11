// Work Order Routes
const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrderController');
const { protect, requireScope } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { bulkAssignSchema } = require('../validators/workOrderValidator');
const { uploadWorkOrderPhotoMultiple } = require('../../multer/multer');
const { uploadMultiple } = require('../middleware/cloudinaryUpload');

const uploadWorkOrderPhotosToCloudinary = uploadMultiple('facilitypro/workorder-photos', 'image');

router.get('/', protect, requireScope('workorders:read'), workOrderController.getWorkOrders);
router.get('/:id', protect, requireScope('workorders:read'), workOrderController.getWorkOrderById);
router.post('/', protect, requireScope('workorders:write'), workOrderController.createWorkOrder);
router.put('/:id', protect, requireScope('workorders:write'), workOrderController.updateWorkOrder);
router.patch('/:id/status', protect, requireScope('workorders:write'), workOrderController.updateWorkOrderStatus);
router.post('/:id/assign', protect, requireScope('workorders:write'), workOrderController.assignWorkOrder);
router.post('/bulk-assign', protect, requireScope('workorders:write'), validateRequest(bulkAssignSchema), workOrderController.bulkAssignWorkOrders);
router.post('/:id/comments', protect, requireScope('workorders:write'), workOrderController.addComment);
router.post('/:id/photos', protect, requireScope('workorders:write'), uploadWorkOrderPhotoMultiple, uploadWorkOrderPhotosToCloudinary, workOrderController.addWorkOrderPhotos);
router.delete('/:id', protect, requireScope('workorders:write'), workOrderController.deleteWorkOrder);

module.exports = router;
