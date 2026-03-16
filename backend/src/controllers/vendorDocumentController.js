// Vendor Document Controller
const vendorDocumentService = require('../services/vendorDocumentService');
const response = require('../utils/response');

const getVendorDocuments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, ...filters } = req.validatedQuery || req.query;
    const result = await vendorDocumentService.listVendorDocuments(
      req.user.organization,
      req.params.id,
      filters,
      parseInt(page),
      parseInt(limit)
    );
    response.success(res, 'Vendor documents retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

const createVendorDocument = async (req, res, next) => {
  try {
    const document = await vendorDocumentService.createVendorDocument(
      req.user.organization,
      req.params.id,
      req.user.id,
      req.validatedData || req.body
    );
    response.created(res, 'Vendor document created successfully', document);
  } catch (error) {
    next(error);
  }
};

const uploadVendorDocument = async (req, res, next) => {
  try {
    if (!req.file?.path) {
      response.badRequest(res, 'Document file is required');
      return;
    }
    const payload = {
      name: req.body?.name || req.file.originalname,
      type: req.body?.type || req.file.mimetype,
      url: req.file.path,
      size: req.body?.size || `${req.file.size || 0} bytes`
    };
    const document = await vendorDocumentService.createVendorDocument(
      req.user.organization,
      req.params.id,
      req.user.id,
      payload
    );
    response.created(res, 'Vendor document uploaded successfully', document);
  } catch (error) {
    next(error);
  }
};

const updateVendorDocument = async (req, res, next) => {
  try {
    const document = await vendorDocumentService.updateVendorDocument(
      req.user.organization,
      req.params.id,
      req.params.documentId,
      req.validatedData || req.body
    );
    response.success(res, 'Vendor document updated successfully', document);
  } catch (error) {
    next(error);
  }
};
const deleteVendorDocument = async (req, res, next) => {
  try {
    const document = await vendorDocumentService.deleteVendorDocument(
      req.user.organization,
      req.params.id,
      req.params.documentId
    );
    response.success(res, 'Vendor document deleted successfully', document);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVendorDocuments,
  createVendorDocument,
  uploadVendorDocument,
  updateVendorDocument,
  deleteVendorDocument
};
