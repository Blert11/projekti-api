const bcrypt = require('bcryptjs');
const { prisma } = require('../config/prisma');
const config = require('../config/env');
const { signAccessToken, signRefreshToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

async function register({ email, password, name, phone, address }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict('Email already registered');

  const hashed = await bcrypt.hash(password, config.bcryptRounds);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name,
      role: 'MEMBER',
      member: { create: { phone, address } },
    },
    include: { member: true },
  });

  return sanitize(user);
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw ApiError.unauthorized('Invalid email or password');

  const tokenPayload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  return { user: sanitize(user), accessToken, refreshToken };
}

async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { member: true },
  });
  if (!user) throw ApiError.notFound('User not found');
  return sanitize(user);
}

function sanitize(user) {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
}

module.exports = { register, login, getCurrentUser };
