// Report Controller
const reportService = require('../services/reportService');
const response = require('../utils/response');

const getReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, user } = req.query;
    const filters = {};
    
    if (type) filters.type = type;
    if (user) filters.generatedBy = user;

    const result = await reportService.getReports(req.user.organization, filters, parseInt(page), parseInt(limit));
    response.success(res, 'Reports retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

const getReportById = async (req, res, next) => {
  try {
    const report = await reportService.getReportById(req.user.organization, req.params.id);
    response.success(res, 'Report retrieved successfully', report);
  } catch (error) {
    next(error);
  }
};

const createReport = async (req, res, next) => {
  try {
    const payload = { ...req.body, generatedBy: req.user.id };
    const report = await reportService.createReport(req.user.organization, payload);
    response.created(res, 'Report created successfully', report);
  } catch (error) {
    next(error);
  }
};

const generateReport = async (req, res, next) => {
  try {
    const report = await reportService.generateReport(req.user.organization, req.body, req.user.id);
    response.created(res, 'Report generated successfully', report);
  } catch (error) {
    next(error);
  }
};

const updateReport = async (req, res, next) => {
  try {
    const report = await reportService.updateReport(req.user.organization, req.params.id, req.body);
    response.success(res, 'Report updated successfully', report);
  } catch (error) {
    next(error);
  }
};

const deleteReport = async (req, res, next) => {
  try {
    await reportService.deleteReport(req.user.organization, req.params.id);
    response.success(res, 'Report deleted successfully', null);
  } catch (error) {
    next(error);
  }
};

const getMyReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await reportService.getReportsByUser(req.user.organization, req.user.id, parseInt(page), parseInt(limit));
    response.success(res, 'Your reports retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

const getReportsByType = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await reportService.getReportsByType(req.user.organization, req.params.type, parseInt(page), parseInt(limit));
    response.success(res, `${req.params.type} reports retrieved successfully`, result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReports,
  getReportById,
  createReport,
  generateReport,
  updateReport,
  deleteReport,
  getMyReports,
  getReportsByType
};
