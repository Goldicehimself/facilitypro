// Inventory Controller
const inventoryService = require('../services/inventoryService');
const response = require('../utils/response');
const activityService = require('../services/activityService');

const getInventoryItems = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, category, location } = req.query;
    const filters = {};
    if (search) filters.search = search;
    if (status) filters.status = status;
    if (category) filters.category = category;
    if (location) filters.location = location;
    const result = await inventoryService.getInventoryItems(
      req.user.organization,
      filters,
      parseInt(page),
      parseInt(limit)
    );
    response.success(res, 'Inventory items retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

const getInventorySummary = async (req, res, next) => {
  try {
    const result = await inventoryService.getInventorySummary(req.user.organization);
    response.success(res, 'Inventory summary retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

const getInventoryItemById = async (req, res, next) => {
  try {
    const item = await inventoryService.getInventoryItemById(req.user.organization, req.params.id);
    response.success(res, 'Inventory item retrieved successfully', item);
  } catch (error) {
    next(error);
  }
};

const createInventoryItem = async (req, res, next) => {
  try {
    const item = await inventoryService.createInventoryItem(req.user.organization, req.user.id, req.body);
    activityService.broadcast({
      type: 'inventory_created',
      message: `${item.item} created`,
      entityType: 'InventoryItem',
      entityId: item._id,
      link: `/inventory`,
      createdAt: new Date().toISOString(),
      organization: req.user.organization,
      user: req.user.email
    });
    response.created(res, 'Inventory item created successfully', item);
  } catch (error) {
    next(error);
  }
};

const updateInventoryItem = async (req, res, next) => {
  try {
    const item = await inventoryService.updateInventoryItem(req.user.organization, req.params.id, req.body);
    activityService.broadcast({
      type: 'inventory_updated',
      message: `${item.item} updated`,
      entityType: 'InventoryItem',
      entityId: item._id,
      link: `/inventory`,
      createdAt: new Date().toISOString(),
      organization: req.user.organization,
      user: req.user.email
    });
    response.success(res, 'Inventory item updated successfully', item);
  } catch (error) {
    next(error);
  }
};

const deleteInventoryItem = async (req, res, next) => {
  try {
    await inventoryService.deleteInventoryItem(req.user.organization, req.params.id);
    activityService.broadcast({
      type: 'inventory_deleted',
      message: 'Inventory item deleted',
      entityType: 'InventoryItem',
      entityId: req.params.id,
      link: `/inventory`,
      createdAt: new Date().toISOString(),
      organization: req.user.organization,
      user: req.user.email
    });
    response.success(res, 'Inventory item deleted successfully', null);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventorySummary
};
