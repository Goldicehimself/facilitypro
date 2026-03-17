const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const bulkAssignSchema = Joi.object({
  ids: Joi.array().items(objectId).min(1).optional().allow(null),
  assignee: Joi.alternatives()
    .try(
      objectId,
      Joi.object({
        id: objectId.optional(),
        _id: objectId.optional()
      }).unknown(true)
    )
    .optional()
    .allow(null),
  filters: Joi.object({
    status: Joi.string().optional(),
    priority: Joi.string().optional(),
    assignee: Joi.string().optional(),
    category: Joi.string().optional(),
    location: Joi.string().optional(),
    search: Joi.string().allow('').optional(),
    dateRange: Joi.string().optional()
  }).optional()
}).required();

module.exports = {
  bulkAssignSchema
};
