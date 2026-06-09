const { body, param, query } = require('express-validator');

const idParam = [param('id').isInt({ min: 1 }).withMessage('Invalid id')];

const listQuery = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString().trim(),
  query('authorId').optional().isInt({ min: 1 }),
  query('categoryId').optional().isInt({ min: 1 }),
  query('available').optional().isIn(['true', 'false']),
];

const createRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('isbn').trim().notEmpty().withMessage('ISBN is required').isLength({ max: 20 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('publishedYear').optional().isInt({ min: 1000, max: 9999 }),
  body('totalCopies').optional().isInt({ min: 1 }),
  body('authorId').isInt({ min: 1 }).withMessage('authorId is required'),
  body('categoryId').optional().isInt({ min: 1 }),
];

const updateRules = [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('isbn').optional().trim().isLength({ min: 1, max: 20 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('publishedYear').optional().isInt({ min: 1000, max: 9999 }),
  body('totalCopies').optional().isInt({ min: 0 }),
  body('availableCopies').optional().isInt({ min: 0 }),
  body('authorId').optional().isInt({ min: 1 }),
  body('categoryId').optional().isInt({ min: 1 }),
];

module.exports = { idParam, listQuery, createRules, updateRules };
