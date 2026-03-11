// Authentication middleware using JWT
const jwt = require('jsonwebtoken');
const { AuthenticationError, AuthorizationError } = require('../utils/errorHandler');
const constants = require('../constants/constants');
const Organization = require('../models/Organization');
const { apiKeyAuth, getApiKeyFromRequest } = require('./apiKeyAuth');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.split(' ')[1]
      : (req.query?.token || null);
    
    if (!token) {
      const apiKey = getApiKeyFromRequest(req);
      if (apiKey) {
        return apiKeyAuth(req, res, next);
      }
      throw new AuthenticationError('No token provided');
    }

    const decoded = jwt.verify(token, constants.JWT_SECRET);
    if (decoded?.organization) {
      const org = await Organization.findById(decoded.organization).select('status');
      if (!org || org.status !== 'active') {
        throw new AuthenticationError('Organization is disabled');
      }
    }
    req.user = decoded;
    next();
  } catch (error) {
    next(new AuthenticationError('Invalid or expired token'));
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('User not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError('Insufficient permissions'));
    }

    next();
  };
};

const requireScope = (...requiredScopes) => {
  return (req, res, next) => {
    if (req.user?.authType !== 'api_key') {
      return next();
    }

    const scopes = req.apiKey?.scopes || [];
    const missing = requiredScopes.filter((scope) => !scopes.includes(scope));
    if (missing.length) {
      return next(new AuthorizationError('API key scope not allowed'));
    }
    return next();
  };
};

module.exports = {
  protect,
  authorize,
  requireScope
};
