const asyncHandler = require('../utils/asyncHandler');
const mfaService = require('../services/mfa.service');
const { logAudit } = require('../utils/audit');

const setup = asyncHandler(async (req, res) => {
  const result = await mfaService.setupMfa(req.user.id);
  logAudit(req, { action: 'mfa.setup', resource: 'user', resourceId: req.user.id });
  res.status(200).json({ success: true, data: result });
});

const enable = asyncHandler(async (req, res) => {
  try {
    const result = await mfaService.enableMfa(req.user.id, req.body.code);
    logAudit(req, { action: 'mfa.enable', resource: 'user', resourceId: req.user.id });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    logAudit(req, {
      action: 'mfa.enable',
      outcome: 'failure',
      resource: 'user',
      resourceId: req.user.id,
      reason: err.message,
    });
    throw err;
  }
});

const disable = asyncHandler(async (req, res) => {
  try {
    const result = await mfaService.disableMfa(req.user.id, req.body.code);
    logAudit(req, { action: 'mfa.disable', resource: 'user', resourceId: req.user.id });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    logAudit(req, {
      action: 'mfa.disable',
      outcome: 'failure',
      resource: 'user',
      resourceId: req.user.id,
      reason: err.message,
    });
    throw err;
  }
});

const verify = asyncHandler(async (req, res) => {
  try {
    const result = await mfaService.verifyMfaLogin(req.body);
    logAudit(req, {
      action: 'mfa.verify_login',
      resource: 'user',
      resourceId: result.user?.id,
      actorEmail: result.user?.email,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    logAudit(req, { action: 'mfa.verify_login', outcome: 'failure', resource: 'user', reason: err.message });
    throw err;
  }
});

module.exports = { setup, enable, disable, verify };
