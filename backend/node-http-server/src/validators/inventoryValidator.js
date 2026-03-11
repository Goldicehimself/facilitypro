// Inventory Validation Schemas
const Joi = require('joi');

const createInventoryItemSchema = Joi.object({
  item: Joi.string().required().min(2).max(120),
  partNumber: Joi.string().optional().allow(''),
  category: Joi.string().optional().allow(''),
  location: Joi.string().optional().allow(''),
  currentStock: Joi.number().optional().min(0),
  reorderPoint: Joi.number().optional().min(0),
  unitCost: Joi.number().optional().min(0),
  usage30d: Joi.number().optional().min(0),
  status: Joi.string().optional().valid('in-stock', 'low-stock', 'out-of-stock'),
  notes: Joi.string().optional().max(500)
});

const updateInventoryItemSchema = Joi.object({
  item: Joi.string().optional().min(2).max(120),
  partNumber: Joi.string().optional().allow(''),
  category: Joi.string().optional().allow(''),
  location: Joi.string().optional().allow(''),
  currentStock: Joi.number().optional().min(0),
  reorderPoint: Joi.number().optional().min(0),
  unitCost: Joi.number().optional().min(0),
  usage30d: Joi.number().optional().min(0),
  status: Joi.string().optional().valid('in-stock', 'low-stock', 'out-of-stock'),
  notes: Joi.string().optional().max(500)
}).min(1);

const inventoryListQuerySchema = Joi.object({
  page: Joi.number().optional().min(1),
  limit: Joi.number().optional().min(1).max(200),
  search: Joi.string().optional().allow(''),
  status: Joi.string().optional().valid('in-stock', 'low-stock', 'out-of-stock'),
  category: Joi.string().optional().allow(''),
  location: Joi.string().optional().allow('')
});

module.exports = {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  inventoryListQuerySchema
};
