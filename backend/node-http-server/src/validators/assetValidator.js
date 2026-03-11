// Asset Validation Schemas
const Joi = require('joi');

const createAssetSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  assetNumber: Joi.string().optional(),
  description: Joi.string().optional().max(500),
  category: Joi.string().optional(),
  location: Joi.string().optional(),
  serialNumber: Joi.string().optional(),
  manufacturer: Joi.string().optional(),
  modelNumber: Joi.string().optional(),
  purchaseDate: Joi.date().optional(),
  purchasePrice: Joi.number().optional().min(0),
  status: Joi.string().optional().valid('active', 'inactive', 'maintenance', 'retired'),
  condition: Joi.string().optional().valid('excellent', 'good', 'fair', 'poor'),
  images: Joi.array().items(Joi.string()).optional(),
  qrCode: Joi.string().optional(),
  owner: Joi.string().optional(),
  department: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  customFields: Joi.object().optional()
});

const updateAssetSchema = Joi.object({
  name: Joi.string().optional().min(3).max(100),
  description: Joi.string().optional().max(500),
  category: Joi.string().optional(),
  location: Joi.string().optional(),
  status: Joi.string().optional().valid('active', 'inactive', 'maintenance', 'retired'),
  condition: Joi.string().optional().valid('excellent', 'good', 'fair', 'poor'),
  images: Joi.array().items(Joi.string()).optional(),
  purchasePrice: Joi.number().optional().min(0),
  nextMaintenanceDate: Joi.date().optional(),
  tags: Joi.array().items(Joi.string()).optional()
}).min(1);

module.exports = {
  createAssetSchema,
  updateAssetSchema,
  bulkAssetStatusSchema: Joi.object({
    ids: Joi.array().items(Joi.string()).min(1).required(),
    status: Joi.string().required().valid('active', 'inactive', 'maintenance', 'retired')
  })
};
