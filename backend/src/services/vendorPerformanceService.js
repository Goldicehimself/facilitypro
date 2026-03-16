// Vendor Performance Service
const WorkOrder = require('../models/WorkOrder');
const Vendor = require('../models/Vendor');
const { NotFoundError } = require('../utils/errorHandler');

const ensureVendorInOrg = async (organizationId, vendorId) => {
  const vendor = await Vendor.findOne({ _id: vendorId, organization: organizationId }).select('_id rating');
  if (!vendor) {
    throw new NotFoundError('Vendor');
  }
  return vendor;
};

const buildMonthRange = (offset = 0) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const calcOnTimeCompletion = (orders = []) => {
  if (!orders.length) return null;
  const completed = orders.filter((wo) => wo.completionDate && wo.dueDate);
  if (!completed.length) return null;
  const onTime = completed.filter((wo) => wo.completionDate <= wo.dueDate);
  return Math.round((onTime.length / completed.length) * 100);
};

const calcCompletionTimes = (orders = []) => {
  const completed = orders.filter((wo) => wo.completionDate);
  if (!completed.length) return { averageHours: null, fastestMinutes: null };

  const durations = completed
    .map((wo) => {
      const start = wo.startDate || wo.createdAt;
      const end = wo.completionDate;
      if (!start || !end) return null;
      const ms = new Date(end).getTime() - new Date(start).getTime();
      return ms > 0 ? ms : null;
    })
    .filter(Boolean);

  if (!durations.length) return { averageHours: null, fastestMinutes: null };

  const total = durations.reduce((sum, ms) => sum + ms, 0);
  const avgHours = total / durations.length / (1000 * 60 * 60);
  const fastest = Math.min(...durations) / (1000 * 60);

  return {
    averageHours: Math.round(avgHours * 10) / 10,
    fastestMinutes: Math.round(fastest)
  };
};

const getVendorPerformance = async (organizationId, vendorId) => {
  const vendor = await ensureVendorInOrg(organizationId, vendorId);

  const workOrders = await WorkOrder.find({
    organization: organizationId,
    vendor: vendorId
  }).select('status createdAt startDate dueDate completionDate');

  const totals = {
    total: workOrders.length,
    completed: workOrders.filter((wo) => wo.status === 'completed').length,
    open: workOrders.filter((wo) => wo.status !== 'completed').length
  };

  const currentRange = buildMonthRange(0);
  const previousRange = buildMonthRange(-1);

  const currentOrders = workOrders.filter((wo) => wo.completionDate && wo.completionDate >= currentRange.start && wo.completionDate <= currentRange.end);
  const previousOrders = workOrders.filter((wo) => wo.completionDate && wo.completionDate >= previousRange.start && wo.completionDate <= previousRange.end);

  const onTimeCompletion = {
    current: calcOnTimeCompletion(currentOrders),
    previous: calcOnTimeCompletion(previousOrders)
  };

  const completionTime = calcCompletionTimes(workOrders);

  return {
    vendorId: vendorId.toString(),
    rating: vendor?.rating ?? null,
    totals,
    onTimeCompletion,
    completionTime,
    updatedAt: new Date()
  };
};

module.exports = {
  getVendorPerformance
};
