const { execSync } = require('child_process');
const { prisma } = require('../../src/config/prisma');

function applyMigrations() {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env },
  });
}

async function resetDatabase() {
  await prisma.loan.deleteMany();
  await prisma.book.deleteMany();
  await prisma.author.deleteMany();
  await prisma.category.deleteMany();
  await prisma.member.deleteMany();
  await prisma.user.deleteMany();
}

async function disconnect() {
  await prisma.$disconnect();
}

module.exports = { applyMigrations, resetDatabase, disconnect, prisma };
