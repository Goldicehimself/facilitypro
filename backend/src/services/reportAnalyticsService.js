const WorkOrder = require('../models/WorkOrder');
const Asset = require('../models/Asset');
const PreventiveMaintenance = require('../models/PreventiveMaintenance');
const constants = require('../constants/constants');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const normalizeRange = (rangeDays) => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - rangeDays + 1);
  start.setHours(0, 0, 0, 0);

  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - rangeDays + 1);
  prevStart.setHours(0, 0, 0, 0);

  return { start, end, prevStart, prevEnd };
};

const percentChange = (current, previous) => {
  if (!previous && !current) return 0;
  if (!previous) return 100;
  return ((current - previous) / previous) * 100;
};

const formatShortDate = (date) => {
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${month} ${date.getDate()}`;
};

const sumWorkOrderCost = (workOrder) => {
  const baseCost = Number.isFinite(workOrder.actualCost)
    ? workOrder.actualCost
    : Number.isFinite(workOrder.estimatedCost)
      ? workOrder.estimatedCost
      : 0;
  const extraCosts = Array.isArray(workOrder.extraCosts)
    ? workOrder.extraCosts.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    : 0;
  const partCosts = Array.isArray(workOrder.replacedParts)
    ? workOrder.replacedParts.reduce((sum, item) => sum + (Number(item.cost) || 0), 0)
    : 0;
  return baseCost + extraCosts + partCosts;
};

const getCompletedRangeQuery = (organizationId, start, end) => ({
  organization: organizationId,
  status: constants.WORK_ORDER_STATUS.COMPLETED,
  $or: [
    { completionDate: { $gte: start, $lte: end } },
    { completionDate: { $exists: false }, updatedAt: { $gte: start, $lte: end } }
  ]
});

const buildScheduleOverview = (rangeStart, rangeDays, maintenances) => {
  const buckets = Array.from({ length: rangeDays }, (_, index) => {
    const bucketDate = new Date(rangeStart);
    bucketDate.setDate(bucketDate.getDate() + index);
    return {
      day: formatShortDate(bucketDate),
      scheduled: 0,
      dateKey: bucketDate.toISOString().slice(0, 10)
    };
  });

  const bucketIndexByKey = new Map(
    buckets.map((bucket, index) => [bucket.dateKey, index])
  );

  maintenances.forEach((maintenance) => {
    const due = new Date(maintenance.nextDueDate);
    const key = due.toISOString().slice(0, 10);
    const index = bucketIndexByKey.get(key);
    if (index !== undefined) {
      buckets[index].scheduled += 1;
    }
  });

  return buckets.map(({ day, scheduled }) => ({ day, scheduled }));
};

const buildWorkOrderTrends = (rangeStart, rangeDays, workOrders, now) => {
  const bucketCount = Math.ceil(rangeDays / 7);
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = new Date(rangeStart);
    bucketStart.setDate(bucketStart.getDate() + index * 7);
    return {
      start: bucketStart,
      label: formatShortDate(bucketStart),
      completed: 0,
      pending: 0,
      overdue: 0
    };
  });

  workOrders.forEach((workOrder) => {
    const createdAt = new Date(workOrder.createdAt);
    const daysSinceStart = Math.floor((createdAt - rangeStart) / MS_PER_DAY);
    const bucketIndex = Math.min(
      buckets.length - 1,
      Math.max(0, Math.floor(daysSinceStart / 7))
    );
    const bucket = buckets[bucketIndex];
    if (!bucket) return;
    if (workOrder.status === constants.WORK_ORDER_STATUS.COMPLETED) {
      bucket.completed += 1;
      return;
    }
    const dueDate = workOrder.dueDate ? new Date(workOrder.dueDate) : null;
    if (dueDate && dueDate < now) {
      bucket.overdue += 1;
    } else {
      bucket.pending += 1;
    }
  });

  return buckets.map(({ label, completed, pending, overdue }) => ({
    week: label,
    completed,
    pending,
    overdue
  }));
};

const calculateAvgResponseHours = (workOrders) => {
  const durations = workOrders
    .map((order) => {
      const start = order.startDate ? new Date(order.startDate) : null;
      const completion = order.completionDate ? new Date(order.completionDate) : null;
      if (start) {
        return (start - new Date(order.createdAt)) / (1000 * 60 * 60);
      }
      if (completion) {
        return (completion - new Date(order.createdAt)) / (1000 * 60 * 60);
      }
      return null;
    })
    .filter((value) => Number.isFinite(value) && value >= 0);

  if (!durations.length) return 0;
  const total = durations.reduce((sum, value) => sum + value, 0);
  return total / durations.length;
};

const getSummaryMetrics = async (organizationId, start, end) => {
  const workOrders = await WorkOrder.find({
    organization: organizationId,
    createdAt: { $gte: start, $lte: end }
  })
    .select('status dueDate createdAt completionDate startDate priority maintenanceType actualCost estimatedCost extraCosts replacedParts')
    .lean();

  const completedOrders = await WorkOrder.find(getCompletedRangeQuery(organizationId, start, end))
    .select('maintenanceType actualCost estimatedCost extraCosts replacedParts')
    .lean();

  const totalWorkOrders = workOrders.length;
  const completedCount = completedOrders.length;
  const completionRate = totalWorkOrders
    ? Math.round((completedCount / totalWorkOrders) * 100)
    : 0;

  const avgResponseTime = calculateAvgResponseHours(workOrders);
  const totalCosts = completedOrders.reduce((sum, order) => sum + sumWorkOrderCost(order), 0);
  const criticalIssues = workOrders.filter((order) => {
    if ([constants.WORK_ORDER_STATUS.COMPLETED, constants.WORK_ORDER_STATUS.CANCELLED].includes(order.status)) {
      return false;
    }
    return [constants.PRIORITY.HIGH, constants.PRIORITY.URGENT].includes(order.priority);
  }).length;

  const costByType = completedOrders.reduce((acc, order) => {
    const key = order.maintenanceType || 'other';
    acc[key] = (acc[key] || 0) + sumWorkOrderCost(order);
    return acc;
  }, {});

  const costBreakdown = Object.entries(costByType).map(([name, value]) => ({
    name,
    value
  }));

  return {
    workOrders,
    totalWorkOrders,
    completionRate,
    avgResponseTime,
    totalCosts,
    criticalIssues,
    costBreakdown
  };
};

const getAnalytics = async (organizationId, rangeDays) => {
  const { start, end, prevStart, prevEnd } = normalizeRange(rangeDays);
  const now = new Date();

  const downStatuses = new Set([constants.ASSET_STATUS.INACTIVE, constants.ASSET_STATUS.RETIRED]);

  const calculateUptimePercent = async (periodStart, periodEnd) => {
    const assets = await Asset.find({
      organization: organizationId,
      createdAt: { $lte: periodEnd }
    })
      .select('status createdAt statusHistory')
      .lean();

    if (!assets.length) return 0;

    let totalAvailableMs = 0;
    let totalDownMs = 0;

    assets.forEach((asset) => {
      const createdAt = asset.createdAt ? new Date(asset.createdAt) : periodStart;
      const assetStart = createdAt > periodStart ? createdAt : periodStart;
      if (assetStart > periodEnd) return;

      const history = Array.isArray(asset.statusHistory) ? asset.statusHistory : [];
      const sortedHistory = history
        .map((entry) => ({
          status: entry.status,
          changedAt: entry.changedAt ? new Date(entry.changedAt) : null
        }))
        .filter((entry) => entry.status && entry.changedAt && entry.changedAt <= periodEnd)
        .sort((a, b) => a.changedAt - b.changedAt);

      let currentStatus = asset.status || constants.ASSET_STATUS.ACTIVE;
      for (let i = sortedHistory.length - 1; i >= 0; i -= 1) {
        if (sortedHistory[i].changedAt <= assetStart) {
          currentStatus = sortedHistory[i].status;
          break;
        }
      }

      let cursor = new Date(assetStart);
      sortedHistory.forEach((entry) => {
        if (entry.changedAt < assetStart) return;
        const segmentEnd = entry.changedAt > periodEnd ? periodEnd : entry.changedAt;
        if (segmentEnd > cursor) {
          const duration = segmentEnd - cursor;
          totalAvailableMs += duration;
          if (downStatuses.has(currentStatus)) {
            totalDownMs += duration;
          }
        }
        if (entry.changedAt <= periodEnd) {
          currentStatus = entry.status;
          cursor = new Date(entry.changedAt);
        }
      });

      if (cursor < periodEnd) {
        const duration = periodEnd - cursor;
        totalAvailableMs += duration;
        if (downStatuses.has(currentStatus)) {
          totalDownMs += duration;
        }
      }
    });

    if (!totalAvailableMs) return 0;
    return ((totalAvailableMs - totalDownMs) / totalAvailableMs) * 100;
  };

  const [
    currentMetrics,
    previousMetrics,
    activeAssetsNow,
    activeAssetsPrev,
    assetUptimeNow,
    assetUptimePrev,
    upcomingMaintenance
  ] = await Promise.all([
    getSummaryMetrics(organizationId, start, end),
    getSummaryMetrics(organizationId, prevStart, prevEnd),
    Asset.countDocuments({
      organization: organizationId,
      status: constants.ASSET_STATUS.ACTIVE,
      createdAt: { $lte: end }
    }),
    Asset.countDocuments({
      organization: organizationId,
      status: constants.ASSET_STATUS.ACTIVE,
      createdAt: { $lte: prevEnd }
    }),
    calculateUptimePercent(start, end),
    calculateUptimePercent(prevStart, prevEnd),
    PreventiveMaintenance.find({
      organization: organizationId,
      active: true,
      nextDueDate: { $gte: start, $lte: end }
    })
      .select('nextDueDate')
      .lean()
  ]);

  const summary = {
    totalWorkOrders: currentMetrics.totalWorkOrders,
    totalWorkOrdersTrend: percentChange(currentMetrics.totalWorkOrders, previousMetrics.totalWorkOrders),
    completionRate: currentMetrics.completionRate,
    completionRateTrend: percentChange(currentMetrics.completionRate, previousMetrics.completionRate),
    avgResponseTime: Number(currentMetrics.avgResponseTime.toFixed(1)),
    avgResponseTimeTrend: percentChange(currentMetrics.avgResponseTime, previousMetrics.avgResponseTime),
    totalCosts: Number(currentMetrics.totalCosts.toFixed(2)),
    totalCostsTrend: percentChange(currentMetrics.totalCosts, previousMetrics.totalCosts)
  };

  const workOrderTrends = buildWorkOrderTrends(start, rangeDays, currentMetrics.workOrders, now);

  const scheduleOverview = buildScheduleOverview(start, rangeDays, upcomingMaintenance);

  const assetPerformance = {
    activeAssets: activeAssetsNow,
    assetsTrend: percentChange(activeAssetsNow, activeAssetsPrev),
    uptime: Number(assetUptimeNow.toFixed(1)),
    uptimeTrend: percentChange(assetUptimeNow, assetUptimePrev),
    criticalIssues: currentMetrics.criticalIssues,
    criticalTrend: percentChange(currentMetrics.criticalIssues, previousMetrics.criticalIssues),
    repairCosts: Number(currentMetrics.totalCosts.toFixed(2)),
    repairTrend: percentChange(currentMetrics.totalCosts, previousMetrics.totalCosts)
  };

  return {
    summary,
    workOrderTrends,
    costBreakdown: currentMetrics.costBreakdown,
    assetPerformance,
    scheduleOverview
  };
};

module.exports = {
  getAnalytics
};
