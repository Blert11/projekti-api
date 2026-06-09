const express = require('express');
const { body, param } = require('express-validator');

const ctrl = require('../../controllers/authors.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { cacheMiddleware } = require('../../middleware/cache.middleware');

const router = express.Router();

const idParam = [param('id').isInt({ min: 1 })];
const createRules = [
  body('name').trim().notEmpty().isLength({ max: 100 }),
  body('bio').optional().isString().isLength({ max: 1000 }),
];
const updateRules = [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('bio').optional().isString().isLength({ max: 1000 }),
];

/**
 * @openapi
 * /api/v1/authors:
 *   get:
 *     summary: List all authors
 *     tags: [Authors]
 *     responses:
 *       200:
 *         description: List of authors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       name: { type: string }
 *                       bio: { type: string, nullable: true }
 *                       createdAt: { type: string, format: date-time }
 */
router.get('/', cacheMiddleware('authors', 120), ctrl.list);

/**
 * @openapi
 * /api/v1/authors/{id}:
 *   get:
 *     summary: Get author by ID
 *     tags: [Authors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Author found }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', validate(idParam), cacheMiddleware('authors', 300), ctrl.get);

/**
 * @openapi
 * /api/v1/authors:
 *   post:
 *     summary: Create a new author (ADMIN or LIBRARIAN only)
 *     tags: [Authors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "Ismail Kadare" }
 *               bio: { type: string, example: "Shkrimtar shqiptar i njohur" }
 *     responses:
 *       201: { description: Author created }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post('/', authenticate, authorize('ADMIN', 'LIBRARIAN'), validate(createRules), ctrl.create);

/**
 * @openapi
 * /api/v1/authors/{id}:
 *   put:
 *     summary: Update an author (ADMIN or LIBRARIAN only)
 *     tags: [Authors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               bio: { type: string }
 *     responses:
 *       200: { description: Author updated }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put('/:id', authenticate, authorize('ADMIN', 'LIBRARIAN'), validate([...idParam, ...updateRules]), ctrl.update);

/**
 * @openapi
 * /api/v1/authors/{id}:
 *   delete:
 *     summary: Delete an author (ADMIN only)
 *     tags: [Authors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Author deleted }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/:id', authenticate, authorize('ADMIN'), validate(idParam), ctrl.remove);

module.exports = router;
