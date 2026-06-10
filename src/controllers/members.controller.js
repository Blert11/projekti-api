const asyncHandler = require('../utils/asyncHandler');
const svc = require('../services/members.service');
const ApiError = require('../utils/ApiError');
const { logAudit } = require('../utils/audit');

const list = asyncHandler(async (req, res) => {
  const result = await svc.listMembers(req.query);
  res.json({ success: true, ...result });
});

const get = asyncHandler(async (req, res) => {
  const member = await svc.getMemberById(req.params.id);
  if (req.user.role === 'MEMBER' && member.userId !== req.user.id) {
    throw ApiError.forbidden('You can only view your own profile');
  }
  res.json({ success: true, data: member });
});

const me = asyncHandler(async (req, res) => {
  const member = await svc.getMemberByUserId(req.user.id);
  res.json({ success: true, data: member });
});

const update = asyncHandler(async (req, res) => {
  const member = await svc.getMemberById(req.params.id);
  if (req.user.role === 'MEMBER' && member.userId !== req.user.id) {
    throw ApiError.forbidden('You can only update your own profile');
  }
  const updated = await svc.updateMember(req.params.id, req.body);
  logAudit(req, { action: 'member.update', resource: 'member', resourceId: updated.id });
  res.json({ success: true, data: updated });
});

const remove = asyncHandler(async (req, res) => {
  await svc.deleteMember(req.params.id);
  logAudit(req, { action: 'member.delete', resource: 'member', resourceId: Number(req.params.id) });
  res.status(204).send();
});

module.exports = { list, get, me, update, remove };
