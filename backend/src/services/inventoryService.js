// Inventory Service
const InventoryItem = require('../models/InventoryItem');
const { NotFoundError } = require('../utils/errorHandler');

const getInventoryItems = async (organizationId, filters = {}, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const scopedFilters = { ...filters, organization: organizationId };

  if (filters.search) {
    const regex = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    scopedFilters.$or = [{ item: regex }, { partNumber: regex }];
    delete scopedFilters.search;
  }

  const query = InventoryItem.find(scopedFilters)
    .skip(skip)
    .limit(limit)
    .sort({ updatedAt: -1 });

  const [items, total] = await Promise.all([
    query.exec(),
    InventoryItem.countDocuments(scopedFilters)
  ]);

  const summaryAggregation = await InventoryItem.aggregate([
    { $match: scopedFilters },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const summary = summaryAggregation.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

  return {
    items,
    summary,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getInventorySummary = async (organizationId) => {
  const summaryAggregation = await InventoryItem.aggregate([
    { $match: { organization: organizationId } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const summary = summaryAggregation.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});
  const total = await InventoryItem.countDocuments({ organization: organizationId });
  return { summary, total };
};

const getInventoryItemById = async (organizationId, id) => {
  const item = await InventoryItem.findOne({ _id: id, organization: organizationId });
  if (!item) {
    throw new NotFoundError('InventoryItem');
  }
  return item;
};

const createInventoryItem = async (organizationId, userId, itemData) => {
  itemData.organization = organizationId;
  itemData.createdBy = userId;
  const item = new InventoryItem(itemData);
  await item.save();
  return item;
};

const updateInventoryItem = async (organizationId, id, updateData) => {
  updateData.updatedAt = new Date();
  const item = await InventoryItem.findOneAndUpdate(
    { _id: id, organization: organizationId },
    updateData,
    { new: true, runValidators: true }
  );
  if (!item) {
    throw new NotFoundError('InventoryItem');
  }
  return item;
};

const deleteInventoryItem = async (organizationId, id) => {
  const item = await InventoryItem.findOneAndDelete({ _id: id, organization: organizationId });
  if (!item) {
    throw new NotFoundError('InventoryItem');
  }
  return item;
};

module.exports = {
  getInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventorySummary
};
