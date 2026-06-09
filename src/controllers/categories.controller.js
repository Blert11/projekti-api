const asyncHandler = require('../utils/asyncHandler');
const svc = require('../services/categories.service');

const list = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await svc.listCategories() });
});
const get = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.getCategoryById(req.params.id) });
});
const create = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await svc.createCategory(req.body) });
});
const update = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.updateCategory(req.params.id, req.body) });
});
const remove = asyncHandler(async (req, res) => {
  await svc.deleteCategory(req.params.id);
  res.status(204).send();
});

module.exports = { list, get, create, update, remove };
