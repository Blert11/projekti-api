jest.mock('../../src/config/prisma', () => ({
  prisma: {
    author: {
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
const svc = require('../../src/services/authors.service');

describe('authors.service', () => {
  afterEach(() => jest.clearAllMocks());

  describe('getAuthorById', () => {
    test('throws 404 when author does not exist', async () => {
      prisma.author.findUnique.mockResolvedValue(null);
      await expect(svc.getAuthorById(99)).rejects.toMatchObject({ statusCode: 404 });
    });

    test('returns the author with books when found', async () => {
      const author = { id: 1, name: 'Author One', books: [] };
      prisma.author.findUnique.mockResolvedValue(author);
      await expect(svc.getAuthorById(1)).resolves.toEqual(author);
    });
  });

  describe('updateAuthor', () => {
    test('throws 404 when author does not exist', async () => {
      prisma.author.findUnique.mockResolvedValue(null);
      await expect(svc.updateAuthor(99, { name: 'New Name' })).rejects.toMatchObject({ statusCode: 404 });
      expect(prisma.author.update).not.toHaveBeenCalled();
    });

    test('updates the author when it exists', async () => {
      prisma.author.findUnique.mockResolvedValue({ id: 1, name: 'Old Name', books: [] });
      prisma.author.update.mockResolvedValue({ id: 1, name: 'New Name' });

      await expect(svc.updateAuthor(1, { name: 'New Name' })).resolves.toEqual({ id: 1, name: 'New Name' });
      expect(prisma.author.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { name: 'New Name' } });
    });
  });

  describe('deleteAuthor', () => {
    test('throws 409 when the author still has books', async () => {
      prisma.book.count.mockResolvedValue(2);
      await expect(svc.deleteAuthor(1)).rejects.toMatchObject({ statusCode: 409 });
      expect(prisma.author.delete).not.toHaveBeenCalled();
    });

    test('deletes the author when it has no books', async () => {
      prisma.book.count.mockResolvedValue(0);
      prisma.author.delete.mockResolvedValue({});

      await svc.deleteAuthor(1);
      expect(prisma.author.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
