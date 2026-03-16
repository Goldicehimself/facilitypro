// Vendor Routes
const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const vendorDocumentController = require('../controllers/vendorDocumentController');
const vendorPerformanceController = require('../controllers/vendorPerformanceController');
const { protect, requireScope } = require('../middleware/auth');
const { validateRequest, validateQuery } = require('../middleware/validation');
const { vendorImportSchema } = require('../validators/vendorValidator');
const { createVendorDocumentSchema, vendorDocumentListQuerySchema, updateVendorDocumentSchema } = require('../validators/vendorDocumentValidator');
const { uploadDocumentSingle } = require('../../multer/multer');
const { uploadSingle } = require('../middleware/cloudinaryUpload');

const uploadVendorDocumentFile = uploadSingle('facilitypro/vendor-documents', 'raw');

router.get('/', protect, requireScope('vendors:read'), vendorController.getVendors);
router.post('/import', protect, requireScope('vendors:write'), validateRequest(vendorImportSchema), vendorController.importVendors);
router.get('/:id', protect, requireScope('vendors:read'), vendorController.getVendorById);
router.post('/', protect, requireScope('vendors:write'), vendorController.createVendor);
router.put('/:id', protect, requireScope('vendors:write'), vendorController.updateVendor);
router.delete('/:id', protect, requireScope('vendors:write'), vendorController.deleteVendor);
router.get('/:id/documents', protect, requireScope('vendors:read'), validateQuery(vendorDocumentListQuerySchema), vendorDocumentController.getVendorDocuments);
router.post('/:id/documents', protect, requireScope('vendors:write'), validateRequest(createVendorDocumentSchema), vendorDocumentController.createVendorDocument);
router.post('/:id/documents/upload', protect, requireScope('vendors:write'), uploadDocumentSingle, uploadVendorDocumentFile, vendorDocumentController.uploadVendorDocument);
router.put('/:id/documents/:documentId', protect, requireScope('vendors:write'), validateRequest(updateVendorDocumentSchema), vendorDocumentController.updateVendorDocument);
router.delete('/:id/documents/:documentId', protect, requireScope('vendors:write'), vendorDocumentController.deleteVendorDocument);
router.get('/:id/performance', protect, requireScope('vendors:read'), vendorPerformanceController.getVendorPerformance);

module.exports = router;
