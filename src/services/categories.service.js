const { prisma } = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { invalidatePrefix } = require('../config/redis');

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
  const category = await prisma.category.create({ data });
  await invalidatePrefix('categories');
  return category;
}

async function updateCategory(id, data) {
  await getCategoryById(id);
  const category = await prisma.category.update({ where: { id: Number(id) }, data });
  await Promise.all([invalidatePrefix('categories'), invalidatePrefix('books')]);
  return category;
}

async function deleteCategory(id) {
  const bookCount = await prisma.book.count({ where: { categoryId: Number(id) } });
  if (bookCount > 0) throw ApiError.conflict('Cannot delete category with books');
  await prisma.category.delete({ where: { id: Number(id) } });
  await Promise.all([invalidatePrefix('categories'), invalidatePrefix('books')]);
}

module.exports = { listCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
