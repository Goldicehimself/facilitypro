// Standard Response Format

const successResponse = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const errorResponse = (res, statusCode, message, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors })
  });
};

// Specific response helpers
module.exports = {
  success: (res, message, data) => successResponse(res, 200, message, data),
  created: (res, message, data) => successResponse(res, 201, message, data),
  accepted: (res, message, data) => successResponse(res, 202, message, data),
  
  badRequest: (res, message, errors) => errorResponse(res, 400, message, errors),
  unauthorized: (res, message = 'Unauthorized') => errorResponse(res, 401, message),
  forbidden: (res, message = 'Forbidden') => errorResponse(res, 403, message),
  notFound: (res, message = 'Not found') => errorResponse(res, 404, message),
  conflict: (res, message) => errorResponse(res, 409, message),
  
  serverError: (res, message = 'Internal server error') => errorResponse(res, 500, message),
  serviceUnavailable: (res, message = 'Service unavailable') => errorResponse(res, 503, message)
};
