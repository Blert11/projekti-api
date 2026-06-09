const { body } = require('express-validator');

const registerRules = [
  body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('phone').optional().isString().isLength({ max: 20 }),
  body('address').optional().isString().isLength({ max: 200 }),
];

const loginRules = [
  body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = { registerRules, loginRules };
