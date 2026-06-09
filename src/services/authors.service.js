const { prisma } = require('../config/prisma');
const ApiError = require('../utils/ApiError');

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
  return prisma.author.create({ data });
}

async function updateAuthor(id, data) {
  await getAuthorById(id);
  return prisma.author.update({ where: { id: Number(id) }, data });
}

async function deleteAuthor(id) {
  const bookCount = await prisma.book.count({ where: { authorId: Number(id) } });
  if (bookCount > 0) throw ApiError.conflict('Cannot delete author with books');
  await prisma.author.delete({ where: { id: Number(id) } });
}

module.exports = { listAuthors, getAuthorById, createAuthor, updateAuthor, deleteAuthor };
