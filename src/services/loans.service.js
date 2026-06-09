const { prisma } = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const LOAN_DURATION_DAYS = 14;
const MAX_ACTIVE_LOANS_PER_MEMBER = 5;

const loanInclude = {
  book: { include: { author: true } },
  member: { include: { user: { select: { id: true, name: true, email: true } } } },
};

async function listLoans({ page = 1, limit = 10, status, memberId, bookId }) {
  const where = {};
  if (status) where.status = status;
  if (memberId) where.memberId = Number(memberId);
  if (bookId) where.bookId = Number(bookId);

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    prisma.loan.findMany({
      where,
      include: loanInclude,
      skip,
      take: Number(limit),
      orderBy: { loanDate: 'desc' },
    }),
    prisma.loan.count({ where }),
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

async function getLoanById(id) {
  const loan = await prisma.loan.findUnique({
    where: { id: Number(id) },
    include: loanInclude,
  });
  if (!loan) throw ApiError.notFound('Loan not found');
  return loan;
}

async function getMyLoans(userId) {
  const member = await prisma.member.findUnique({ where: { userId: Number(userId) } });
  if (!member) throw ApiError.notFound('You do not have a member profile');
  return prisma.loan.findMany({
    where: { memberId: member.id },
    include: loanInclude,
    orderBy: { loanDate: 'desc' },
  });
}

async function borrowBook({ bookId, memberId }) {
  return prisma.$transaction(async (tx) => {
    const book = await tx.book.findUnique({ where: { id: Number(bookId) } });
    if (!book) throw ApiError.notFound('Book not found');
    if (book.availableCopies < 1) throw ApiError.conflict('No available copies of this book');

    const member = await tx.member.findUnique({ where: { id: Number(memberId) } });
    if (!member) throw ApiError.notFound('Member not found');

    const activeCount = await tx.loan.count({
      where: { memberId: member.id, status: 'ACTIVE' },
    });
    if (activeCount >= MAX_ACTIVE_LOANS_PER_MEMBER) {
      throw ApiError.conflict(`Member already has ${MAX_ACTIVE_LOANS_PER_MEMBER} active loans (max)`);
    }

    const existing = await tx.loan.findFirst({
      where: { memberId: member.id, bookId: book.id, status: 'ACTIVE' },
    });
    if (existing) throw ApiError.conflict('Member already has this book on loan');

    const dueDate = new Date(Date.now() + LOAN_DURATION_DAYS * 24 * 60 * 60 * 1000);

    await tx.book.update({
      where: { id: book.id },
      data: { availableCopies: { decrement: 1 } },
    });

    return tx.loan.create({
      data: {
        bookId: book.id,
        memberId: member.id,
        dueDate,
        status: 'ACTIVE',
      },
      include: loanInclude,
    });
  });
}

async function returnBook(loanId) {
  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.findUnique({ where: { id: Number(loanId) } });
    if (!loan) throw ApiError.notFound('Loan not found');
    if (loan.status === 'RETURNED') throw ApiError.conflict('Loan is already returned');

    await tx.book.update({
      where: { id: loan.bookId },
      data: { availableCopies: { increment: 1 } },
    });

    return tx.loan.update({
      where: { id: loan.id },
      data: { status: 'RETURNED', returnDate: new Date() },
      include: loanInclude,
    });
  });
}

async function markOverdueLoans() {
  const result = await prisma.loan.updateMany({
    where: { status: 'ACTIVE', dueDate: { lt: new Date() } },
    data: { status: 'OVERDUE' },
  });
  return result.count;
}

module.exports = {
  listLoans,
  getLoanById,
  getMyLoans,
  borrowBook,
  returnBook,
  markOverdueLoans,
  LOAN_DURATION_DAYS,
  MAX_ACTIVE_LOANS_PER_MEMBER,
};
