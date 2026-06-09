const express = require('express');

const ctrl = require('../../controllers/books.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { idParam, listQuery, createRules, updateRules } = require('../../validators/book.validator');
const { cacheMiddleware } = require('../../middleware/cache.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/v1/books:
 *   get:
 *     tags: [Books]
 *     summary: List books (public)
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 10, maximum: 100 } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: authorId, schema: { type: integer } }
 *       - { in: query, name: categoryId, schema: { type: integer } }
 *       - { in: query, name: available, schema: { type: string, enum: [true, false] } }
 *     responses:
 *       200:
 *         description: Paginated list of books
 */
router.get('/', validate(listQuery), cacheMiddleware('books', 120), ctrl.list);

/**
 * @openapi
 * /api/v1/books/{id}:
 *   get:
 *     tags: [Books]
 *     summary: Get book by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Book details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', validate(idParam), cacheMiddleware('books', 300), ctrl.get);

/**
 * @openapi
 * /api/v1/books:
 *   post:
 *     tags: [Books]
 *     summary: Create a new book (ADMIN, LIBRARIAN)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookCreate'
 *     responses:
 *       201:
 *         description: Book created
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: ISBN already exists
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'LIBRARIAN'),
  validate(createRules),
  ctrl.create
);

/**
 * @openapi
 * /api/v1/books/{id}:
 *   put:
 *     tags: [Books]
 *     summary: Update a book (ADMIN, LIBRARIAN)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookCreate'
 *     responses:
 *       200:
 *         description: Book updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'LIBRARIAN'),
  validate([...idParam, ...updateRules]),
  ctrl.update
);

/**
 * @openapi
 * /api/v1/books/{id}:
 *   delete:
 *     tags: [Books]
 *     summary: Delete a book (ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Book deleted
 *       409:
 *         description: Book has active loans
 */
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(idParam),
  ctrl.remove
);

module.exports = router;