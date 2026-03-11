// Fund Request Validation Schemas
const Joi = require('joi');

const createFundSchema = Joi.object({
  amount: Joi.number().positive().required(),
  purpose: Joi.string().required().min(3).max(200),
  notes: Joi.string().optional().max(500)
});

const decisionSchema = Joi.object({
  note: Joi.string().optional().max(500)
});

const listFundsQuerySchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected').optional(),
  from: Joi.date().optional(),
  to: Joi.date().optional()
});

module.exports = {
  createFundSchema,
  decisionSchema,
  listFundsQuerySchema
};
