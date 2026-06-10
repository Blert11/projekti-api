const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');
const { logAudit } = require('../utils/audit');

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  logAudit(req, { action: 'auth.register', resource: 'user', resourceId: user.id, actorEmail: user.email });
  res.status(201).json({ success: true, data: user });
});

const login = asyncHandler(async (req, res) => {
  try {
    const result = await authService.login(req.body);
    logAudit(req, {
      action: 'auth.login',
      resource: 'user',
      resourceId: result.user?.id,
      actorEmail: req.body.email,
      meta: { mfaRequired: !!result.requiresMfa },
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    logAudit(req, {
      action: 'auth.login',
      outcome: 'failure',
      resource: 'user',
      actorEmail: req.body.email,
      reason: err.message,
    });
    throw err;
  }
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  res.status(200).json({ success: true, data: user });
});

const refresh = asyncHandler(async (req, res) => {
  try {
    const result = await authService.refreshTokens(req.body);
    logAudit(req, { action: 'auth.refresh', resource: 'user' });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    logAudit(req, { action: 'auth.refresh', outcome: 'failure', resource: 'user', reason: err.message });
    throw err;
  }
});

module.exports = { register, login, me, refresh };
