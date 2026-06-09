const { prisma } = require('../config/prisma');
const ApiError = require('../utils/ApiError');

async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

async function getCategoryById(id) {
  const cat = await prisma.category.findUnique({ where: { id: Number(id) } });
  if (!cat) throw ApiError.notFound('Category not found');
  return cat;
}

async function createCategory(data) {
  const existing = await prisma.category.findUnique({ where: { name: data.name } });
  if (existing) throw ApiError.conflict('Category with this name already exists');
  return prisma.category.create({ data });
}

async function updateCategory(id, data) {
  await getCategoryById(id);
  return prisma.category.update({ where: { id: Number(id) }, data });
}

async function deleteCategory(id) {
  const bookCount = await prisma.book.count({ where: { categoryId: Number(id) } });
  if (bookCount > 0) throw ApiError.conflict('Cannot delete category with books');
  await prisma.category.delete({ where: { id: Number(id) } });
}

module.exports = { listCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
