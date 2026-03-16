// Finance Routes
const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { protect, requireScope } = require('../middleware/auth');
const { validateRequest, validateQuery } = require('../middleware/validation');
const {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceListQuerySchema,
  createExpenseSchema,
  updateExpenseSchema,
  expenseListQuerySchema
} = require('../validators/financeValidator');

router.get('/invoices', protect, requireScope('finance:read'), validateQuery(invoiceListQuerySchema), financeController.getInvoices);
router.get('/invoices/:id', protect, requireScope('finance:read'), financeController.getInvoiceById);
router.post('/invoices', protect, requireScope('finance:write'), validateRequest(createInvoiceSchema), financeController.createInvoice);
router.put('/invoices/:id', protect, requireScope('finance:write'), validateRequest(updateInvoiceSchema), financeController.updateInvoice);
router.delete('/invoices/:id', protect, requireScope('finance:write'), financeController.deleteInvoice);

router.get('/expenses', protect, requireScope('finance:read'), validateQuery(expenseListQuerySchema), financeController.getExpenses);
router.get('/expenses/:id', protect, requireScope('finance:read'), financeController.getExpenseById);
router.post('/expenses', protect, requireScope('finance:write'), validateRequest(createExpenseSchema), financeController.createExpense);
router.put('/expenses/:id', protect, requireScope('finance:write'), validateRequest(updateExpenseSchema), financeController.updateExpense);
router.delete('/expenses/:id', protect, requireScope('finance:write'), financeController.deleteExpense);

module.exports = router;
