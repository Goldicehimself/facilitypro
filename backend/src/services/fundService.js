// Fund Request Service
const FundRequest = require('../models/FundRequest');
const financeService = require('./financeService');
const { inferExpenseCategory } = require('../utils/fundCategory');
const { NotFoundError, BadRequestError } = require('../utils/errorHandler');

const createFundRequest = async (organizationId, userId, payload) => {
  if (!payload.amount || payload.amount <= 0) {
    throw new BadRequestError('Amount must be greater than zero');
  }

  const fund = new FundRequest({
    organization: organizationId,
    requestedBy: userId,
    amount: payload.amount,
    purpose: payload.purpose,
    notes: payload.notes
  });

  await fund.save();
  return fund;
};

const listFunds = async (organizationId, filters = {}) => {
  const query = { organization: organizationId };
  if (filters.status) query.status = filters.status;
  if (filters.from || filters.to) {
    query.createdAt = {};
    if (filters.from) query.createdAt.$gte = new Date(filters.from);
    if (filters.to) query.createdAt.$lte = new Date(filters.to);
  }
  return FundRequest.find(query)
    .sort({ createdAt: -1 })
    .populate('requestedBy', 'firstName lastName email')
    .populate('decidedBy', 'firstName lastName email');
};

const listMyFunds = async (organizationId, userId, filters = {}) => {
  const query = { organization: organizationId, requestedBy: userId };
  if (filters.status) query.status = filters.status;
  if (filters.from || filters.to) {
    query.createdAt = {};
    if (filters.from) query.createdAt.$gte = new Date(filters.from);
    if (filters.to) query.createdAt.$lte = new Date(filters.to);
  }
  return FundRequest.find(query)
    .sort({ createdAt: -1 })
    .populate('requestedBy', 'firstName lastName email')
    .populate('decidedBy', 'firstName lastName email');
};

const approveFund = async (organizationId, fundId, adminId) => {
  const fund = await FundRequest.findOne({ _id: fundId, organization: organizationId });
  if (!fund) throw new NotFoundError('Fund request');
  if (fund.status !== 'pending') throw new BadRequestError('Request already processed');

  fund.status = 'approved';
  fund.decidedBy = adminId;
  fund.decidedAt = new Date();
  await fund.save();

  if (!fund.expenseId) {
    const category = inferExpenseCategory({ purpose: fund.purpose, notes: fund.notes });
    const notes = [
      fund.purpose ? `Fund request: ${fund.purpose}` : 'Fund request approved',
      fund.notes ? `Notes: ${fund.notes}` : null
    ].filter(Boolean).join(' | ');
    const expense = await financeService.createExpense(organizationId, fund.requestedBy, {
      category,
      vendor: '',
      amount: fund.amount,
      status: 'approved',
      date: fund.decidedAt,
      notes
    });
    fund.expenseId = expense._id;
    await fund.save();
  }

  await fund.populate('requestedBy', 'firstName lastName email');
  await fund.populate('decidedBy', 'firstName lastName email');
  return fund;
};

const rejectFund = async (organizationId, fundId, adminId) => {
  const fund = await FundRequest.findOne({ _id: fundId, organization: organizationId });
  if (!fund) throw new NotFoundError('Fund request');
  if (fund.status !== 'pending') throw new BadRequestError('Request already processed');

  fund.status = 'rejected';
  fund.decidedBy = adminId;
  fund.decidedAt = new Date();
  await fund.save();
  await fund.populate('requestedBy', 'firstName lastName email');
  await fund.populate('decidedBy', 'firstName lastName email');
  return fund;
};

module.exports = {
  createFundRequest,
  listFunds,
  listMyFunds,
  approveFund,
  rejectFund
};
