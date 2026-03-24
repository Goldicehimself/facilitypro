// Asset Routes
const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { protect, requireScope } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { bulkAssetStatusSchema } = require('../validators/assetValidator');
const { uploadAssetSingle, uploadAssetMultiple, uploadAssetImport } = require('../../multer/multer');
const { uploadSingle } = require('../middleware/cloudinaryUpload');
const { parseMultipartJson } = require('../middleware/parseMultipartJson');

const uploadAssetImage = uploadSingle('facilitypro/assets', 'image');

router.get('/', protect, requireScope('assets:read'), assetController.getAssets);
router.get('/lookup', protect, requireScope('assets:read'), assetController.getAssetByCode);
router.get('/import/template', protect, requireScope('assets:read'), assetController.downloadImportTemplate);
router.get('/:id', protect, requireScope('assets:read'), assetController.getAssetById);
router.get('/:id/history', protect, requireScope('assets:read'), assetController.getAssetHistory);
router.post(
  '/',
  protect,
  requireScope('assets:write'),
  uploadAssetSingle,
  parseMultipartJson(['specs', 'warranty', 'performanceMetrics']),
  uploadAssetImage,
  assetController.createAsset
);
router.post('/import', protect, requireScope('assets:write'), uploadAssetImport, assetController.importAssets);
router.put(
  '/:id',
  protect,
  requireScope('assets:write'),
  uploadAssetSingle,
  parseMultipartJson(['specs', 'warranty', 'performanceMetrics']),
  uploadAssetImage,
  assetController.updateAsset
);
router.delete('/:id', protect, requireScope('assets:write'), assetController.deleteAsset);
router.post('/bulk-status', protect, requireScope('assets:write'), validateRequest(bulkAssetStatusSchema), assetController.bulkUpdateAssetStatus);

module.exports = router;
