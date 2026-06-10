const auditLogger = require('../config/audit-logger');

/**
 * Records a security-relevant user action (auth events, MFA changes, and
 * mutations on books/authors/categories/members/loans) for security auditing.
 */
function logAudit(req, { action, outcome = 'success', resource, resourceId, actorEmail, reason, meta }) {
  auditLogger.info('audit_event', {
    action,
    outcome,
    userId: req.user?.id ?? null,
    email: req.user?.email ?? actorEmail ?? null,
    role: req.user?.role ?? null,
    ip: req.ip,
    resource: resource ?? null,
    resourceId: resourceId ?? null,
    ...(reason && { reason }),
    ...(meta && { meta }),
  });
}

module.exports = { logAudit };
