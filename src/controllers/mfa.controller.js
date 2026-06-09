const asyncHandler = require('../utils/asyncHandler');
const mfaService = require('../services/mfa.service');

const setup = asyncHandler(async (req, res) => {
  const result = await mfaService.setupMfa(req.user.id);
  res.status(200).json({ success: true, data: result });
});

const enable = asyncHandler(async (req, res) => {
  const result = await mfaService.enableMfa(req.user.id, req.body.code);
  res.status(200).json({ success: true, data: result });
});

const disable = asyncHandler(async (req, res) => {
  const result = await mfaService.disableMfa(req.user.id, req.body.code);
  res.status(200).json({ success: true, data: result });
});

const verify = asyncHandler(async (req, res) => {
  const result = await mfaService.verifyMfaLogin(req.body);
  res.status(200).json({ success: true, data: result });
});

module.exports = { setup, enable, disable, verify };
