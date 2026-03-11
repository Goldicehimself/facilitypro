// Request validation middleware
const { ValidationError } = require('../utils/errorHandler');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const messages = error.details.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return next(new ValidationError(`Validation failed: ${messages.map(m => m.field + ' - ' + m.message).join(', ')}`));
    }

    req.validatedData = value;
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const messages = error.details.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return next(new ValidationError(`Query validation failed: ${messages.map(m => m.field + ' - ' + m.message).join(', ')}`));
    }

    req.validatedQuery = value;
    next();
  };
};

module.exports = {
  validateRequest,
  validateQuery
};
