const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const constants = require('../constants/constants');
const response = require('../utils/response');
const WorkOrder = require('../models/WorkOrder');
const Asset = require('../models/Asset');
const PreventiveMaintenance = require('../models/PreventiveMaintenance');

const buildOrgFilter = (req) => {
  return req.user?.organization ? { organization: req.user.organization } : {};
};

const toTitle = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());

router.get('/', protect, async (req, res, next) => {
  try {
    const orgFilter = buildOrgFilter(req);
    const now = new Date();

    const openStatuses = [
      constants.WORK_ORDER_STATUS.OPEN,
      constants.WORK_ORDER_STATUS.ASSIGNED,
      constants.WORK_ORDER_STATUS.IN_PROGRESS,
      constants.WORK_ORDER_STATUS.ON_HOLD
    ];

    const [
      openWorkOrders,
      overdueWorkOrders,
      pendingRequests,
      activeAssets,
      pmTotal,
      pmOnTime,
      maintenanceTypeBuckets
    ] = await Promise.all([
      WorkOrder.countDocuments({ ...orgFilter, status: { $in: openStatuses } }),
      WorkOrder.countDocuments({
        ...orgFilter,
        dueDate: { $lt: now },
        status: { $nin: [constants.WORK_ORDER_STATUS.COMPLETED, constants.WORK_ORDER_STATUS.CANCELLED] }
      }),
      WorkOrder.countDocuments({ ...orgFilter, status: constants.WORK_ORDER_STATUS.OPEN }),
      Asset.countDocuments({ ...orgFilter, status: constants.ASSET_STATUS.ACTIVE }),
      PreventiveMaintenance.countDocuments({ ...orgFilter, active: true }),
      PreventiveMaintenance.countDocuments({ ...orgFilter, active: true, nextDueDate: { $gte: now } }),
      WorkOrder.aggregate([
        { $match: orgFilter },
        { $group: { _id: '$maintenanceType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ])
    ]);

    const pmCompliance = pmTotal > 0 ? Math.round((pmOnTime / pmTotal) * 100) : 0;

    const serviceCategories = maintenanceTypeBuckets.length
      ? maintenanceTypeBuckets.map((bucket) => ({
          name: toTitle(bucket._id || 'other'),
          count: bucket.count,
          trend: 'up'
        }))
      : [
          { name: 'Preventive', count: 0, trend: 'up' },
          { name: 'Corrective', count: 0, trend: 'up' },
          { name: 'Emergency', count: 0, trend: 'up' }
        ];

    response.success(res, 'Dashboard loaded', {
      openWorkOrders,
      overdueWorkOrders,
      pmCompliance,
      pendingRequests,
      activeAssets,
      vendorPerformance: 0,
      complianceTrend: null,
      costAnalysis: null,
      serviceCategories
    });
  } catch (error) {
    next(error);
  }
});

router.get('/activities', protect, async (req, res, next) => {
  try {
    const orgFilter = buildOrgFilter(req);
    const recent = await WorkOrder.find(orgFilter)
      .sort({ createdAt: -1 })
      .limit(8)
      .select('title status createdAt workOrderNumber assignedTo')
      .populate('assignedTo', 'name');

    const activities = recent.map((wo) => ({
      id: String(wo._id),
      type: wo.status === constants.WORK_ORDER_STATUS.COMPLETED ? 'completed' : 'work_order',
      title: wo.title,
      description: `${wo.workOrderNumber || 'WO'} — ${wo.assignedTo?.name || 'Unassigned'}`,
      timestamp: wo.createdAt
    }));

    response.success(res, 'Dashboard activities loaded', activities);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
