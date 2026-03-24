// Vendor Controller
const vendorService = require('../services/vendorService');
const vendorAnalyticsService = require('../services/vendorAnalyticsService');
const response = require('../utils/response');

const getVendors = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, active } = req.query;
    const filters = {};
    const organizationId = req.user.organization;
    
    if (category) filters.category = category;
    if (active !== undefined) filters.active = active === 'true';

    const result = await vendorService.getVendors(organizationId, filters, parseInt(page), parseInt(limit));
    response.success(res, 'Vendors retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

const getVendorById = async (req, res, next) => {
  try {
    const vendor = await vendorService.getVendorById(req.user.organization, req.params.id);
    response.success(res, 'Vendor retrieved successfully', vendor);
  } catch (error) {
    next(error);
  }
};

const createVendor = async (req, res, next) => {
  try {
    const vendor = await vendorService.createVendor(req.user.organization, req.body);
    response.created(res, 'Vendor created successfully', vendor);
  } catch (error) {
    next(error);
  }
};

const importVendors = async (req, res, next) => {
  try {
    const { vendors = [] } = req.validatedData || req.body;
    const result = await vendorService.importVendors(req.user.organization, vendors);
    response.success(res, 'Vendors imported successfully', result);
  } catch (error) {
    next(error);
  }
};

const updateVendor = async (req, res, next) => {
  try {
    const vendor = await vendorService.updateVendor(req.user.organization, req.params.id, req.body);
    response.success(res, 'Vendor updated successfully', vendor);
  } catch (error) {
    next(error);
  }
};

const deleteVendor = async (req, res, next) => {
  try {
    await vendorService.deleteVendor(req.user.organization, req.params.id);
    response.success(res, 'Vendor deleted successfully', null);
  } catch (error) {
    next(error);
  }
};

const getVendorAnalytics = async (req, res, next) => {
  try {
    const { range = 30 } = req.query;
    const parsedRange = Math.max(parseInt(range, 10) || 30, 1);
    const result = await vendorAnalyticsService.getAnalytics(req.user.organization, parsedRange);
    response.success(res, 'Vendor analytics retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  importVendors,
  getVendorAnalytics
};
