jest.mock('../../src/config/prisma', () => ({
  prisma: {
    book: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    author: {
      findUnique: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    loan: {
      count: jest.fn(),
    },
  },
}));
jest.mock('../../src/config/redis', () => ({ invalidatePrefix: jest.fn().mockResolvedValue(undefined) }));

const { prisma } = require('../../src/config/prisma');
const svc = require('../../src/services/books.service');

describe('books.service', () => {
  afterEach(() => jest.clearAllMocks());

  describe('createBook', () => {
    test('throws 409 when ISBN already exists', async () => {
      prisma.book.findUnique.mockResolvedValue({ id: 1, isbn: 'ISBN-1' });
      await expect(svc.createBook({ isbn: 'ISBN-1', authorId: 1 })).rejects.toMatchObject({ statusCode: 409 });
      expect(prisma.book.create).not.toHaveBeenCalled();
    });

    test('throws 400 when author does not exist', async () => {
      prisma.book.findUnique.mockResolvedValue(null);
      prisma.author.findUnique.mockResolvedValue(null);

      await expect(svc.createBook({ isbn: 'ISBN-1', authorId: 999 })).rejects.toMatchObject({ statusCode: 400 });
      expect(prisma.book.create).not.toHaveBeenCalled();
    });

    test('throws 400 when categoryId is provided but category does not exist', async () => {
      prisma.book.findUnique.mockResolvedValue(null);
      prisma.author.findUnique.mockResolvedValue({ id: 1 });
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(svc.createBook({ isbn: 'ISBN-1', authorId: 1, categoryId: 999 })).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(prisma.book.create).not.toHaveBeenCalled();
    });

    test('defaults availableCopies to totalCopies when creating', async () => {
      prisma.book.findUnique.mockResolvedValue(null);
      prisma.author.findUnique.mockResolvedValue({ id: 1 });
      prisma.book.create.mockResolvedValue({ id: 1, title: 'New Book', totalCopies: 3, availableCopies: 3 });

      await svc.createBook({ title: 'New Book', isbn: 'ISBN-1', authorId: 1, totalCopies: 3 });

      expect(prisma.book.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ availableCopies: 3 }) })
      );
    });

    test('defaults availableCopies to 1 when totalCopies is not provided', async () => {
      prisma.book.findUnique.mockResolvedValue(null);
      prisma.author.findUnique.mockResolvedValue({ id: 1 });
      prisma.book.create.mockResolvedValue({ id: 1, title: 'New Book', availableCopies: 1 });

      await svc.createBook({ title: 'New Book', isbn: 'ISBN-1', authorId: 1 });

      expect(prisma.book.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ availableCopies: 1 }) })
      );
    });
  });

  describe('updateBook', () => {
    test('throws 404 when the book does not exist', async () => {
      prisma.book.findUnique.mockResolvedValue(null);
      await expect(svc.updateBook(99, { title: 'Updated' })).rejects.toMatchObject({ statusCode: 404 });
      expect(prisma.book.update).not.toHaveBeenCalled();
    });

    test('throws 409 when changing ISBN to one used by another book', async () => {
      prisma.book.findUnique.mockResolvedValue({ id: 1, isbn: 'ISBN-1' });
      prisma.book.findFirst.mockResolvedValue({ id: 2, isbn: 'ISBN-2' });

      await expect(svc.updateBook(1, { isbn: 'ISBN-2' })).rejects.toMatchObject({ statusCode: 409 });
      expect(prisma.book.update).not.toHaveBeenCalled();
    });

    test('updates the book when valid', async () => {
      prisma.book.findUnique.mockResolvedValue({ id: 1, isbn: 'ISBN-1' });
      prisma.book.update.mockResolvedValue({ id: 1, title: 'Updated' });

      await expect(svc.updateBook(1, { title: 'Updated' })).resolves.toEqual({ id: 1, title: 'Updated' });
    });
  });

  describe('deleteBook', () => {
    test('throws 404 when the book does not exist', async () => {
      prisma.book.findUnique.mockResolvedValue(null);
      await expect(svc.deleteBook(99)).rejects.toMatchObject({ statusCode: 404 });
    });

    test('throws 409 when the book has active loans', async () => {
      prisma.book.findUnique.mockResolvedValue({ id: 1 });
      prisma.loan.count.mockResolvedValue(1);

      await expect(svc.deleteBook(1)).rejects.toMatchObject({ statusCode: 409 });
      expect(prisma.book.delete).not.toHaveBeenCalled();
    });

    test('deletes the book when there are no active loans', async () => {
      prisma.book.findUnique.mockResolvedValue({ id: 1 });
      prisma.loan.count.mockResolvedValue(0);
      prisma.book.delete.mockResolvedValue({});

      await svc.deleteBook(1);
      expect(prisma.book.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
