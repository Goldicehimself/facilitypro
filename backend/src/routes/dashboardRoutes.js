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
    const monthsCount = 6;
    const start = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

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
      maintenanceTypeBuckets,
      costBuckets
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
      ]),
      WorkOrder.aggregate([
        {
          $match: {
            ...orgFilter,
            createdAt: { $gte: start, $lt: end }
          }
        },
        {
          $project: {
            maintenanceType: 1,
            createdAt: 1,
            partsCost: {
              $sum: {
                $map: {
                  input: { $ifNull: ['$replacedParts', []] },
                  as: 'part',
                  in: {
                    $multiply: [
                      { $ifNull: ['$$part.quantity', 1] },
                      { $ifNull: ['$$part.originalCost', { $ifNull: ['$$part.cost', 0] }] }
                    ]
                  }
                }
              }
            },
            extraCost: {
              $sum: {
                $map: {
                  input: { $ifNull: ['$extraCosts', []] },
                  as: 'cost',
                  in: { $ifNull: ['$$cost.amount', 0] }
                }
              }
            },
            actualCost: { $ifNull: ['$actualCost', 0] },
            estimatedCost: { $ifNull: ['$estimatedCost', 0] }
          }
        },
        {
          $addFields: {
            cost: {
              $cond: [
                { $gt: ['$actualCost', 0] },
                '$actualCost',
                {
                  $cond: [
                    { $gt: ['$estimatedCost', 0] },
                    '$estimatedCost',
                    { $add: ['$partsCost', '$extraCost'] }
                  ]
                }
              ]
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              type: '$maintenanceType'
            },
            total: { $sum: '$cost' }
          }
        }
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

    const monthBuckets = Array.from({ length: monthsCount }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return {
        key,
        month: date.toLocaleString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        preventive: 0,
        corrective: 0,
        emergency: 0,
        total: 0
      };
    });

    const bucketMap = new Map(monthBuckets.map((item) => [item.key, item]));
    costBuckets.forEach((bucket) => {
      const key = `${bucket._id.year}-${String(bucket._id.month).padStart(2, '0')}`;
      const target = bucketMap.get(key);
      if (!target) return;
      const type = String(bucket._id.type || '').toLowerCase();
      if (type === constants.MAINTENANCE_TYPE.PREVENTIVE) {
        target.preventive += bucket.total;
      } else if (type === constants.MAINTENANCE_TYPE.CORRECTIVE) {
        target.corrective += bucket.total;
      } else if (type === constants.MAINTENANCE_TYPE.EMERGENCY) {
        target.emergency += bucket.total;
      }
      target.total += bucket.total;
    });

    const costAnalysis = monthBuckets.map((item) => ({
      month: item.month,
      preventive: Math.round(item.preventive || 0),
      corrective: Math.round(item.corrective || 0),
      emergency: Math.round(item.emergency || 0),
      total: Math.round(item.total || 0)
    }));

    response.success(res, 'Dashboard loaded', {
      openWorkOrders,
      overdueWorkOrders,
      pmCompliance,
      pendingRequests,
      activeAssets,
      vendorPerformance: 0,
      complianceTrend: null,
      costAnalysis,
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
