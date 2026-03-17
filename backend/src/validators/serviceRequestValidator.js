// Service Request Validation Schemas
const Joi = require('joi');
const constants = require('../constants/constants');

const createServiceRequestSchema = Joi.object({
  title: Joi.string().required().min(3).max(120),
  description: Joi.string().required().min(5).max(1000),
  category: Joi.string().required().min(2).max(100),
  location: Joi.string().optional().allow(''),
  priority: Joi.string().optional().valid(...Object.values(constants.PRIORITY)),
  asset: Joi.string().optional().allow(null),
  assignee: Joi.string().optional().allow(null)
});

const updateServiceRequestSchema = Joi.object({
  title: Joi.string().optional().min(3).max(120),
  description: Joi.string().optional().min(5).max(1000),
  category: Joi.string().optional().min(2).max(100),
  location: Joi.string().optional().allow(''),
  priority: Joi.string().optional().valid(...Object.values(constants.PRIORITY)),
  status: Joi.string().optional().valid('pending', 'assigned', 'in-progress', 'completed'),
  asset: Joi.string().optional().allow(null),
  assignee: Joi.string().optional().allow(null),
  assignmentNote: Joi.string().optional().allow('').max(500)
}).min(1);

const serviceRequestListQuerySchema = Joi.object({
  page: Joi.number().optional().min(1),
  limit: Joi.number().optional().min(1).max(200),
  search: Joi.string().optional().allow(''),
  status: Joi.string().optional().valid('pending', 'assigned', 'in-progress', 'completed'),
  priority: Joi.string().optional().valid(...Object.values(constants.PRIORITY)),
  category: Joi.string().optional().allow(''),
  location: Joi.string().optional().allow('')
});

const assignServiceRequestSchema = Joi.object({
  assigneeId: Joi.string().required(),
  note: Joi.string().optional().allow('').max(500)
});

const updateServiceRequestStatusSchema = Joi.object({
  status: Joi.string().required().valid('pending', 'assigned', 'in-progress', 'completed'),
  startedAt: Joi.date().iso().optional(),
  completedAt: Joi.date().iso().optional()
});

module.exports = {
  createServiceRequestSchema,
  updateServiceRequestSchema,
  serviceRequestListQuerySchema,
  assignServiceRequestSchema,
  updateServiceRequestStatusSchema
};
