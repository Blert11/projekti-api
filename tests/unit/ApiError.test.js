const ApiError = require('../../src/utils/ApiError');

describe('ApiError', () => {
  test('badRequest creates 400 error', () => {
    const err = ApiError.badRequest('bad');
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('bad');
    expect(err.isOperational).toBe(true);
  });

  test('unauthorized creates 401 error', () => {
    expect(ApiError.unauthorized().statusCode).toBe(401);
  });

  test('forbidden creates 403 error', () => {
    expect(ApiError.forbidden().statusCode).toBe(403);
  });

  test('notFound creates 404 error', () => {
    expect(ApiError.notFound('x').statusCode).toBe(404);
  });

  test('conflict creates 409 error', () => {
    expect(ApiError.conflict().statusCode).toBe(409);
  });

  test('details are preserved', () => {
    const err = ApiError.badRequest('Validation', [{ field: 'email' }]);
    expect(err.details).toEqual([{ field: 'email' }]);
  });
});
