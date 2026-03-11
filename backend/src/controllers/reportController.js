// Report Controller
const reportService = require('../services/reportService');
const response = require('../utils/response');
const WorkOrder = require('../models/WorkOrder');
const constants = require('../constants/constants');
const preventiveMaintenanceService = require('../services/preventiveMaintenanceService');

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

const getReportWarnings = async (req, res, next) => {
  try {
    const organizationId = req.user.organization;
    const now = new Date();

    const upcomingMaintenances = await preventiveMaintenanceService.getUpcomingMaintenance(organizationId, 7);
    const overdueWorkOrder = await WorkOrder.findOne({
      organization: organizationId,
      dueDate: { $lt: now },
      status: { $nin: ['completed', 'cancelled'] }
    })
      .populate('asset')
      .sort({ dueDate: 1 });

    const warnings = [];

    if (upcomingMaintenances?.length) {
      const nextMaintenance = upcomingMaintenances[0];
      const assetName = nextMaintenance.asset?.name || 'asset';
      const nextDue = new Date(nextMaintenance.nextDueDate);
      const daysUntilDue = Math.ceil((nextDue - now) / (24 * 60 * 60 * 1000));
      const scheduleDate = new Date();
      scheduleDate.setDate(scheduleDate.getDate() + 7);

      warnings.push({
        id: `pm_${nextMaintenance._id}`,
        type: 'pm_due_soon',
        title: 'Preventive maintenance due soon',
        message: `${assetName} is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}. Schedule the next cycle now.`,
        severity: daysUntilDue <= 2 ? 'high' : 'medium',
        createdAt: new Date().toISOString(),
        action: {
          type: 'schedule_pm',
          label: 'Schedule Now',
          payload: {
            name: `Preventive maintenance - ${assetName}`,
            asset: nextMaintenance.asset?._id || nextMaintenance.asset,
            description: `Auto-scheduled follow-up for ${assetName}.`,
            frequency: nextMaintenance.frequency || 'monthly',
            priority: nextMaintenance.priority || constants.PRIORITY.MEDIUM,
            nextDueDate: scheduleDate.toISOString(),
            requiresCertification: !!nextMaintenance.requiresCertification
          }
        },
        meta: {
          maintenanceId: nextMaintenance._id,
          assetId: nextMaintenance.asset?._id || nextMaintenance.asset
        }
      });
    } else if (overdueWorkOrder) {
      const assetName = overdueWorkOrder.asset?.name || 'asset';
      const scheduleDate = new Date();
      scheduleDate.setDate(scheduleDate.getDate() + 7);
      const priority =
        overdueWorkOrder.priority === constants.PRIORITY.URGENT
          ? constants.PRIORITY.HIGH
          : overdueWorkOrder.priority || constants.PRIORITY.MEDIUM;

      warnings.push({
        id: `wo_${overdueWorkOrder._id}`,
        type: 'overdue_work_order',
        title: 'Overdue work order detected',
        message: `${overdueWorkOrder.workOrderNumber} for ${assetName} is overdue. Schedule preventive maintenance.`,
        severity: [constants.PRIORITY.HIGH, constants.PRIORITY.URGENT].includes(overdueWorkOrder.priority)
          ? 'high'
          : 'medium',
        createdAt: new Date().toISOString(),
        action: {
          type: 'schedule_pm',
          label: 'Schedule Now',
          payload: {
            name: `Preventive maintenance - ${assetName}`,
            asset: overdueWorkOrder.asset?._id || overdueWorkOrder.asset,
            description: `Auto-scheduled from overdue work order ${overdueWorkOrder.workOrderNumber}.`,
            frequency: 'monthly',
            priority,
            nextDueDate: scheduleDate.toISOString(),
            requiresCertification: !!overdueWorkOrder.requiresCertification
          }
        },
        meta: {
          workOrderId: overdueWorkOrder._id,
          assetId: overdueWorkOrder.asset?._id || overdueWorkOrder.asset
        }
      });
    }

    response.success(res, 'Warnings retrieved successfully', { warnings });
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
  getReportsByType,
  getReportWarnings
};
