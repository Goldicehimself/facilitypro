// Report Service
const Report = require('../models/Report');
const { NotFoundError } = require('../utils/errorHandler');

const getReports = async (organizationId, filters = {}, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const scopedFilters = { ...filters, organization: organizationId };
  
  const query = Report.find(scopedFilters)
    .populate('generatedBy')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const [reports, total] = await Promise.all([
    query.exec(),
    Report.countDocuments(scopedFilters)
  ]);

  return {
    reports,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getReportById = async (organizationId, id) => {
  const report = await Report.findOne({ _id: id, organization: organizationId }).populate('generatedBy');
  if (!report) {
    throw new NotFoundError('Report');
  }
  return report;
};

const createReport = async (organizationId, reportData) => {
  reportData.organization = organizationId;
  const report = new Report(reportData);
  await report.save();
  await report.populate('generatedBy');
  return report;
};

const updateReport = async (organizationId, id, updateData) => {
  updateData.updatedAt = new Date();
  const report = await Report.findOneAndUpdate({ _id: id, organization: organizationId }, updateData, {
    new: true,
    runValidators: true
  }).populate('generatedBy');
  
  if (!report) {
    throw new NotFoundError('Report');
  }
  return report;
};

const deleteReport = async (organizationId, id) => {
  const report = await Report.findOneAndDelete({ _id: id, organization: organizationId });
  if (!report) {
    throw new NotFoundError('Report');
  }
  return report;
};

const generateReport = async (organizationId, reportData, userId) => {
  reportData.generatedBy = userId;
  reportData.organization = organizationId;
  const report = new Report(reportData);
  
  // Simulate data generation (would be replaced with actual report generation logic)
  report.data = {
    generatedAt: new Date(),
    summary: 'Report generated successfully',
    recordCount: 0
  };

  await report.save();
  await report.populate('generatedBy');
  return report;
};

const getReportsByUser = async (organizationId, userId, page = 1, limit = 20) => {
  return getReports(organizationId, { generatedBy: userId }, page, limit);
};

const getReportsByType = async (organizationId, type, page = 1, limit = 20) => {
  return getReports(organizationId, { type }, page, limit);
};

module.exports = {
  getReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  generateReport,
  getReportsByUser,
  getReportsByType
};
