// Finance Validation Schemas
const Joi = require('joi');

const invoiceStatusValues = ['draft', 'pending', 'paid', 'overdue', 'cancelled'];
const expenseStatusValues = ['pending', 'approved', 'rejected'];

const createInvoiceSchema = Joi.object({
  clientName: Joi.string().optional().allow(''),
  vendor: Joi.string().optional().allow(null),
  workOrder: Joi.string().optional().allow(null),
  amount: Joi.number().required().min(0),
  currency: Joi.string().optional().max(5),
  status: Joi.string().optional().valid(...invoiceStatusValues),
  issueDate: Joi.date().optional(),
  dueDate: Joi.date().optional(),
  description: Joi.string().optional().allow('')
});

const updateInvoiceSchema = Joi.object({
  clientName: Joi.string().optional().allow(''),
  vendor: Joi.string().optional().allow(null),
  workOrder: Joi.string().optional().allow(null),
  amount: Joi.number().optional().min(0),
  currency: Joi.string().optional().max(5),
  status: Joi.string().optional().valid(...invoiceStatusValues),
  issueDate: Joi.date().optional(),
  dueDate: Joi.date().optional(),
  description: Joi.string().optional().allow('')
}).min(1);

const invoiceListQuerySchema = Joi.object({
  page: Joi.number().optional().min(1),
  limit: Joi.number().optional().min(1).max(200),
  status: Joi.string().optional().valid(...invoiceStatusValues),
  vendor: Joi.string().optional().allow(''),
  search: Joi.string().optional().allow(''),
  from: Joi.date().optional(),
  to: Joi.date().optional()
});

const createExpenseSchema = Joi.object({
  category: Joi.string().required().min(2).max(120),
  vendor: Joi.string().optional().allow(''),
  amount: Joi.number().required().min(0),
  currency: Joi.string().optional().max(5),
  date: Joi.date().optional(),
  status: Joi.string().optional().valid(...expenseStatusValues),
  notes: Joi.string().optional().allow(''),
  attachments: Joi.array().items(Joi.string()).optional()
});

const updateExpenseSchema = Joi.object({
  category: Joi.string().optional().min(2).max(120),
  vendor: Joi.string().optional().allow(''),
  amount: Joi.number().optional().min(0),
  currency: Joi.string().optional().max(5),
  date: Joi.date().optional(),
  status: Joi.string().optional().valid(...expenseStatusValues),
  notes: Joi.string().optional().allow(''),
  attachments: Joi.array().items(Joi.string()).optional()
}).min(1);

const expenseListQuerySchema = Joi.object({
  page: Joi.number().optional().min(1),
  limit: Joi.number().optional().min(1).max(200),
  status: Joi.string().optional().valid(...expenseStatusValues),
  search: Joi.string().optional().allow(''),
  from: Joi.date().optional(),
  to: Joi.date().optional()
});

module.exports = {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceListQuerySchema,
  createExpenseSchema,
  updateExpenseSchema,
  expenseListQuerySchema
};
