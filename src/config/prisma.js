const { PrismaClient } = require('@prisma/client');
const config = require('./env');
const logger = require('./logger');

const prisma = new PrismaClient({
  log: config.env === 'development' ? ['warn', 'error'] : ['error'],
});

prisma.$on?.('error', (e) => logger.error('Prisma error', e));

async function disconnectPrisma() {
  await prisma.$disconnect();
}

module.exports = { prisma, disconnectPrisma };
