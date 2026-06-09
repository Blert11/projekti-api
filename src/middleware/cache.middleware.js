const { redis } = require('../config/redis');
const logger = require('../config/logger');

function cacheMiddleware(prefix, ttl = 120) {
  return async (req, res, next) => {
    if (!redis) return next();

    const key = `${prefix}:${req.originalUrl}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (err) {
      logger.warn(`Cache get error: ${err.message}`);
      return next();
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode === 200) {
        redis.setex(key, ttl, JSON.stringify(body)).catch((err) => {
          logger.warn(`Cache set error: ${err.message}`);
        });
      }
      return originalJson(body);
    };

    return next();
  };
}

module.exports = { cacheMiddleware };
