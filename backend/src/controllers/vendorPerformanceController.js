// Vendor Performance Controller
const vendorPerformanceService = require('../services/vendorPerformanceService');
const response = require('../utils/response');

const getVendorPerformance = async (req, res, next) => {
  try {
    const performance = await vendorPerformanceService.getVendorPerformance(
      req.user.organization,
      req.params.id
    );
    response.success(res, 'Vendor performance retrieved successfully', performance);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVendorPerformance
};
