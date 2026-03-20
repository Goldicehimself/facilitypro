// Preventive Maintenance Service
const PreventiveMaintenance = require('../models/PreventiveMaintenance');
const { NotFoundError } = require('../utils/errorHandler');

const getPreventiveMaintenances = async (organizationId, filters = {}, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const scopedFilters = { ...filters, organization: organizationId };
  
  const query = PreventiveMaintenance.find(scopedFilters)
    .populate('asset assignedTo')
    .skip(skip)
    .limit(limit)
    .sort({ nextDueDate: 1 });

  const [maintenances, total] = await Promise.all([
    query.exec(),
    PreventiveMaintenance.countDocuments(scopedFilters)
  ]);

  return {
    maintenances,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getPreventiveMaintenanceById = async (organizationId, id) => {
  const maintenance = await PreventiveMaintenance.findOne({ _id: id, organization: organizationId })
    .populate('asset assignedTo');
  if (!maintenance) {
    throw new NotFoundError('PreventiveMaintenance');
  }
  return maintenance;
};

const createPreventiveMaintenance = async (organizationId, maintenanceData) => {
  maintenanceData.organization = organizationId;
  const maintenance = new PreventiveMaintenance(maintenanceData);
  await maintenance.save();
  await maintenance.populate('asset assignedTo');
  return maintenance;
};

const updatePreventiveMaintenance = async (organizationId, id, updateData) => {
  updateData.updatedAt = new Date();
  const maintenance = await PreventiveMaintenance.findOneAndUpdate({ _id: id, organization: organizationId }, updateData, {
    new: true,
    runValidators: true
  }).populate('asset assignedTo');
  
  if (!maintenance) {
    throw new NotFoundError('PreventiveMaintenance');
  }
  return maintenance;
};

const deletePreventiveMaintenance = async (organizationId, id) => {
  const maintenance = await PreventiveMaintenance.findOneAndDelete({ _id: id, organization: organizationId });
  if (!maintenance) {
    throw new NotFoundError('PreventiveMaintenance');
  }
  return maintenance;
};

const getUpcomingMaintenance = async (organizationId, days = 30) => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const maintenances = await PreventiveMaintenance.find({
    organization: organizationId,
    active: true,
    nextDueDate: { $gte: now, $lte: futureDate }
  })
    .populate('asset assignedTo')
    .sort({ nextDueDate: 1 });

  return maintenances;
};

const markAsPerformed = async (organizationId, id, notes = '') => {
  const maintenance = await PreventiveMaintenance.findOne({ _id: id, organization: organizationId });
  if (!maintenance) {
    throw new NotFoundError('PreventiveMaintenance');
  }

  maintenance.lastPerformed = new Date();
  
  // Calculate next due date based on frequency
  const frequencyDays = {
    'weekly': 7,
    'bi-weekly': 14,
    'monthly': 30,
    'quarterly': 91,
    'semi-annual': 183,
    'annual': 365
  };

  const daysToAdd = frequencyDays[maintenance.frequency] || 30;
  maintenance.nextDueDate = new Date(maintenance.lastPerformed.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  
  await maintenance.save();
  await maintenance.populate('asset assignedTo');
  return maintenance;
};

const getDueMaintenances = async () => {
  const now = new Date();
  return PreventiveMaintenance.find({
    active: true,
    nextDueDate: { $lte: now },
    $or: [{ dueNotifiedAt: null }, { dueNotifiedAt: { $exists: false } }]
  }).populate('asset assignedTo');
};

const markDueNotified = async (maintenanceIds = []) => {
  if (!maintenanceIds.length) return;
  await PreventiveMaintenance.updateMany(
    { _id: { $in: maintenanceIds } },
    { $set: { dueNotifiedAt: new Date() } }
  );
};

const getComplianceMetrics = async (organizationId, options = {}) => {
  const target = Number(options.target) || 90;
  const monthsCount = Number(options.months) || 6;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const tasks = await PreventiveMaintenance.find({
    organization: organizationId,
    active: true,
    nextDueDate: { $gte: start, $lt: end }
  })
    .populate('asset', 'name')
    .select('name asset nextDueDate lastPerformed priority');

  const monthBuckets = Array.from({ length: monthsCount }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleString('en-US', { month: 'short' }),
      year: date.getFullYear(),
      monthIndex: date.getMonth(),
      total: 0,
      completed: 0
    };
  });

  const bucketByKey = new Map(monthBuckets.map((bucket) => [bucket.key, bucket]));

  tasks.forEach((task) => {
    if (task.nextDueDate) {
      const due = new Date(task.nextDueDate);
      const key = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}`;
      const bucket = bucketByKey.get(key);
      if (bucket) bucket.total += 1;
    }
    if (task.lastPerformed) {
      const performed = new Date(task.lastPerformed);
      const key = `${performed.getFullYear()}-${String(performed.getMonth() + 1).padStart(2, '0')}`;
      const bucket = bucketByKey.get(key);
      if (bucket) bucket.completed += 1;
    }
  });

  const trend = monthBuckets.map((bucket) => {
    const pending = Math.max(0, bucket.total - bucket.completed);
    const compliance = bucket.total
      ? Math.round((bucket.completed / bucket.total) * 100)
      : 0;
    return {
      month: bucket.label,
      compliance,
      target,
      completed: bucket.completed,
      pending
    };
  });

  const equipmentMap = new Map();
  tasks.forEach((task) => {
    const assetId = task.asset?._id ? String(task.asset._id) : 'unknown';
    const entry = equipmentMap.get(assetId) || {
      assetId,
      name: task.asset?.name || 'Unknown Asset',
      total: 0,
      completed: 0
    };
    entry.total += 1;
    if (task.lastPerformed) {
      entry.completed += 1;
    }
    equipmentMap.set(assetId, entry);
  });

  const equipment = Array.from(equipmentMap.values())
    .map((item) => ({
      ...item,
      compliance: item.total ? Math.round((item.completed / item.total) * 100) : 0
    }))
    .sort((a, b) => a.compliance - b.compliance)
    .slice(0, 6);

  const overdueTasks = await PreventiveMaintenance.find({
    organization: organizationId,
    active: true,
    nextDueDate: { $lt: now }
  })
    .populate('asset', 'name')
    .select('name asset nextDueDate priority')
    .sort({ nextDueDate: 1 })
    .limit(5);

  const overdue = overdueTasks.map((task) => {
    const dueDate = task.nextDueDate ? new Date(task.nextDueDate) : null;
    const daysOverdue = dueDate
      ? Math.max(0, Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24)))
      : 0;
    return {
      id: task._id,
      name: task.name,
      assetName: task.asset?.name || 'Unknown Asset',
      nextDueDate: task.nextDueDate,
      priority: task.priority || 'medium',
      daysOverdue
    };
  });

  return {
    trend,
    equipment,
    overdue
  };
};

module.exports = {
  getPreventiveMaintenances,
  getPreventiveMaintenanceById,
  createPreventiveMaintenance,
  updatePreventiveMaintenance,
  deletePreventiveMaintenance,
  getUpcomingMaintenance,
  markAsPerformed,
  getDueMaintenances,
  markDueNotified,
  getComplianceMetrics
};
