const asyncHandler = require('../utils/asyncHandler');
const booksService = require('../services/books.service');

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
  res.status(201).json({ success: true, data: book });
});

const update = asyncHandler(async (req, res) => {
  const book = await booksService.updateBook(req.params.id, req.body);
  res.json({ success: true, data: book });
});

const remove = asyncHandler(async (req, res) => {
  await booksService.deleteBook(req.params.id);
  res.status(204).send();
});

module.exports = { list, get, create, update, remove };
