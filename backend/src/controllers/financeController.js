// Finance Controller
const financeService = require('../services/financeService');
const response = require('../utils/response');
const { AuthorizationError } = require('../utils/errorHandler');
const Vendor = require('../models/Vendor');

const ensureFinanceAccess = (user, allowVendorRead = false) => {
  if (!user) {
    throw new AuthorizationError('Finance access required');
  }
  if (['admin', 'finance'].includes(user.role)) return;
  if (allowVendorRead && user.role === 'vendor') return;
  throw new AuthorizationError('Finance access required');
};

const ensureVendorMatchesUser = async (organizationId, vendorId, userEmail) => {
  if (!vendorId) {
    throw new AuthorizationError('Vendor access required');
  }
  const vendor = await Vendor.findOne({ _id: vendorId, organization: organizationId })
    .select('email')
    .lean();
  if (!vendor || !vendor.email || vendor.email.toLowerCase() !== String(userEmail || '').toLowerCase()) {
    throw new AuthorizationError('Vendor access required');
  }
};

const getInvoices = async (req, res, next) => {
  try {
    ensureFinanceAccess(req.user, true);
    const { page = 1, limit = 20, ...filters } = req.validatedQuery || req.query;
    if (req.user.role === 'vendor') {
      await ensureVendorMatchesUser(req.user.organization, filters.vendor, req.user.email);
      filters.vendor = filters.vendor;
    }
    const result = await financeService.listInvoices(req.user.organization, filters, parseInt(page), parseInt(limit));
    response.success(res, 'Invoices retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

const getInvoiceById = async (req, res, next) => {
  try {
    ensureFinanceAccess(req.user, true);
    const invoice = await financeService.getInvoiceById(req.user.organization, req.params.id);
    if (req.user.role === 'vendor') {
      await ensureVendorMatchesUser(req.user.organization, invoice.vendor?._id || invoice.vendor, req.user.email);
    }
    response.success(res, 'Invoice retrieved successfully', invoice);
  } catch (error) {
    next(error);
  }
};

const createInvoice = async (req, res, next) => {
  try {
    ensureFinanceAccess(req.user);
    const invoice = await financeService.createInvoice(req.user.organization, req.user.id, req.validatedData || req.body);
    response.created(res, 'Invoice created successfully', invoice);
  } catch (error) {
    next(error);
  }
};

const updateInvoice = async (req, res, next) => {
  try {
    ensureFinanceAccess(req.user);
    const invoice = await financeService.updateInvoice(req.user.organization, req.params.id, req.validatedData || req.body);
    response.success(res, 'Invoice updated successfully', invoice);
  } catch (error) {
    next(error);
  }
};

const deleteInvoice = async (req, res, next) => {
  try {
    ensureFinanceAccess(req.user);
    const invoice = await financeService.deleteInvoice(req.user.organization, req.params.id);
    response.success(res, 'Invoice deleted successfully', invoice);
  } catch (error) {
    next(error);
  }
};

const getExpenses = async (req, res, next) => {
  try {
    ensureFinanceAccess(req.user);
    const { page = 1, limit = 20, ...filters } = req.validatedQuery || req.query;
    const result = await financeService.listExpenses(req.user.organization, filters, parseInt(page), parseInt(limit));
    response.success(res, 'Expenses retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

const getExpenseById = async (req, res, next) => {
  try {
    ensureFinanceAccess(req.user);
    const expense = await financeService.getExpenseById(req.user.organization, req.params.id);
    response.success(res, 'Expense retrieved successfully', expense);
  } catch (error) {
    next(error);
  }
};

const createExpense = async (req, res, next) => {
  try {
    ensureFinanceAccess(req.user);
    const expense = await financeService.createExpense(req.user.organization, req.user.id, req.validatedData || req.body);
    response.created(res, 'Expense created successfully', expense);
  } catch (error) {
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    ensureFinanceAccess(req.user);
    const expense = await financeService.updateExpense(req.user.organization, req.params.id, req.validatedData || req.body);
    response.success(res, 'Expense updated successfully', expense);
  } catch (error) {
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    ensureFinanceAccess(req.user);
    const expense = await financeService.deleteExpense(req.user.organization, req.params.id);
    response.success(res, 'Expense deleted successfully', expense);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense
};
