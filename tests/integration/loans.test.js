const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../src/app');
const { resetDatabase, disconnect, prisma } = require('../helpers/db');

let memberToken;
let adminToken;
let bookId;

async function login(email, password) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.data.accessToken;
}

describe('Loan flow', () => {
  beforeAll(async () => {
    await resetDatabase();

    const hashed = await bcrypt.hash('pass1234', 4);
    await prisma.user.create({
      data: { email: 'admin@t.com', password: hashed, name: 'A', role: 'ADMIN' },
    });
    await prisma.user.create({
      data: {
        email: 'member@t.com',
        password: hashed,
        name: 'M',
        role: 'MEMBER',
        member: { create: {} },
      },
    });

    const author = await prisma.author.create({ data: { name: 'Test Author' } });
    const book = await prisma.book.create({
      data: { title: 'Test Book', isbn: 'TEST-1', authorId: author.id, totalCopies: 1, availableCopies: 1 },
    });
    bookId = book.id;

    memberToken = await login('member@t.com', 'pass1234');
    adminToken = await login('admin@t.com', 'pass1234');
  });

  afterAll(async () => {
    await resetDatabase();
    await disconnect();
  });

  test('member can borrow an available book; copies decremented', async () => {
    const res = await request(app)
      .post('/api/v1/loans/borrow')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ bookId });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.book.availableCopies).toBe(0);
  });

  test('borrowing the same book twice fails with 409', async () => {
    const res = await request(app)
      .post('/api/v1/loans/borrow')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ bookId });
    expect(res.status).toBe(409);
  });

  test('borrowing when no copies available fails with 409', async () => {
    await prisma.user.create({
      data: {
        email: 'm2@t.com',
        password: await bcrypt.hash('pass1234', 4),
        name: 'M2',
        role: 'MEMBER',
        member: { create: {} },
      },
    });
    const token = await login('m2@t.com', 'pass1234');
    const res = await request(app)
      .post('/api/v1/loans/borrow')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId });
    expect(res.status).toBe(409);
  });

  test('member returns the book and copies are restored', async () => {
    const myLoans = await request(app)
      .get('/api/v1/loans/me')
      .set('Authorization', `Bearer ${memberToken}`);
    const loanId = myLoans.body.data[0].id;

    const res = await request(app)
      .post(`/api/v1/loans/${loanId}/return`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('RETURNED');
    expect(res.body.data.returnDate).toBeTruthy();

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    expect(book.availableCopies).toBe(1);
  });

  test('cannot return an already-returned loan', async () => {
    const myLoans = await prisma.loan.findFirst({ where: { status: 'RETURNED' } });
    const res = await request(app)
      .post(`/api/v1/loans/${myLoans.id}/return`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(409);
  });

  test('admin can list all loans', async () => {
    const res = await request(app)
      .get('/api/v1/loans')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBeGreaterThan(0);
  });

  test('member cannot list all loans (403)', async () => {
    const res = await request(app)
      .get('/api/v1/loans')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(403);
  });
});
