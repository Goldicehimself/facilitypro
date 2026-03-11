// Leave Validation Schemas
const Joi = require('joi');

const createLeaveSchema = Joi.object({
  type: Joi.string().valid('Annual', 'Sick', 'Emergency', 'Other').required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  reason: Joi.string().required().min(3).max(500)
});

const decisionSchema = Joi.object({
  note: Joi.string().optional().max(500)
});

const listLeaveQuerySchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected').optional(),
  type: Joi.string().valid('Annual', 'Sick', 'Emergency', 'Other').optional(),
  staff: Joi.string().hex().length(24).optional(),
  from: Joi.date().optional(),
  to: Joi.date().optional()
});

module.exports = {
  createLeaveSchema,
  decisionSchema,
  listLeaveQuerySchema
};
