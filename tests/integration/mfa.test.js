const request = require('supertest');
const speakeasy = require('speakeasy');
const app = require('../../src/app');
const { resetDatabase, disconnect } = require('../helpers/db');

let accessToken;
let mfaSecret;

function totpFor(secret) {
  return speakeasy.totp({ secret, encoding: 'base32' });
}

function wrongCodeFor(secret) {
  const valid = totpFor(secret);
  const firstDigit = valid[0] === '0' ? '1' : '0';
  return firstDigit + valid.slice(1);
}

describe('MFA endpoints', () => {
  beforeAll(async () => {
    await resetDatabase();

    await request(app).post('/api/v1/auth/register').send({
      email: 'mfauser@test.com',
      password: 'password123',
      name: 'MFA User',
    });

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'mfauser@test.com', password: 'password123' });
    accessToken = login.body.data.accessToken;
  });

  afterAll(async () => {
    await resetDatabase();
    await disconnect();
  });

  describe('POST /api/v1/mfa/setup', () => {
    test('rejects without a token (401)', async () => {
      const res = await request(app).post('/api/v1/mfa/setup');
      expect(res.status).toBe(401);
    });

    test('generates a TOTP secret and QR code', async () => {
      const res = await request(app)
        .post('/api/v1/mfa/setup')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.secret).toBeTruthy();
      expect(res.body.data.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
      mfaSecret = res.body.data.secret;
    });
  });

  describe('POST /api/v1/mfa/enable', () => {
    test('rejects an invalid code format (400)', async () => {
      const res = await request(app)
        .post('/api/v1/mfa/enable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: '12' });
      expect(res.status).toBe(400);
    });

    test('rejects a wrong TOTP code (401)', async () => {
      const res = await request(app)
        .post('/api/v1/mfa/enable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: wrongCodeFor(mfaSecret) });
      expect(res.status).toBe(401);
    });

    test('enables MFA with a valid TOTP code', async () => {
      const res = await request(app)
        .post('/api/v1/mfa/enable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: totpFor(mfaSecret) });
      expect(res.status).toBe(200);
    });

    test('rejects setup once MFA is already enabled (409)', async () => {
      const res = await request(app)
        .post('/api/v1/mfa/setup')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(409);
    });
  });

  describe('Login + MFA verification flow', () => {
    let mfaToken;

    test('login returns requiresMfa with an mfaToken (no access tokens yet)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'mfauser@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.data.requiresMfa).toBe(true);
      expect(res.body.data.mfaToken).toBeTruthy();
      expect(res.body.data.accessToken).toBeUndefined();
      mfaToken = res.body.data.mfaToken;
    });

    test('rejects verify with a wrong TOTP code (401)', async () => {
      const res = await request(app)
        .post('/api/v1/mfa/verify')
        .send({ mfaToken, code: wrongCodeFor(mfaSecret) });
      expect(res.status).toBe(401);
    });

    test('completes login with a valid TOTP code', async () => {
      const res = await request(app)
        .post('/api/v1/mfa/verify')
        .send({ mfaToken, code: totpFor(mfaSecret) });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeTruthy();
      expect(res.body.data.refreshToken).toBeTruthy();
      expect(res.body.data.user.email).toBe('mfauser@test.com');
      accessToken = res.body.data.accessToken;
    });
  });

  describe('POST /api/v1/mfa/disable', () => {
    test('rejects a wrong TOTP code (401)', async () => {
      const res = await request(app)
        .post('/api/v1/mfa/disable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: wrongCodeFor(mfaSecret) });
      expect(res.status).toBe(401);
    });

    test('disables MFA with a valid TOTP code', async () => {
      const res = await request(app)
        .post('/api/v1/mfa/disable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: totpFor(mfaSecret) });
      expect(res.status).toBe(200);
    });

    test('rejects disabling MFA again once already disabled (400)', async () => {
      const res = await request(app)
        .post('/api/v1/mfa/disable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: totpFor(mfaSecret) });
      expect(res.status).toBe(400);
    });
  });
});
