jest.mock('../../src/config/prisma', () => ({
  prisma: {
    category: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    book: {
      count: jest.fn(),
    },
  },
}));
jest.mock('../../src/config/redis', () => ({ invalidatePrefix: jest.fn().mockResolvedValue(undefined) }));

const { prisma } = require('../../src/config/prisma');
const svc = require('../../src/services/categories.service');

describe('categories.service', () => {
  afterEach(() => jest.clearAllMocks());

  describe('getCategoryById', () => {
    test('throws 404 when category does not exist', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(svc.getCategoryById(99)).rejects.toMatchObject({ statusCode: 404 });
    });

    test('returns the category when found', async () => {
      prisma.category.findUnique.mockResolvedValue({ id: 1, name: 'Fiction' });
      await expect(svc.getCategoryById(1)).resolves.toEqual({ id: 1, name: 'Fiction' });
    });
  });

  describe('createCategory', () => {
    test('throws 409 when name already exists', async () => {
      prisma.category.findUnique.mockResolvedValue({ id: 1, name: 'Fiction' });
      await expect(svc.createCategory({ name: 'Fiction' })).rejects.toMatchObject({ statusCode: 409 });
      expect(prisma.category.create).not.toHaveBeenCalled();
    });

    test('creates the category when name is unique', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      prisma.category.create.mockResolvedValue({ id: 2, name: 'Drama' });

      await expect(svc.createCategory({ name: 'Drama' })).resolves.toEqual({ id: 2, name: 'Drama' });
      expect(prisma.category.create).toHaveBeenCalledWith({ data: { name: 'Drama' } });
    });
  });

  describe('deleteCategory', () => {
    test('throws 409 when the category still has books', async () => {
      prisma.book.count.mockResolvedValue(3);
      await expect(svc.deleteCategory(1)).rejects.toMatchObject({ statusCode: 409 });
      expect(prisma.category.delete).not.toHaveBeenCalled();
    });

    test('deletes the category when it has no books', async () => {
      prisma.book.count.mockResolvedValue(0);
      prisma.category.delete.mockResolvedValue({});

      await svc.deleteCategory(1);
      expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
