const { prisma } = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const bookInclude = { author: true, category: true };

async function listBooks({ page = 1, limit = 10, search, authorId, categoryId, available }) {
  const where = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { isbn: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (authorId) where.authorId = Number(authorId);
  if (categoryId) where.categoryId = Number(categoryId);
  if (available === 'true') where.availableCopies = { gt: 0 };

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    prisma.book.findMany({
      where,
      include: bookInclude,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.book.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  };
}

async function getBookById(id) {
  const book = await prisma.book.findUnique({
    where: { id: Number(id) },
    include: bookInclude,
  });
  if (!book) throw ApiError.notFound('Book not found');
  return book;
}

async function createBook(data) {
  const existing = await prisma.book.findUnique({ where: { isbn: data.isbn } });
  if (existing) throw ApiError.conflict('Book with this ISBN already exists');

  const author = await prisma.author.findUnique({ where: { id: data.authorId } });
  if (!author) throw ApiError.badRequest('Author not found');

  if (data.categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!cat) throw ApiError.badRequest('Category not found');
  }

  return prisma.book.create({
    data: {
      ...data,
      availableCopies: data.totalCopies ?? 1,
    },
    include: bookInclude,
  });
}

async function updateBook(id, data) {
  await getBookById(id);
  if (data.isbn) {
    const dup = await prisma.book.findFirst({
      where: { isbn: data.isbn, NOT: { id: Number(id) } },
    });
    if (dup) throw ApiError.conflict('Another book with this ISBN already exists');
  }
  return prisma.book.update({
    where: { id: Number(id) },
    data,
    include: bookInclude,
  });
}

async function deleteBook(id) {
  await getBookById(id);
  const activeLoans = await prisma.loan.count({
    where: { bookId: Number(id), status: 'ACTIVE' },
  });
  if (activeLoans > 0) {
    throw ApiError.conflict('Cannot delete a book with active loans');
  }
  await prisma.book.delete({ where: { id: Number(id) } });
}

module.exports = { listBooks, getBookById, createBook, updateBook, deleteBook };
