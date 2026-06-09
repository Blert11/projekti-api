const { prisma } = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { invalidatePrefix } = require('../config/redis');

async function listAuthors() {
  return prisma.author.findMany({ orderBy: { name: 'asc' } });
}

async function getAuthorById(id) {
  const author = await prisma.author.findUnique({
    where: { id: Number(id) },
    include: { books: true },
  });
  if (!author) throw ApiError.notFound('Author not found');
  return author;
}

async function createAuthor(data) {
  const author = await prisma.author.create({ data });
  await invalidatePrefix('authors');
  return author;
}

async function updateAuthor(id, data) {
  await getAuthorById(id);
  const author = await prisma.author.update({ where: { id: Number(id) }, data });
  await Promise.all([invalidatePrefix('authors'), invalidatePrefix('books')]);
  return author;
}

async function deleteAuthor(id) {
  const bookCount = await prisma.book.count({ where: { authorId: Number(id) } });
  if (bookCount > 0) throw ApiError.conflict('Cannot delete author with books');
  await prisma.author.delete({ where: { id: Number(id) } });
  await Promise.all([invalidatePrefix('authors'), invalidatePrefix('books')]);
}

module.exports = { listAuthors, getAuthorById, createAuthor, updateAuthor, deleteAuthor };
