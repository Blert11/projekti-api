const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../src/app');
const { resetDatabase, disconnect, prisma } = require('../helpers/db');

let adminToken;
let librarianToken;
let memberToken;
let authorId;
let categoryId;
let bookId;
let memberRecordId;

async function login(email, password) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.data.accessToken;
}

describe('Books endpoints', () => {
  beforeAll(async () => {
    await resetDatabase();

    const hashed = await bcrypt.hash('pass1234', 4);
    await prisma.user.create({
      data: { email: 'admin@books.com', password: hashed, name: 'Admin', role: 'ADMIN' },
    });
    await prisma.user.create({
      data: { email: 'librarian@books.com', password: hashed, name: 'Librarian', role: 'LIBRARIAN' },
    });
    const memberUser = await prisma.user.create({
      data: {
        email: 'member@books.com',
        password: hashed,
        name: 'Member',
        role: 'MEMBER',
        member: { create: {} },
      },
      include: { member: true },
    });
    memberRecordId = memberUser.member.id;

    const author = await prisma.author.create({ data: { name: 'Author One' } });
    const category = await prisma.category.create({ data: { name: 'Category One' } });
    authorId = author.id;
    categoryId = category.id;

    adminToken = await login('admin@books.com', 'pass1234');
    librarianToken = await login('librarian@books.com', 'pass1234');
    memberToken = await login('member@books.com', 'pass1234');
  });

  afterAll(async () => {
    await resetDatabase();
    await disconnect();
  });

  describe('GET /api/v1/books', () => {
    test('lists books without auth, paginated', async () => {
      const res = await request(app).get('/api/v1/books');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.pagination).toEqual(expect.objectContaining({ page: 1, limit: 10 }));
    });
  });

  describe('GET /api/v1/books/:id', () => {
    test('returns 404 for a non-existent book', async () => {
      const res = await request(app).get('/api/v1/books/999999');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/books', () => {
    test('rejects without a token (401)', async () => {
      const res = await request(app)
        .post('/api/v1/books')
        .send({ title: 'New Book', isbn: 'ISBN-001', authorId });
      expect(res.status).toBe(401);
    });

    test('rejects MEMBER role (403)', async () => {
      const res = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ title: 'New Book', isbn: 'ISBN-001', authorId });
      expect(res.status).toBe(403);
    });

    test('rejects missing required fields (400)', async () => {
      const res = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({ title: 'No ISBN' });
      expect(res.status).toBe(400);
      expect(res.body.error.details.length).toBeGreaterThan(0);
    });

    test('rejects unknown authorId (400)', async () => {
      const res = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({ title: 'Orphan Book', isbn: 'ISBN-ORPHAN', authorId: 999999 });
      expect(res.status).toBe(400);
    });

    test('creates a book as LIBRARIAN (201)', async () => {
      const res = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({ title: 'New Book', isbn: 'ISBN-001', authorId, categoryId, totalCopies: 2 });

      expect(res.status).toBe(201);
      expect(res.body.data.availableCopies).toBe(2);
      expect(res.body.data.author.id).toBe(authorId);
      bookId = res.body.data.id;
    });

    test('rejects duplicate ISBN (409)', async () => {
      const res = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Duplicate ISBN Book', isbn: 'ISBN-001', authorId });
      expect(res.status).toBe(409);
    });
  });

  describe('PUT /api/v1/books/:id', () => {
    test('returns 404 for a non-existent book', async () => {
      const res = await request(app)
        .put('/api/v1/books/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated' });
      expect(res.status).toBe(404);
    });

    test('updates a book as ADMIN (200)', async () => {
      const res = await request(app)
        .put(`/api/v1/books/${bookId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Title', publishedYear: 2020 });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.publishedYear).toBe(2020);
    });

    test('rejects ISBN collision with another book (409)', async () => {
      const other = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Second Book', isbn: 'ISBN-002', authorId });
      expect(other.status).toBe(201);

      const res = await request(app)
        .put(`/api/v1/books/${bookId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isbn: 'ISBN-002' });
      expect(res.status).toBe(409);
    });
  });

  describe('DELETE /api/v1/books/:id', () => {
    test('rejects LIBRARIAN role (403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/books/${bookId}`)
        .set('Authorization', `Bearer ${librarianToken}`);
      expect(res.status).toBe(403);
    });

    test('rejects deleting a book with active loans (409)', async () => {
      await prisma.loan.create({
        data: {
          bookId,
          memberId: memberRecordId,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
        },
      });

      const res = await request(app)
        .delete(`/api/v1/books/${bookId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(409);

      await prisma.loan.deleteMany({ where: { bookId } });
    });

    test('deletes a book as ADMIN (204)', async () => {
      const res = await request(app)
        .delete(`/api/v1/books/${bookId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);

      const check = await request(app).get(`/api/v1/books/${bookId}`);
      expect(check.status).toBe(404);
    });
  });
});
