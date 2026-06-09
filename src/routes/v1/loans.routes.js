const express = require('express');
const { body, param, query } = require('express-validator');

const ctrl = require('../../controllers/loans.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

const idParam = [param('id').isInt({ min: 1 })];
const listQuery = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['ACTIVE', 'RETURNED', 'OVERDUE']),
  query('memberId').optional().isInt({ min: 1 }),
  query('bookId').optional().isInt({ min: 1 }),
];
const borrowRules = [
  body('bookId').isInt({ min: 1 }).withMessage('bookId is required'),
  body('memberId').optional().isInt({ min: 1 }),
];

/**
 * @openapi
 * /api/v1/loans/me:
 *   get:
 *     tags: [Loans]
 *     summary: List my loans (current user)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of loans }
 */
router.get('/me', ctrl.myLoans);

/**
 * @openapi
 * /api/v1/loans:
 *   get:
 *     tags: [Loans]
 *     summary: List all loans (ADMIN, LIBRARIAN)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [ACTIVE, RETURNED, OVERDUE] } }
 *       - { in: query, name: memberId, schema: { type: integer } }
 *       - { in: query, name: bookId, schema: { type: integer } }
 *     responses:
 *       200: { description: Paginated loans }
 */
router.get('/', authorize('ADMIN', 'LIBRARIAN'), validate(listQuery), ctrl.list);

/**
 * @openapi
 * /api/v1/loans/{id}:
 *   get:
 *     tags: [Loans]
 *     summary: Get loan by id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Loan details }
 */
router.get('/:id', validate(idParam), ctrl.get);

/**
 * @openapi
 * /api/v1/loans/borrow:
 *   post:
 *     tags: [Loans]
 *     summary: Borrow a book. Members borrow for themselves; LIBRARIAN/ADMIN can pass memberId.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookId]
 *             properties:
 *               bookId: { type: integer }
 *               memberId: { type: integer, description: 'Required when role is LIBRARIAN/ADMIN' }
 *     responses:
 *       201: { description: Loan created }
 *       409: { description: No copies available, max loans reached, or duplicate }
 */
router.post('/borrow', validate(borrowRules), ctrl.borrow);

/**
 * @openapi
 * /api/v1/loans/{id}/return:
 *   post:
 *     tags: [Loans]
 *     summary: Return a borrowed book
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Loan returned }
 */
router.post('/:id/return', validate(idParam), ctrl.returnLoan);

/**
 * @openapi
 * /api/v1/loans/mark-overdue:
 *   post:
 *     tags: [Loans]
 *     summary: Sweep ACTIVE loans past dueDate and mark them OVERDUE (ADMIN, LIBRARIAN)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Number of loans marked overdue }
 */
router.post('/mark-overdue', authorize('ADMIN', 'LIBRARIAN'), ctrl.markOverdue);

module.exports = router;
