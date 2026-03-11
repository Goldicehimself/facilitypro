// Report Validation Schemas
const Joi = require('joi');

const createReportSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  type: Joi.string().required().valid('asset', 'maintenance', 'work-order', 'financial', 'custom'),
  description: Joi.string().optional().max(500),
  filters: Joi.object().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  format: Joi.string().optional().valid('pdf', 'excel', 'json', 'csv')
});

const generateReportSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  type: Joi.string().required().valid('asset', 'maintenance', 'work-order', 'financial', 'custom'),
  description: Joi.string().optional().max(500),
  filters: Joi.object().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  format: Joi.string().optional().valid('pdf', 'excel', 'json', 'csv')
});

const updateReportSchema = Joi.object({
  name: Joi.string().optional().min(3).max(100),
  description: Joi.string().optional().max(500),
  filters: Joi.object().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  format: Joi.string().optional().valid('pdf', 'excel', 'json', 'csv')
}).min(1);

module.exports = {
  createReportSchema,
  generateReportSchema,
  updateReportSchema
};
