const { prisma } = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const memberInclude = {
  user: { select: { id: true, email: true, name: true, role: true, createdAt: true } },
};

async function listMembers({ page = 1, limit = 10, search }) {
  const where = search
    ? {
        OR: [
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { phone: { contains: search } },
        ],
      }
    : {};

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    prisma.member.findMany({
      where,
      include: memberInclude,
      skip,
      take: Number(limit),
      orderBy: { membershipDate: 'desc' },
    }),
    prisma.member.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  };
}

async function getMemberById(id) {
  const member = await prisma.member.findUnique({
    where: { id: Number(id) },
    include: { ...memberInclude, loans: { include: { book: true } } },
  });
  if (!member) throw ApiError.notFound('Member not found');
  return member;
}

async function getMemberByUserId(userId) {
  const member = await prisma.member.findUnique({
    where: { userId: Number(userId) },
    include: { ...memberInclude, loans: { include: { book: true } } },
  });
  if (!member) throw ApiError.notFound('Member profile not found');
  return member;
}

async function updateMember(id, data) {
  await getMemberById(id);
  return prisma.member.update({
    where: { id: Number(id) },
    data,
    include: memberInclude,
  });
}

async function deleteMember(id) {
  const member = await getMemberById(id);
  const activeLoans = await prisma.loan.count({
    where: { memberId: Number(id), status: 'ACTIVE' },
  });
  if (activeLoans > 0) throw ApiError.conflict('Member has active loans');
  await prisma.user.delete({ where: { id: member.userId } });
}

module.exports = { listMembers, getMemberById, getMemberByUserId, updateMember, deleteMember };
