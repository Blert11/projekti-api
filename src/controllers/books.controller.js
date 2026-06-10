const asyncHandler = require('../utils/asyncHandler');
const booksService = require('../services/books.service');
const { logAudit } = require('../utils/audit');

const list = asyncHandler(async (req, res) => {
  const result = await booksService.listBooks(req.query);
  res.json({ success: true, ...result });
});

const get = asyncHandler(async (req, res) => {
  const book = await booksService.getBookById(req.params.id);
  res.json({ success: true, data: book });
});

const create = asyncHandler(async (req, res) => {
  const book = await booksService.createBook(req.body);
  logAudit(req, { action: 'book.create', resource: 'book', resourceId: book.id });
  res.status(201).json({ success: true, data: book });
});

const update = asyncHandler(async (req, res) => {
  const book = await booksService.updateBook(req.params.id, req.body);
  logAudit(req, { action: 'book.update', resource: 'book', resourceId: book.id });
  res.json({ success: true, data: book });
});

const remove = asyncHandler(async (req, res) => {
  await booksService.deleteBook(req.params.id);
  logAudit(req, { action: 'book.delete', resource: 'book', resourceId: Number(req.params.id) });
  res.status(204).send();
});

module.exports = { list, get, create, update, remove };
