const request = require('supertest');
const app = require('../../src/app');
const { resetDatabase, disconnect, prisma } = require('../helpers/db');

describe('Auth endpoints', () => {
  beforeAll(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await resetDatabase();
    await disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    test('creates a new MEMBER user with member profile', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'password123',
          name: 'New User',
          phone: '+38344000111',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('newuser@test.com');
      expect(res.body.data.role).toBe('MEMBER');
      expect(res.body.data.password).toBeUndefined();
      expect(res.body.data.member).toBeDefined();
      expect(res.body.data.member.phone).toBe('+38344000111');
    });

    test('rejects duplicate email with 409', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'newuser@test.com', password: 'password123', name: 'Dup' });
      expect(res.status).toBe(409);
    });

    test('rejects invalid input with 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'bad', password: '123', name: '' });
      expect(res.status).toBe(400);
      expect(res.body.error.details.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    test('returns JWT for valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'newuser@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeTruthy();
      expect(res.body.data.refreshToken).toBeTruthy();
      expect(res.body.data.user.email).toBe('newuser@test.com');
    });

    test('rejects wrong password with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'newuser@test.com', password: 'wrongpass' });
      expect(res.status).toBe(401);
    });

    test('rejects unknown email with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'ghost@test.com', password: 'password123' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    test('returns 401 without a token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    test('returns current user with valid token', async () => {
      const login = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'newuser@test.com', password: 'password123' });
      const token = login.body.data.accessToken;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('newuser@test.com');
    });
  });
});
