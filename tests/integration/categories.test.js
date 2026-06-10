const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../src/app');
const { resetDatabase, disconnect, prisma } = require('../helpers/db');

let adminToken;
let librarianToken;
let memberToken;
let authorId;
let categoryId;

async function login(email, password) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.data.accessToken;
}

describe('Categories endpoints', () => {
  beforeAll(async () => {
    await resetDatabase();

    const hashed = await bcrypt.hash('pass1234', 4);
    await prisma.user.create({
      data: { email: 'admin@categories.com', password: hashed, name: 'Admin', role: 'ADMIN' },
    });
    await prisma.user.create({
      data: { email: 'librarian@categories.com', password: hashed, name: 'Librarian', role: 'LIBRARIAN' },
    });
    await prisma.user.create({
      data: {
        email: 'member@categories.com',
        password: hashed,
        name: 'Member',
        role: 'MEMBER',
        member: { create: {} },
      },
    });

    const author = await prisma.author.create({ data: { name: 'Category Test Author' } });
    authorId = author.id;

    adminToken = await login('admin@categories.com', 'pass1234');
    librarianToken = await login('librarian@categories.com', 'pass1234');
    memberToken = await login('member@categories.com', 'pass1234');
  });

  afterAll(async () => {
    await resetDatabase();
    await disconnect();
  });

  describe('GET /api/v1/categories', () => {
    test('lists categories without auth', async () => {
      const res = await request(app).get('/api/v1/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/categories/:id', () => {
    test('returns 404 for a non-existent category', async () => {
      const res = await request(app).get('/api/v1/categories/999999');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/categories', () => {
    test('rejects without a token (401)', async () => {
      const res = await request(app).post('/api/v1/categories').send({ name: 'Fiction' });
      expect(res.status).toBe(401);
    });

    test('rejects MEMBER role (403)', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Fiction' });
      expect(res.status).toBe(403);
    });

    test('rejects missing name (400)', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error.details.length).toBeGreaterThan(0);
    });

    test('creates a category as LIBRARIAN (201)', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({ name: 'Fiction' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Fiction');
      categoryId = res.body.data.id;
    });

    test('rejects duplicate category name (409)', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Fiction' });
      expect(res.status).toBe(409);
    });
  });

  describe('PUT /api/v1/categories/:id', () => {
    test('returns 404 for a non-existent category', async () => {
      const res = await request(app)
        .put('/api/v1/categories/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' });
      expect(res.status).toBe(404);
    });

    test('rejects missing name (400)', async () => {
      const res = await request(app)
        .put(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    test('updates a category as ADMIN (200)', async () => {
      const res = await request(app)
        .put(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Science Fiction' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Science Fiction');
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    test('rejects LIBRARIAN role (403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${librarianToken}`);
      expect(res.status).toBe(403);
    });

    test('rejects deleting a category with books (409)', async () => {
      const book = await prisma.book.create({
        data: { title: 'Categorized Book', isbn: 'CAT-ISBN-001', authorId, categoryId },
      });

      const res = await request(app)
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(409);

      await prisma.book.delete({ where: { id: book.id } });
    });

    test('deletes a category as ADMIN (204)', async () => {
      const res = await request(app)
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);

      const check = await request(app).get(`/api/v1/categories/${categoryId}`);
      expect(check.status).toBe(404);
    });
  });
});
