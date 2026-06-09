const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const config = require('../config/env');

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

function errorHandler(err, req, res, _next) {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message);
  }

  logger.error(error.message, {
    statusCode: error.statusCode,
    path: req.originalUrl,
    method: req.method,
    stack: config.env === 'development' ? err.stack : undefined,
  });

  res.status(error.statusCode).json({
    success: false,
    error: {
      code: error.statusCode,
      message: error.message,
      ...(error.details && { details: error.details }),
      ...(config.env === 'development' && { stack: err.stack }),
    },
  });
}

module.exports = { notFoundHandler, errorHandler };
