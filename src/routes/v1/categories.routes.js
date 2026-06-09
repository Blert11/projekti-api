const express = require('express');
const { body, param } = require('express-validator');

const ctrl = require('../../controllers/categories.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

const idParam = [param('id').isInt({ min: 1 })];
const nameRules = [body('name').trim().notEmpty().isLength({ max: 50 })];

/**
 * @openapi
 * /api/v1/categories:
 *   get:
 *     summary: List all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
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
 */
router.get('/', ctrl.list);

/**
 * @openapi
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Category found }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', validate(idParam), ctrl.get);

/**
 * @openapi
 * /api/v1/categories:
 *   post:
 *     summary: Create a new category (ADMIN or LIBRARIAN only)
 *     tags: [Categories]
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
 *               name: { type: string, example: "Science Fiction" }
 *     responses:
 *       201: { description: Category created }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { description: Category with that name already exists }
 */
router.post('/', authenticate, authorize('ADMIN', 'LIBRARIAN'), validate(nameRules), ctrl.create);

/**
 * @openapi
 * /api/v1/categories/{id}:
 *   put:
 *     summary: Update a category (ADMIN or LIBRARIAN only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       200: { description: Category updated }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put('/:id', authenticate, authorize('ADMIN', 'LIBRARIAN'), validate([...idParam, ...nameRules]), ctrl.update);

/**
 * @openapi
 * /api/v1/categories/{id}:
 *   delete:
 *     summary: Delete a category (ADMIN only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Category deleted }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/:id', authenticate, authorize('ADMIN'), validate(idParam), ctrl.remove);

module.exports = router;
