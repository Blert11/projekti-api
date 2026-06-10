const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { prisma } = require('../config/prisma');
const { signAccessToken, signRefreshToken, verifyToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

function verifyCode(secret, code) {
  return speakeasy.totp.verify({ secret, encoding: 'base32', token: code, window: 1 });
}

async function setupMfa(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User not found');
  if (user.mfaEnabled) throw ApiError.conflict('MFA is already enabled');

  const secret = speakeasy.generateSecret({
    name: `Library API (${user.email})`,
    issuer: 'Library API',
  });
  const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

  await prisma.user.update({ where: { id: userId }, data: { mfaSecret: secret.base32 } });

  return { secret: secret.base32, qrCodeDataUrl, otpAuthUrl: secret.otpauth_url };
}

async function enableMfa(userId, code) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User not found');
  if (user.mfaEnabled) throw ApiError.conflict('MFA is already enabled');
  if (!user.mfaSecret) throw ApiError.badRequest('Run /mfa/setup first');

  if (!verifyCode(user.mfaSecret, code)) throw ApiError.unauthorized('Invalid MFA code');

  await prisma.user.update({ where: { id: userId }, data: { mfaEnabled: true } });
  return { message: 'MFA enabled successfully' };
}

async function disableMfa(userId, code) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User not found');
  if (!user.mfaEnabled) throw ApiError.badRequest('MFA is not enabled');

  if (!verifyCode(user.mfaSecret, code)) throw ApiError.unauthorized('Invalid MFA code');

  await prisma.user.update({ where: { id: userId }, data: { mfaEnabled: false, mfaSecret: null } });
  return { message: 'MFA disabled successfully' };
}

async function verifyMfaLogin({ mfaToken, code }) {
  let payload;
  try {
    payload = verifyToken(mfaToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired MFA token');
  }

  if (payload.type !== 'mfa_pending') throw ApiError.unauthorized('Invalid MFA token');

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    throw ApiError.unauthorized('Invalid MFA state');
  }

  if (!verifyCode(user.mfaSecret, code)) throw ApiError.unauthorized('Invalid MFA code');

  const tokenPayload = { sub: user.id, email: user.email, role: user.role };
  return {
    user: sanitize(user),
    accessToken: signAccessToken(tokenPayload),
    refreshToken: signRefreshToken(tokenPayload),
  };
}

function sanitize(user) {
  const { password: _password, mfaSecret: _mfaSecret, ...rest } = user;
  return rest;
}

module.exports = { setupMfa, enableMfa, disableMfa, verifyMfaLogin };
