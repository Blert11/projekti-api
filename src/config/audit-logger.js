const winston = require('winston');

const { combine, timestamp, json } = winston.format;

const auditLogger = winston.createLogger({
  level: 'info',
  format: combine(timestamp(), json()),
  defaultMeta: { service: 'library-api-audit' },
  transports: [new winston.transports.File({ filename: 'logs/audit.log' })],
});

module.exports = auditLogger;
