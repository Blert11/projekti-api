const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

module.exports = (validators) => {
  return async (req, res, next) => {
    await Promise.all(validators.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    return next(
      ApiError.badRequest(
        'Validation failed',
        errors.array().map((e) => ({ field: e.path, message: e.msg }))
      )
    );
  };
};
