const asyncHandler = require('../utils/asyncHandler');
const svc = require('../services/loans.service');
const { prisma } = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { logAudit } = require('../utils/audit');

const list = asyncHandler(async (req, res) => {
  const result = await svc.listLoans(req.query);
  res.json({ success: true, ...result });
});

const get = asyncHandler(async (req, res) => {
  const loan = await svc.getLoanById(req.params.id);
  if (req.user.role === 'MEMBER') {
    const member = await prisma.member.findUnique({ where: { userId: req.user.id } });
    if (!member || loan.memberId !== member.id) {
      throw ApiError.forbidden('You can only view your own loans');
    }
  }
  res.json({ success: true, data: loan });
});

const myLoans = asyncHandler(async (req, res) => {
  const loans = await svc.getMyLoans(req.user.id);
  res.json({ success: true, data: loans });
});

const borrow = asyncHandler(async (req, res) => {
  let { bookId, memberId } = req.body;

  if (req.user.role === 'MEMBER') {
    const member = await prisma.member.findUnique({ where: { userId: req.user.id } });
    if (!member) throw ApiError.badRequest('No member profile found for this user');
    memberId = member.id;
  } else if (!memberId) {
    throw ApiError.badRequest('memberId is required when borrowing on behalf of a member');
  }

  const loan = await svc.borrowBook({ bookId, memberId });
  logAudit(req, {
    action: 'loan.borrow',
    resource: 'loan',
    resourceId: loan.id,
    meta: { bookId: loan.bookId, memberId: loan.memberId },
  });
  res.status(201).json({ success: true, data: loan });
});

const returnLoan = asyncHandler(async (req, res) => {
  const loan = await svc.getLoanById(req.params.id);
  if (req.user.role === 'MEMBER') {
    const member = await prisma.member.findUnique({ where: { userId: req.user.id } });
    if (!member || loan.memberId !== member.id) {
      throw ApiError.forbidden('You can only return your own loans');
    }
  }
  const updated = await svc.returnBook(req.params.id);
  logAudit(req, { action: 'loan.return', resource: 'loan', resourceId: updated.id });
  res.json({ success: true, data: updated });
});

const markOverdue = asyncHandler(async (req, res) => {
  const count = await svc.markOverdueLoans();
  logAudit(req, { action: 'loan.mark_overdue', resource: 'loan', meta: { count } });
  res.json({ success: true, data: { markedOverdue: count } });
});

module.exports = { list, get, myLoans, borrow, returnLoan, markOverdue };
