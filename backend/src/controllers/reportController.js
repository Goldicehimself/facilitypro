// Report Controller
const reportService = require('../services/reportService');
const reportAnalyticsService = require('../services/reportAnalyticsService');
const response = require('../utils/response');
const WorkOrder = require('../models/WorkOrder');
const constants = require('../constants/constants');
const preventiveMaintenanceService = require('../services/preventiveMaintenanceService');
const PDFDocument = require('pdfkit');

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

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const buildAnalyticsCsv = (analytics, rangeDays) => {
  const lines = [];
  const { summary, workOrderTrends, costBreakdown, assetPerformance, scheduleOverview } = analytics;

  lines.push('Report Export');
  lines.push(`Generated At,${escapeCsvValue(new Date().toISOString())}`);
  lines.push(`Range Days,${escapeCsvValue(rangeDays)}`);
  lines.push('');

  lines.push('Summary');
  lines.push('Metric,Value');
  lines.push(`Total Work Orders,${escapeCsvValue(summary.totalWorkOrders)}`);
  lines.push(`Completion Rate (%),${escapeCsvValue(summary.completionRate)}`);
  lines.push(`Avg Response Time (hrs),${escapeCsvValue(summary.avgResponseTime)}`);
  lines.push(`Total Costs,${escapeCsvValue(summary.totalCosts)}`);
  lines.push(`Total Work Orders Trend (%),${escapeCsvValue(summary.totalWorkOrdersTrend)}`);
  lines.push(`Completion Rate Trend (%),${escapeCsvValue(summary.completionRateTrend)}`);
  lines.push(`Avg Response Time Trend (%),${escapeCsvValue(summary.avgResponseTimeTrend)}`);
  lines.push(`Total Costs Trend (%),${escapeCsvValue(summary.totalCostsTrend)}`);
  lines.push('');

  lines.push('Work Order Trends');
  lines.push('Week,Completed,Pending,Overdue');
  workOrderTrends.forEach((row) => {
    lines.push([
      escapeCsvValue(row.week),
      escapeCsvValue(row.completed),
      escapeCsvValue(row.pending),
      escapeCsvValue(row.overdue)
    ].join(','));
  });
  lines.push('');

  lines.push('Cost Breakdown');
  lines.push('Type,Cost');
  costBreakdown.forEach((row) => {
    lines.push([
      escapeCsvValue(row.name),
      escapeCsvValue(row.value)
    ].join(','));
  });
  lines.push('');

  lines.push('Asset Performance');
  lines.push('Metric,Value');
  lines.push(`Active Assets,${escapeCsvValue(assetPerformance.activeAssets)}`);
  lines.push(`Assets Trend (%),${escapeCsvValue(assetPerformance.assetsTrend)}`);
  lines.push(`Uptime (%),${escapeCsvValue(assetPerformance.uptime)}`);
  lines.push(`Uptime Trend (%),${escapeCsvValue(assetPerformance.uptimeTrend)}`);
  lines.push(`Critical Issues,${escapeCsvValue(assetPerformance.criticalIssues)}`);
  lines.push(`Critical Trend (%),${escapeCsvValue(assetPerformance.criticalTrend)}`);
  lines.push(`Repair Costs,${escapeCsvValue(assetPerformance.repairCosts)}`);
  lines.push(`Repair Trend (%),${escapeCsvValue(assetPerformance.repairTrend)}`);
  lines.push('');

  lines.push('Schedule Overview');
  lines.push('Day,Scheduled');
  scheduleOverview.forEach((row) => {
    lines.push([
      escapeCsvValue(row.day),
      escapeCsvValue(row.scheduled)
    ].join(','));
  });

  return lines.join('\n');
};

const buildAnalyticsPdf = (analytics, rangeDays) => {
  const { summary, workOrderTrends, costBreakdown, assetPerformance, scheduleOverview } = analytics;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text('Reports & Analytics');
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('gray').text(`Generated: ${new Date().toISOString()}`);
    doc.text(`Range: Last ${rangeDays} days`);
    doc.moveDown(0.6);

    doc.fillColor('black').fontSize(14).text('Summary');
    doc.moveDown(0.2);
    doc.fontSize(10);
    doc.text(`Total Work Orders: ${summary.totalWorkOrders}`);
    doc.text(`Completion Rate: ${summary.completionRate}%`);
    doc.text(`Avg Response Time (hrs): ${summary.avgResponseTime}`);
    doc.text(`Total Costs: ${summary.totalCosts}`);
    doc.text(`Total Work Orders Trend (%): ${summary.totalWorkOrdersTrend}`);
    doc.text(`Completion Rate Trend (%): ${summary.completionRateTrend}`);
    doc.text(`Avg Response Time Trend (%): ${summary.avgResponseTimeTrend}`);
    doc.text(`Total Costs Trend (%): ${summary.totalCostsTrend}`);
    doc.moveDown(0.6);

    doc.fontSize(14).text('Work Order Trends');
    doc.moveDown(0.2);
    doc.fontSize(10);
    workOrderTrends.forEach((row) => {
      doc.text(`${row.week}: completed ${row.completed}, pending ${row.pending}, overdue ${row.overdue}`);
    });
    doc.moveDown(0.6);

    doc.fontSize(14).text('Cost Breakdown');
    doc.moveDown(0.2);
    doc.fontSize(10);
    costBreakdown.forEach((row) => {
      doc.text(`${row.name}: ${row.value}`);
    });
    doc.moveDown(0.6);

    doc.fontSize(14).text('Asset Performance');
    doc.moveDown(0.2);
    doc.fontSize(10);
    doc.text(`Active Assets: ${assetPerformance.activeAssets}`);
    doc.text(`Assets Trend (%): ${assetPerformance.assetsTrend}`);
    doc.text(`Uptime (%): ${assetPerformance.uptime}`);
    doc.text(`Uptime Trend (%): ${assetPerformance.uptimeTrend}`);
    doc.text(`Critical Issues: ${assetPerformance.criticalIssues}`);
    doc.text(`Critical Trend (%): ${assetPerformance.criticalTrend}`);
    doc.text(`Repair Costs: ${assetPerformance.repairCosts}`);
    doc.text(`Repair Trend (%): ${assetPerformance.repairTrend}`);
    doc.moveDown(0.6);

    doc.fontSize(14).text('Schedule Overview');
    doc.moveDown(0.2);
    doc.fontSize(10);
    scheduleOverview.forEach((row) => {
      doc.text(`${row.day}: ${row.scheduled}`);
    });

    doc.end();
  });
};

const getReportAnalytics = async (req, res, next) => {
  try {
    const { range = 30 } = req.query;
    const parsedRange = Math.max(parseInt(range, 10) || 30, 1);
    const result = await reportAnalyticsService.getAnalytics(req.user.organization, parsedRange);
    response.success(res, 'Report analytics retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

const exportReport = async (req, res, next) => {
  try {
    const { range = 30, format = 'csv' } = req.body || {};
    const parsedRange = Math.max(parseInt(range, 10) || 30, 1);
    const normalizedFormat = String(format).toLowerCase();
    const analytics = await reportAnalyticsService.getAnalytics(req.user.organization, parsedRange);

    if (normalizedFormat === 'json') {
      return response.success(res, 'Report export generated successfully', analytics);
    }

    if (normalizedFormat === 'pdf') {
      const pdfBuffer = await buildAnalyticsPdf(analytics, parsedRange);
      const filename = `report_${parsedRange}_days_${Date.now()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(pdfBuffer);
    }

    if (normalizedFormat !== 'csv') {
      return response.badRequest(res, 'Only csv, pdf, or json export formats are supported right now.');
    }

    const csv = buildAnalyticsCsv(analytics, parsedRange);
    const filename = `report_${parsedRange}_days_${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
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
  getReportWarnings,
  exportReport,
  getReportAnalytics
};
