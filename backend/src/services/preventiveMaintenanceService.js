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

module.exports = {
  getPreventiveMaintenances,
  getPreventiveMaintenanceById,
  createPreventiveMaintenance,
  updatePreventiveMaintenance,
  deletePreventiveMaintenance,
  getUpcomingMaintenance,
  markAsPerformed,
  getDueMaintenances,
  markDueNotified
};
