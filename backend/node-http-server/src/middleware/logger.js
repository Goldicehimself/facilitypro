// Request logging middleware
const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, `[${res.statusCode}] ${duration}ms`);
  });

  next();
};

module.exports = {
  requestLogger
};
