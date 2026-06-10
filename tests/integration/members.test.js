const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../src/app');
const { resetDatabase, disconnect, prisma } = require('../helpers/db');

let adminToken;
let librarianToken;
let member1Token;
let member2Token;
let member1Id;
let member2Id;

async function login(email, password) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.data.accessToken;
}

describe('Members endpoints', () => {
  beforeAll(async () => {
    await resetDatabase();

    const hashed = await bcrypt.hash('pass1234', 4);
    await prisma.user.create({
      data: { email: 'admin@members.com', password: hashed, name: 'Admin', role: 'ADMIN' },
    });
    await prisma.user.create({
      data: { email: 'librarian@members.com', password: hashed, name: 'Librarian', role: 'LIBRARIAN' },
    });
    const m1 = await prisma.user.create({
      data: {
        email: 'member1@members.com',
        password: hashed,
        name: 'Member One',
        role: 'MEMBER',
        member: { create: { phone: '+38344000001' } },
      },
      include: { member: true },
    });
    const m2 = await prisma.user.create({
      data: {
        email: 'member2@members.com',
        password: hashed,
        name: 'Member Two',
        role: 'MEMBER',
        member: { create: { phone: '+38344000002' } },
      },
      include: { member: true },
    });
    member1Id = m1.member.id;
    member2Id = m2.member.id;

    adminToken = await login('admin@members.com', 'pass1234');
    librarianToken = await login('librarian@members.com', 'pass1234');
    member1Token = await login('member1@members.com', 'pass1234');
    member2Token = await login('member2@members.com', 'pass1234');
  });

  afterAll(async () => {
    await resetDatabase();
    await disconnect();
  });

  describe('GET /api/v1/members/me', () => {
    test('rejects without a token (401)', async () => {
      const res = await request(app).get('/api/v1/members/me');
      expect(res.status).toBe(401);
    });

    test('returns the current member profile', async () => {
      const res = await request(app)
        .get('/api/v1/members/me')
        .set('Authorization', `Bearer ${member1Token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(member1Id);
      expect(res.body.data.user.email).toBe('member1@members.com');
    });
  });

  describe('GET /api/v1/members', () => {
    test('rejects MEMBER role (403)', async () => {
      const res = await request(app)
        .get('/api/v1/members')
        .set('Authorization', `Bearer ${member1Token}`);
      expect(res.status).toBe(403);
    });

    test('lists members as ADMIN, paginated', async () => {
      const res = await request(app)
        .get('/api/v1/members')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(2);
    });

    test('lists members as LIBRARIAN', async () => {
      const res = await request(app)
        .get('/api/v1/members')
        .set('Authorization', `Bearer ${librarianToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/members/:id', () => {
    test('returns 404 for a non-existent member', async () => {
      const res = await request(app)
        .get('/api/v1/members/999999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    test('rejects a member viewing another member profile (403)', async () => {
      const res = await request(app)
        .get(`/api/v1/members/${member1Id}`)
        .set('Authorization', `Bearer ${member2Token}`);
      expect(res.status).toBe(403);
    });

    test('allows a member to view their own profile', async () => {
      const res = await request(app)
        .get(`/api/v1/members/${member1Id}`)
        .set('Authorization', `Bearer ${member1Token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(member1Id);
    });

    test('allows ADMIN to view any member profile', async () => {
      const res = await request(app)
        .get(`/api/v1/members/${member1Id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(member1Id);
    });
  });

  describe('PUT /api/v1/members/:id', () => {
    test('returns 404 for a non-existent member', async () => {
      const res = await request(app)
        .put('/api/v1/members/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ phone: '+38344999999' });
      expect(res.status).toBe(404);
    });

    test('rejects a member updating another member profile (403)', async () => {
      const res = await request(app)
        .put(`/api/v1/members/${member1Id}`)
        .set('Authorization', `Bearer ${member2Token}`)
        .send({ phone: '+38344999999' });
      expect(res.status).toBe(403);
    });

    test('allows a member to update their own profile', async () => {
      const res = await request(app)
        .put(`/api/v1/members/${member1Id}`)
        .set('Authorization', `Bearer ${member1Token}`)
        .send({ phone: '+38344111111', address: 'Prishtine, Kosove' });
      expect(res.status).toBe(200);
      expect(res.body.data.phone).toBe('+38344111111');
      expect(res.body.data.address).toBe('Prishtine, Kosove');
    });

    test('allows ADMIN to update any member profile', async () => {
      const res = await request(app)
        .put(`/api/v1/members/${member2Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ phone: '+38344222222' });
      expect(res.status).toBe(200);
      expect(res.body.data.phone).toBe('+38344222222');
    });
  });

  describe('DELETE /api/v1/members/:id', () => {
    test('rejects LIBRARIAN role (403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/members/${member2Id}`)
        .set('Authorization', `Bearer ${librarianToken}`);
      expect(res.status).toBe(403);
    });

    test('rejects deleting a member with active loans (409)', async () => {
      const author = await prisma.author.create({ data: { name: 'Member Test Author' } });
      const book = await prisma.book.create({
        data: { title: 'Member Loan Book', isbn: 'MEM-ISBN-001', authorId: author.id, totalCopies: 1, availableCopies: 0 },
      });
      const loan = await prisma.loan.create({
        data: {
          bookId: book.id,
          memberId: member2Id,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
        },
      });

      const res = await request(app)
        .delete(`/api/v1/members/${member2Id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(409);

      await prisma.loan.delete({ where: { id: loan.id } });
      await prisma.book.delete({ where: { id: book.id } });
      await prisma.author.delete({ where: { id: author.id } });
    });

    test('deletes a member as ADMIN (204)', async () => {
      const res = await request(app)
        .delete(`/api/v1/members/${member2Id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);

      const check = await request(app)
        .get(`/api/v1/members/${member2Id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(check.status).toBe(404);
    });
  });
});
