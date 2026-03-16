import axiosInstance from './axiosConfig';

const normalizeInvoice = (invoice) => {
  if (!invoice) return invoice;
  return {
    ...invoice,
    id: invoice.id || invoice._id,
    date: invoice.date || invoice.issueDate || invoice.createdAt,
    dueDate: invoice.dueDate || invoice.paymentDueDate
  };
};

const normalizeExpense = (expense) => {
  if (!expense) return expense;
  return {
    ...expense,
    id: expense.id || expense._id,
    date: expense.date || expense.createdAt,
    submittedBy: expense.submittedBy?.name || expense.submittedBy?.email || expense.submittedBy
  };
};

export const getInvoices = async (params = {}) => {
  const response = await axiosInstance.get('/finance/invoices', { params, suppressToast: true });
  const payload = response.data?.data;
  if (Array.isArray(payload)) {
    return payload.map(normalizeInvoice);
  }
  if (Array.isArray(payload?.invoices)) {
    return {
      ...payload,
      invoices: payload.invoices.map(normalizeInvoice)
    };
  }
  return payload;
};

export const getInvoice = async (id) => {
  const response = await axiosInstance.get(`/finance/invoices/${id}`, { suppressToast: true });
  return normalizeInvoice(response.data?.data);
};

export const createInvoice = async (data) => {
  const response = await axiosInstance.post('/finance/invoices', data);
  return normalizeInvoice(response.data?.data);
};

export const updateInvoice = async (id, data) => {
  const response = await axiosInstance.put(`/finance/invoices/${id}`, data);
  return normalizeInvoice(response.data?.data);
};

export const deleteInvoice = async (id) => {
  const response = await axiosInstance.delete(`/finance/invoices/${id}`);
  return response.data?.data;
};

export const getExpenses = async (params = {}) => {
  const response = await axiosInstance.get('/finance/expenses', { params, suppressToast: true });
  const payload = response.data?.data;
  if (Array.isArray(payload)) {
    return payload.map(normalizeExpense);
  }
  if (Array.isArray(payload?.expenses)) {
    return {
      ...payload,
      expenses: payload.expenses.map(normalizeExpense)
    };
  }
  return payload;
};

export const getExpense = async (id) => {
  const response = await axiosInstance.get(`/finance/expenses/${id}`, { suppressToast: true });
  return normalizeExpense(response.data?.data);
};

export const createExpense = async (data) => {
  const response = await axiosInstance.post('/finance/expenses', data);
  return normalizeExpense(response.data?.data);
};

export const updateExpense = async (id, data) => {
  const response = await axiosInstance.put(`/finance/expenses/${id}`, data);
  return normalizeExpense(response.data?.data);
};

export const deleteExpense = async (id) => {
  const response = await axiosInstance.delete(`/finance/expenses/${id}`);
  return response.data?.data;
};
