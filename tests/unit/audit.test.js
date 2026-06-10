jest.mock('../../src/config/audit-logger', () => ({ info: jest.fn() }));

const auditLogger = require('../../src/config/audit-logger');
const { logAudit } = require('../../src/utils/audit');

describe('logAudit', () => {
  afterEach(() => jest.clearAllMocks());

  test('logs audit event with user context from req', () => {
    const req = { user: { id: 1, email: 'admin@test.com', role: 'ADMIN' }, ip: '127.0.0.1' };

    logAudit(req, { action: 'book.create', resource: 'book', resourceId: 5 });

    expect(auditLogger.info).toHaveBeenCalledWith(
      'audit_event',
      expect.objectContaining({
        action: 'book.create',
        outcome: 'success',
        userId: 1,
        email: 'admin@test.com',
        role: 'ADMIN',
        ip: '127.0.0.1',
        resource: 'book',
        resourceId: 5,
      })
    );
  });

  test('falls back to actorEmail and null fields when req.user is absent', () => {
    const req = { ip: '10.0.0.1' };

    logAudit(req, {
      action: 'auth.login',
      outcome: 'failure',
      resource: 'user',
      actorEmail: 'ghost@test.com',
      reason: 'Invalid email or password',
    });

    expect(auditLogger.info).toHaveBeenCalledWith(
      'audit_event',
      expect.objectContaining({
        action: 'auth.login',
        outcome: 'failure',
        userId: null,
        email: 'ghost@test.com',
        role: null,
        reason: 'Invalid email or password',
      })
    );
  });

  test('includes meta when provided and omits it otherwise', () => {
    const req = { user: { id: 2 }, ip: '127.0.0.1' };

    logAudit(req, { action: 'loan.borrow', resource: 'loan', resourceId: 10, meta: { bookId: 3, memberId: 4 } });
    expect(auditLogger.info).toHaveBeenCalledWith(
      'audit_event',
      expect.objectContaining({ meta: { bookId: 3, memberId: 4 } })
    );

    logAudit(req, { action: 'loan.mark_overdue', resource: 'loan' });
    const [, payload] = auditLogger.info.mock.calls[1];
    expect(payload.meta).toBeUndefined();
    expect(payload.reason).toBeUndefined();
  });
});
