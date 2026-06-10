const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../src/app');
const { resetDatabase, disconnect, prisma } = require('../helpers/db');

let adminToken;
let librarianToken;
let memberToken;
let authorId;

async function login(email, password) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.data.accessToken;
}

describe('Authors endpoints', () => {
  beforeAll(async () => {
    await resetDatabase();

    const hashed = await bcrypt.hash('pass1234', 4);
    await prisma.user.create({
      data: { email: 'admin@authors.com', password: hashed, name: 'Admin', role: 'ADMIN' },
    });
    await prisma.user.create({
      data: { email: 'librarian@authors.com', password: hashed, name: 'Librarian', role: 'LIBRARIAN' },
    });
    await prisma.user.create({
      data: {
        email: 'member@authors.com',
        password: hashed,
        name: 'Member',
        role: 'MEMBER',
        member: { create: {} },
      },
    });

    adminToken = await login('admin@authors.com', 'pass1234');
    librarianToken = await login('librarian@authors.com', 'pass1234');
    memberToken = await login('member@authors.com', 'pass1234');
  });

  afterAll(async () => {
    await resetDatabase();
    await disconnect();
  });

  describe('GET /api/v1/authors', () => {
    test('lists authors without auth', async () => {
      const res = await request(app).get('/api/v1/authors');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/authors/:id', () => {
    test('returns 404 for a non-existent author', async () => {
      const res = await request(app).get('/api/v1/authors/999999');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/authors', () => {
    test('rejects without a token (401)', async () => {
      const res = await request(app).post('/api/v1/authors').send({ name: 'Author One' });
      expect(res.status).toBe(401);
    });

    test('rejects MEMBER role (403)', async () => {
      const res = await request(app)
        .post('/api/v1/authors')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Author One' });
      expect(res.status).toBe(403);
    });

    test('rejects missing name (400)', async () => {
      const res = await request(app)
        .post('/api/v1/authors')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({ bio: 'No name provided' });
      expect(res.status).toBe(400);
      expect(res.body.error.details.length).toBeGreaterThan(0);
    });

    test('creates an author as LIBRARIAN (201)', async () => {
      const res = await request(app)
        .post('/api/v1/authors')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({ name: 'Author One', bio: 'A test author' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Author One');
      authorId = res.body.data.id;
    });
  });

  describe('PUT /api/v1/authors/:id', () => {
    test('returns 404 for a non-existent author', async () => {
      const res = await request(app)
        .put('/api/v1/authors/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' });
      expect(res.status).toBe(404);
    });

    test('updates an author as ADMIN (200)', async () => {
      const res = await request(app)
        .put(`/api/v1/authors/${authorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ bio: 'Updated bio' });

      expect(res.status).toBe(200);
      expect(res.body.data.bio).toBe('Updated bio');
    });
  });

  describe('DELETE /api/v1/authors/:id', () => {
    test('rejects LIBRARIAN role (403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/authors/${authorId}`)
        .set('Authorization', `Bearer ${librarianToken}`);
      expect(res.status).toBe(403);
    });

    test('rejects deleting an author with books (409)', async () => {
      const book = await prisma.book.create({
        data: { title: 'Linked Book', isbn: 'AUTH-ISBN-001', authorId },
      });

      const res = await request(app)
        .delete(`/api/v1/authors/${authorId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(409);

      await prisma.book.delete({ where: { id: book.id } });
    });

    test('deletes an author as ADMIN (204)', async () => {
      const res = await request(app)
        .delete(`/api/v1/authors/${authorId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);

      const check = await request(app).get(`/api/v1/authors/${authorId}`);
      expect(check.status).toBe(404);
    });
  });
});
