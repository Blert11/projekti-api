const Redis = require('ioredis');
const config = require('./env');
const logger = require('./logger');

let redis = null;

if (config.redis.url) {
  redis = new Redis(config.redis.url, {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
  });

  redis.on('connect', () => logger.info('Redis connected'));
  redis.on('error', (err) => logger.warn(`Redis error: ${err.message}`));
}

async function invalidatePrefix(prefix) {
  if (!redis) return;
  try {
    const keys = await redis.keys(`${prefix}:*`);
    if (keys.length > 0) await redis.del(...keys);
  } catch (err) {
    logger.warn(`Cache invalidate error: ${err.message}`);
  }
}

module.exports = { redis, invalidatePrefix };
