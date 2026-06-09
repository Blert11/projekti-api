const asyncHandler = require('../utils/asyncHandler');
const svc = require('../services/authors.service');

const list = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.listAuthors() });
});
const get = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.getAuthorById(req.params.id) });
});
const create = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await svc.createAuthor(req.body) });
});
const update = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.updateAuthor(req.params.id, req.body) });
});
const remove = asyncHandler(async (req, res) => {
  await svc.deleteAuthor(req.params.id);
  res.status(204).send();
});

module.exports = { list, get, create, update, remove };
