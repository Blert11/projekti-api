const { signAccessToken, verifyToken } = require('../../src/utils/jwt');

describe('jwt utility', () => {
  test('signs and verifies a payload round-trip', () => {
    const token = signAccessToken({ sub: 1, role: 'ADMIN' });
    const decoded = verifyToken(token);
    expect(decoded.sub).toBe(1);
    expect(decoded.role).toBe('ADMIN');
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  test('verifyToken throws on invalid token', () => {
    expect(() => verifyToken('not.a.valid.token')).toThrow();
  });

  test('verifyToken throws on tampered signature', () => {
    const token = signAccessToken({ sub: 1 });
    const tampered = token.slice(0, -2) + 'xx';
    expect(() => verifyToken(tampered)).toThrow();
  });
});
