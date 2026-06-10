const asyncHandler = require('../utils/asyncHandler');
const svc = require('../services/categories.service');
const { logAudit } = require('../utils/audit');

const list = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await svc.listCategories() });
});
const get = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.getCategoryById(req.params.id) });
});
const create = asyncHandler(async (req, res) => {
  const category = await svc.createCategory(req.body);
  logAudit(req, { action: 'category.create', resource: 'category', resourceId: category.id });
  res.status(201).json({ success: true, data: category });
});
const update = asyncHandler(async (req, res) => {
  const category = await svc.updateCategory(req.params.id, req.body);
  logAudit(req, { action: 'category.update', resource: 'category', resourceId: category.id });
  res.json({ success: true, data: category });
});
const remove = asyncHandler(async (req, res) => {
  await svc.deleteCategory(req.params.id);
  logAudit(req, { action: 'category.delete', resource: 'category', resourceId: Number(req.params.id) });
  res.status(204).send();
});

module.exports = { list, get, create, update, remove };
