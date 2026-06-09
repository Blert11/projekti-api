const jwt = require('jsonwebtoken');
const config = require('../config/env');

function signAccessToken(payload) {
  return jwt.sign({ ...payload, type: 'access' }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

function signRefreshToken(payload) {
  return jwt.sign({ ...payload, type: 'refresh' }, config.jwt.secret, { expiresIn: config.jwt.refreshExpiresIn });
}

function signMfaToken(payload) {
  return jwt.sign({ ...payload, type: 'mfa_pending' }, config.jwt.secret, { expiresIn: '5m' });
}

function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

module.exports = { signAccessToken, signRefreshToken, signMfaToken, verifyToken };
