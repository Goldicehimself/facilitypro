// Vendor Document Validation Schemas
const Joi = require('joi');

const createVendorDocumentSchema = Joi.object({
  name: Joi.string().required().min(2).max(200),
  type: Joi.string().optional().allow(''),
  url: Joi.string().uri().required(),
  size: Joi.string().optional().allow('')
});

const vendorDocumentListQuerySchema = Joi.object({
  page: Joi.number().optional().min(1),
  limit: Joi.number().optional().min(1).max(200),
  type: Joi.string().optional().allow(''),
  search: Joi.string().optional().allow('')
});

const updateVendorDocumentSchema = Joi.object({
  name: Joi.string().optional().min(2).max(200),
  type: Joi.string().optional().allow(''),
  url: Joi.string().uri().optional(),
  size: Joi.string().optional().allow('')
}).min(1);

module.exports = {
  createVendorDocumentSchema,
  vendorDocumentListQuerySchema,
  updateVendorDocumentSchema
};
