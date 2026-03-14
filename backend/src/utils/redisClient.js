const logger = require('./logger');

let redisClient = null;
let redisInit = null;

const ensureRedisClient = () => {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (redisClient) return redisClient;

  try {
    const { createClient } = require('redis');
    redisClient = createClient({ url });

    redisClient.on('error', (err) => {
      logger.error('[redis] error', err?.message || err);
    });

    redisClient.on('ready', () => {
      logger.info('[redis] ready');
    });

    redisClient.on('end', () => {
      logger.warn('[redis] connection closed');
    });
  } catch (err) {
    logger.error('[redis] client init failed', err?.message || err);
    redisClient = null;
  }

  return redisClient;
};

const initRedis = async () => {
  const client = ensureRedisClient();
  if (!client) return null;

  if (!redisInit) {
    redisInit = client.connect().catch((err) => {
      logger.error('[redis] connection failed', err?.message || err);
    });
  }

  await redisInit;
  return client;
};

const getRedisClient = () => ensureRedisClient();

const closeRedis = async () => {
  if (!redisClient) return;
  try {
    await redisClient.quit();
  } catch (err) {
    logger.warn('[redis] quit failed', err?.message || err);
  } finally {
    redisClient = null;
    redisInit = null;
  }
};

module.exports = {
  getRedisClient,
  initRedis,
  closeRedis
};
