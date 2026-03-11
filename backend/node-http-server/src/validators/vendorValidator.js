const Joi = require('joi');

const vendorImportSchema = Joi.object({
  vendors: Joi.array().items(
    Joi.object({
      name: Joi.string().trim().min(1).required(),
      email: Joi.string().email().required(),
      phone: Joi.string().allow('', null).optional(),
      category: Joi.string().allow('', null).optional(),
      address: Joi.string().allow('', null).optional(),
      city: Joi.string().allow('', null).optional(),
      state: Joi.string().allow('', null).optional(),
      zipCode: Joi.string().allow('', null).optional(),
      contactPerson: Joi.string().allow('', null).optional(),
      rating: Joi.number().min(0).max(5).optional(),
      notes: Joi.string().allow('', null).optional()
    }).unknown(true)
  ).min(1).required()
}).required();

module.exports = {
  vendorImportSchema
};
