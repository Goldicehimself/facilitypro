const crypto = require('crypto');
const Organization = require('../models/Organization');
const constants = require('../constants/constants');
const { AuthenticationError, RateLimitError } = require('../utils/errorHandler');
const { touchApiKeyLastUsed } = require('../services/orgService');
const { getRedisClient } = require('../utils/redisClient');
const logger = require('../utils/logger');

const apiKeyUsage = new Map();
let lastCleanup = Date.now();

const getApiKeyFromRequest = (req) => {
  const headerKey = req.headers['x-api-key'];
  if (headerKey) return headerKey;

  const authHeader = req.headers.authorization || '';
  if (authHeader.toLowerCase().startsWith('apikey ')) {
    return authHeader.slice(7).trim();
  }
  return null;
};

const cleanupApiKeyUsage = (windowMs) => {
  const now = Date.now();
  if (now - lastCleanup < 10 * 60 * 1000) return;
  lastCleanup = now;

  for (const [key, entry] of apiKeyUsage.entries()) {
    if (now - entry.windowStart > windowMs * 2) {
      apiKeyUsage.delete(key);
    }
  }
};

const enforceRateLimit = async (orgId, apiKey, rateLimit) => {
  const windowMs = rateLimit?.windowMs ?? constants.DEFAULT_API_KEY_RATE_LIMIT.windowMs;
  const max = rateLimit?.max ?? constants.DEFAULT_API_KEY_RATE_LIMIT.max;
  if (!windowMs || !max) return;

  const key = `${orgId}:${apiKey.id}`;
  const redisClient = getRedisClient();
  if (redisClient) {
    try {
      const count = await redisClient.incr(key);
      if (count === 1) {
        await redisClient.pexpire(key, windowMs);
      }
      if (count > max) {
        throw new RateLimitError('API key rate limit exceeded');
      }
      return;
    } catch (error) {
      logger.warn('[api key] redis rate limit failed, falling back to memory', error?.message || error);
    }
  }

  const now = Date.now();
  const entry = apiKeyUsage.get(key) || { windowStart: now, count: 0 };
  if (now - entry.windowStart > windowMs) {
    entry.windowStart = now;
    entry.count = 0;
  }
  entry.count += 1;
  apiKeyUsage.set(key, entry);
  cleanupApiKeyUsage(windowMs);

  if (entry.count > max) {
    throw new RateLimitError('API key rate limit exceeded');
  }
};

const apiKeyAuth = async (req, res, next) => {
  try {
    const rawKey = getApiKeyFromRequest(req);
    if (!rawKey) {
      return next(new AuthenticationError('No API key provided'));
    }

    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const org = await Organization.findOne({
      'settings.integrations.apiKeys.hash': hash
    }).select('settings status');

    if (!org || org.status !== 'active') {
      throw new AuthenticationError('Invalid API key');
    }

    const apiKey = org.settings?.integrations?.apiKeys?.find((key) => key.hash === hash);
    if (!apiKey || apiKey.revokedAt) {
      throw new AuthenticationError('Invalid API key');
    }
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new AuthenticationError('API key expired');
    }

    await enforceRateLimit(org._id.toString(), apiKey, apiKey.rateLimit);
    touchApiKeyLastUsed(org._id, apiKey.id).catch(() => {});

    req.apiKey = {
      id: apiKey.id,
      scopes: apiKey.scopes || [],
      organization: org._id.toString()
    };
    req.user = {
      id: null,
      role: 'api_key',
      organization: org._id.toString(),
      authType: 'api_key'
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  apiKeyAuth,
  getApiKeyFromRequest
};
