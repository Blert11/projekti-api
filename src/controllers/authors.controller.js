const asyncHandler = require('../utils/asyncHandler');
const svc = require('../services/authors.service');
const { logAudit } = require('../utils/audit');

const list = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.listAuthors() });
});
const get = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.getAuthorById(req.params.id) });
});
const create = asyncHandler(async (req, res) => {
  const author = await svc.createAuthor(req.body);
  logAudit(req, { action: 'author.create', resource: 'author', resourceId: author.id });
  res.status(201).json({ success: true, data: author });
});
const update = asyncHandler(async (req, res) => {
  const author = await svc.updateAuthor(req.params.id, req.body);
  logAudit(req, { action: 'author.update', resource: 'author', resourceId: author.id });
  res.json({ success: true, data: author });
});
const remove = asyncHandler(async (req, res) => {
  await svc.deleteAuthor(req.params.id);
  logAudit(req, { action: 'author.delete', resource: 'author', resourceId: Number(req.params.id) });
  res.status(204).send();
});

module.exports = { list, get, create, update, remove };
