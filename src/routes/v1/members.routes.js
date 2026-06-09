const express = require('express');
const { body, param, query } = require('express-validator');

const ctrl = require('../../controllers/members.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

const idParam = [param('id').isInt({ min: 1 })];
const listQuery = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString().trim(),
];
const updateRules = [
  body('phone').optional().isString().isLength({ max: 20 }),
  body('address').optional().isString().isLength({ max: 200 }),
];

router.use(authenticate);

/**
 * @openapi
 * /api/v1/members/me:
 *   get:
 *     summary: Get the current authenticated member's profile
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current member's profile
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { description: Logged-in user is not a member }
 */
router.get('/me', ctrl.me);

/**
 * @openapi
 * /api/v1/members:
 *   get:
 *     summary: List all members (ADMIN or LIBRARIAN only)
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by member name or email
 *     responses:
 *       200:
 *         description: Paginated list of members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 items:
 *                   type: array
 *                   items: { type: object }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     pages: { type: integer }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/', authorize('ADMIN', 'LIBRARIAN'), validate(listQuery), ctrl.list);

/**
 * @openapi
 * /api/v1/members/{id}:
 *   get:
 *     summary: Get a member by ID (own profile or ADMIN/LIBRARIAN)
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Member profile }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', validate(idParam), ctrl.get);

/**
 * @openapi
 * /api/v1/members/{id}:
 *   put:
 *     summary: Update a member (own profile or ADMIN/LIBRARIAN)
 *     tags: [Members]
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
 *               phone: { type: string, example: "+38344123456" }
 *               address: { type: string, example: "Prishtine, Kosove" }
 *     responses:
 *       200: { description: Member updated }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put('/:id', validate([...idParam, ...updateRules]), ctrl.update);

/**
 * @openapi
 * /api/v1/members/{id}:
 *   delete:
 *     summary: Delete a member (ADMIN only)
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Member deleted }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/:id', authorize('ADMIN'), validate(idParam), ctrl.remove);

module.exports = router;
