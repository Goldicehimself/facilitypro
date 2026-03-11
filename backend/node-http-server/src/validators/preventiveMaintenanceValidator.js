// Preventive Maintenance Validation Schemas
const Joi = require('joi');
const constants = require('../constants/constants');

const createPreventiveMaintenanceSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  asset: Joi.string().required(), // MongoDB ObjectId
  description: Joi.string().optional().max(500),
  frequency: Joi.string().required().valid('weekly', 'bi-weekly', 'monthly', 'quarterly', 'semi-annual', 'annual'),
  priority: Joi.string().optional().valid(...Object.values(constants.PRIORITY)),
  nextDueDate: Joi.date().required(),
  estimatedCost: Joi.number().optional().min(0),
  estimatedHours: Joi.number().optional().min(0),
  procedures: Joi.array().items(Joi.string()).optional(),
  assignedTo: Joi.string().optional(), // MongoDB ObjectId
  active: Joi.boolean().optional()
});

const updatePreventiveMaintenanceSchema = Joi.object({
  name: Joi.string().optional().min(3).max(100),
  description: Joi.string().optional().max(500),
  frequency: Joi.string().optional().valid('weekly', 'bi-weekly', 'monthly', 'quarterly', 'semi-annual', 'annual'),
  priority: Joi.string().optional().valid(...Object.values(constants.PRIORITY)),
  nextDueDate: Joi.date().optional(),
  estimatedCost: Joi.number().optional().min(0),
  estimatedHours: Joi.number().optional().min(0),
  procedures: Joi.array().items(Joi.string()).optional(),
  assignedTo: Joi.string().optional(),
  active: Joi.boolean().optional()
}).min(1);

const markPerformedSchema = Joi.object({
  notes: Joi.string().optional().max(500)
});

module.exports = {
  createPreventiveMaintenanceSchema,
  updatePreventiveMaintenanceSchema,
  markPerformedSchema
};
