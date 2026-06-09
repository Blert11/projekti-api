const express = require('express');
const { body } = require('express-validator');

const ctrl = require('../../controllers/mfa.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

const codeRules = [
  body('code').notEmpty().withMessage('code is required').isLength({ min: 6, max: 6 }).isNumeric(),
];

const verifyRules = [
  body('mfaToken').notEmpty().withMessage('mfaToken is required'),
  ...codeRules,
];

/**
 * @openapi
 * /api/v1/mfa/setup:
 *   post:
 *     tags: [MFA]
 *     summary: Generate TOTP secret and QR code for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QR code data URL and raw secret
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     secret: { type: string }
 *                     qrCodeDataUrl: { type: string }
 *                     otpAuthUrl: { type: string }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       409: { description: 'MFA already enabled' }
 */
router.post('/setup', authenticate, ctrl.setup);

/**
 * @openapi
 * /api/v1/mfa/enable:
 *   post:
 *     tags: [MFA]
 *     summary: Confirm TOTP code and activate MFA
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, example: "123456" }
 *     responses:
 *       200: { description: MFA enabled }
 *       401: { description: Invalid TOTP code }
 */
router.post('/enable', authenticate, validate(codeRules), ctrl.enable);

/**
 * @openapi
 * /api/v1/mfa/disable:
 *   post:
 *     tags: [MFA]
 *     summary: Disable MFA for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, example: "123456" }
 *     responses:
 *       200: { description: MFA disabled }
 *       401: { description: Invalid TOTP code }
 */
router.post('/disable', authenticate, validate(codeRules), ctrl.disable);

/**
 * @openapi
 * /api/v1/mfa/verify:
 *   post:
 *     tags: [MFA]
 *     summary: Complete login by verifying TOTP code (used after login returns requiresMfa=true)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mfaToken, code]
 *             properties:
 *               mfaToken: { type: string }
 *               code: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: Full token pair issued
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401: { description: Invalid TOTP code or MFA token }
 */
router.post('/verify', validate(verifyRules), ctrl.verify);

module.exports = router;
