// Finance Service
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const { NotFoundError } = require('../utils/errorHandler');

const buildSearchFilter = (filters, fields = []) => {
  if (!filters.search) return null;
  const escaped = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'i');
  return { $or: fields.map((field) => ({ [field]: regex })) };
};

const buildDateRange = (filters, field) => {
  if (!filters.from && !filters.to) return null;
  const range = {};
  if (filters.from) range.$gte = new Date(filters.from);
  if (filters.to) range.$lte = new Date(filters.to);
  return { [field]: range };
};

const listInvoices = async (organizationId, filters = {}, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const scopedFilters = { organization: organizationId };

  if (filters.status) scopedFilters.status = filters.status;
  if (filters.vendor) scopedFilters.vendor = filters.vendor;

  const searchFilter = buildSearchFilter(filters, ['clientName', 'description']);
  const dateFilter = buildDateRange(filters, 'issueDate');
  if (searchFilter) Object.assign(scopedFilters, searchFilter);
  if (dateFilter) Object.assign(scopedFilters, dateFilter);

  const query = Invoice.find(scopedFilters)
    .populate('vendor workOrder createdBy')
    .skip(skip)
    .limit(limit)
    .sort({ issueDate: -1 });

  const [invoices, total] = await Promise.all([
    query.exec(),
    Invoice.countDocuments(scopedFilters)
  ]);

  return {
    invoices,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getInvoiceById = async (organizationId, id) => {
  const invoice = await Invoice.findOne({ _id: id, organization: organizationId })
    .populate('vendor workOrder createdBy');
  if (!invoice) {
    throw new NotFoundError('Invoice');
  }
  return invoice;
};

const createInvoice = async (organizationId, userId, data) => {
  const payload = {
    ...data,
    organization: organizationId,
    createdBy: userId
  };
  const invoice = new Invoice(payload);
  await invoice.save();
  await invoice.populate('vendor workOrder createdBy');
  return invoice;
};

const updateInvoice = async (organizationId, id, data) => {
  const invoice = await Invoice.findOneAndUpdate(
    { _id: id, organization: organizationId },
    data,
    { new: true, runValidators: true }
  ).populate('vendor workOrder createdBy');
  if (!invoice) {
    throw new NotFoundError('Invoice');
  }
  return invoice;
};

const deleteInvoice = async (organizationId, id) => {
  const invoice = await Invoice.findOneAndDelete({ _id: id, organization: organizationId });
  if (!invoice) {
    throw new NotFoundError('Invoice');
  }
  return invoice;
};

const listExpenses = async (organizationId, filters = {}, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const scopedFilters = { organization: organizationId };

  if (filters.status) scopedFilters.status = filters.status;

  const searchFilter = buildSearchFilter(filters, ['category', 'vendor', 'notes']);
  const dateFilter = buildDateRange(filters, 'date');
  if (searchFilter) Object.assign(scopedFilters, searchFilter);
  if (dateFilter) Object.assign(scopedFilters, dateFilter);

  const query = Expense.find(scopedFilters)
    .populate('submittedBy')
    .skip(skip)
    .limit(limit)
    .sort({ date: -1 });

  const [expenses, total] = await Promise.all([
    query.exec(),
    Expense.countDocuments(scopedFilters)
  ]);

  return {
    expenses,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getExpenseById = async (organizationId, id) => {
  const expense = await Expense.findOne({ _id: id, organization: organizationId })
    .populate('submittedBy');
  if (!expense) {
    throw new NotFoundError('Expense');
  }
  return expense;
};

const createExpense = async (organizationId, userId, data) => {
  const payload = {
    ...data,
    organization: organizationId,
    submittedBy: userId
  };
  const expense = new Expense(payload);
  await expense.save();
  await expense.populate('submittedBy');
  return expense;
};

const updateExpense = async (organizationId, id, data) => {
  const expense = await Expense.findOneAndUpdate(
    { _id: id, organization: organizationId },
    data,
    { new: true, runValidators: true }
  ).populate('submittedBy');
  if (!expense) {
    throw new NotFoundError('Expense');
  }
  return expense;
};

const deleteExpense = async (organizationId, id) => {
  const expense = await Expense.findOneAndDelete({ _id: id, organization: organizationId });
  if (!expense) {
    throw new NotFoundError('Expense');
  }
  return expense;
};

module.exports = {
  listInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  listExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense
};
