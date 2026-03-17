import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  Calendar,
  FileText,
  Download,
  Filter,
  Eye,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  BarChart3,
  CreditCard,
  Receipt
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { createFundRequest, fetchMyFundRequests, fetchFundRequests, approveFundRequest, rejectFundRequest } from '@/api/funds';
import GreetingBanner from '@/components/common/GreetingBanner';
import { useQuery, useQueryClient } from 'react-query';
import { createExpense, createInvoice, getExpenses, getInvoices, updateInvoice, deleteInvoice } from '@/api/finance';
import { fetchVendors } from '@/api/vendors';
import { formatCurrency } from '@/utils/formatters';

// StatCard Component
const StatCard = ({ icon: Icon, label, value, trend, color = 'indigo' }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className={`bg-white dark:bg-zinc-800 p-4 rounded-lg border border-gray-200 dark:border-zinc-700`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {trend && (
          <p className={`text-xs mt-2 ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend > 0 ? 'Up' : 'Down'} {Math.abs(trend)}% from last month
          </p>
        )}
      </div>
      <Icon className={`h-5 w-5 text-${color}-600`} />
    </div>
  </motion.div>
);

// Invoice Card Component
const InvoiceCard = ({ invoice, onSelect, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };
  const status = invoice.status || 'pending';
  const dueDateLabel = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'â€”';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onSelect}
      className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-4 cursor-pointer hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{invoice.id}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.clientName}</p>
        </div>
        <Badge className={getStatusColor(status)}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{invoice.description}</p>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-500">Due: {dueDateLabel}</p>
        </div>
        <p className="text-xl font-bold text-indigo-600">{formatCurrency(invoice.amount || 0)}</p>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(invoice);
          }}
        >
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(invoice);
          }}
        >
          Delete
        </Button>
      </div>
    </motion.div>
  );
};

export default function FinancePortal() {
  const { user } = useAuth();
  const isFinance = user?.role === 'finance';
  const [search, setSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all');
  const [expenseStatusFilter, setExpenseStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [selectedTab, setSelectedTab] = useState('invoices');
  const [newInvoiceModalOpen, setNewInvoiceModalOpen] = useState(false);
  const [editInvoiceModalOpen, setEditInvoiceModalOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [newPaymentModalOpen, setNewPaymentModalOpen] = useState(false);
  const [newExpenseModalOpen, setNewExpenseModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [requestPurpose, setRequestPurpose] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [fundRequests, setFundRequests] = useState([]);
  const [expenseForm, setExpenseForm] = useState({
    category: '',
    amount: '',
    vendor: '',
    notes: ''
  });
  const [invoiceForm, setInvoiceForm] = useState({
    clientName: '',
    vendor: '',
    amount: '',
    dueDate: '',
    status: 'pending',
    description: ''
  });
  const [editInvoiceForm, setEditInvoiceForm] = useState({
    clientName: '',
    vendor: '',
    amount: '',
    dueDate: '',
    status: 'pending',
    description: ''
  });
  const [fundLoading, setFundLoading] = useState(false);
  const [fundFilters, setFundFilters] = useState({
    status: 'all',
    from: '',
    to: ''
  });

  const canRequestFunds = user?.role === 'finance';
  const canApproveFunds = user?.role === 'admin';
  const canViewExpenses = isFinance || canApproveFunds;
  const canViewFundRequests = canRequestFunds || canApproveFunds;
  const queryClient = useQueryClient();

  const invoiceQueryParams = useMemo(
    () => ({
      status: invoiceStatusFilter !== 'all' ? invoiceStatusFilter : undefined,
      search: search || undefined
    }),
    [invoiceStatusFilter, search]
  );

  const expenseQueryParams = useMemo(
    () => ({
      status: expenseStatusFilter !== 'all' ? expenseStatusFilter : undefined,
      search: search || undefined
    }),
    [expenseStatusFilter, search]
  );

  const { data: invoicesResponse = [], isLoading: invoicesLoading } = useQuery(
    ['financeInvoices', invoiceQueryParams],
    () => getInvoices(invoiceQueryParams),
    { keepPreviousData: true, enabled: isFinance }
  );

  const { data: vendorsResponse = [] } = useQuery('vendors', fetchVendors, {
    enabled: isFinance || canApproveFunds
  });

  const { data: expensesResponse = [], isLoading: expensesLoading } = useQuery(
    ['financeExpenses', expenseQueryParams],
    () => getExpenses(expenseQueryParams),
    { keepPreviousData: true, enabled: canViewExpenses }
  );

  const invoices = useMemo(() => {
    if (Array.isArray(invoicesResponse)) return invoicesResponse;
    if (Array.isArray(invoicesResponse?.invoices)) return invoicesResponse.invoices;
    if (Array.isArray(invoicesResponse?.data)) return invoicesResponse.data;
    return [];
  }, [invoicesResponse]);

  const vendors = useMemo(() => {
    if (Array.isArray(vendorsResponse)) return vendorsResponse;
    if (Array.isArray(vendorsResponse?.vendors)) return vendorsResponse.vendors;
    return [];
  }, [vendorsResponse]);

  const expenses = useMemo(() => {
    if (Array.isArray(expensesResponse)) return expensesResponse;
    if (Array.isArray(expensesResponse?.expenses)) return expensesResponse.expenses;
    if (Array.isArray(expensesResponse?.data)) return expensesResponse.data;
    return [];
  }, [expensesResponse]);

  const summary = useMemo(() => {
    const totalRevenue = invoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const pendingPayments = invoices
      .filter((invoice) => invoice.status && invoice.status !== 'paid')
      .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const budgetUtilization = totalRevenue ? Math.round((totalExpenses / totalRevenue) * 100) : 0;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      pendingPayments,
      budgetUtilization
    };
  }, [invoices, expenses]);

  useEffect(() => {
    if (isFinance) {
      return;
    }

    if (selectedTab === 'invoices') {
      setSelectedTab(canViewExpenses ? 'expenses' : 'reports');
      return;
    }

    if (!canViewExpenses && selectedTab === 'expenses') {
      setSelectedTab('reports');
    }
    if (!canViewFundRequests && selectedTab === 'funds') {
      setSelectedTab(canViewExpenses ? 'expenses' : 'reports');
    }
  }, [canViewExpenses, canViewFundRequests, isFinance, selectedTab]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      if (invoiceStatusFilter !== 'all' && invoice.status !== invoiceStatusFilter) return false;
      if (search && !(invoice.clientName || '').toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [invoices, search, invoiceStatusFilter]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (expenseStatusFilter !== 'all' && expense.status !== expenseStatusFilter) return false;
      if (search && !(expense.vendor || '').toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [expenses, search, expenseStatusFilter]);

  const handleProcessPayment = async () => {
    if (!selectedInvoice) return;
    if (paymentAmount && paymentAmount > 0) {
      try {
        await updateInvoice(selectedInvoice.id, { status: 'paid' });
        await queryClient.invalidateQueries(['financeInvoices']);
      } catch (error) {
        // handled by interceptor
      } finally {
        setNewPaymentModalOpen(false);
        setPaymentAmount('');
        setPaymentNote('');
        setSelectedInvoice(null);
      }
    } else {
      alert('Please enter a valid payment amount');
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.category || !expenseForm.amount) {
      alert('Please provide a category and amount.');
      return;
    }
    try {
      await createExpense({
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        vendor: expenseForm.vendor,
        notes: expenseForm.notes
      });
      await queryClient.invalidateQueries(['financeExpenses']);
      setExpenseForm({ category: '', amount: '', vendor: '', notes: '' });
      setNewExpenseModalOpen(false);
    } catch (error) {
      // handled by interceptor
    }
  };

  const handleCreateInvoice = async () => {
    if (!invoiceForm.clientName || !invoiceForm.amount) {
      alert('Please provide a client name and amount.');
      return;
    }
    try {
      await createInvoice({
        clientName: invoiceForm.clientName,
        vendor: invoiceForm.vendor || undefined,
        amount: Number(invoiceForm.amount),
        dueDate: invoiceForm.dueDate || undefined,
        status: invoiceForm.status,
        description: invoiceForm.description
      });
      await queryClient.invalidateQueries(['financeInvoices']);
      setInvoiceForm({
        clientName: '',
        vendor: '',
        amount: '',
        dueDate: '',
        status: 'pending',
        description: ''
      });
      setNewInvoiceModalOpen(false);
    } catch (error) {
      // handled by interceptor
    }
  };

  const openEditInvoice = (invoice) => {
    if (!invoice) return;
    setEditingInvoiceId(invoice.id);
    setEditInvoiceForm({
      clientName: invoice.clientName || '',
      vendor: invoice.vendor || '',
      amount: invoice.amount || '',
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().slice(0, 10) : '',
      status: invoice.status || 'pending',
      description: invoice.description || ''
    });
    setEditInvoiceModalOpen(true);
  };

  const handleUpdateInvoice = async () => {
    if (!editingInvoiceId) return;
    if (!editInvoiceForm.clientName || !editInvoiceForm.amount) {
      alert('Please provide a client name and amount.');
      return;
    }
    try {
      await updateInvoice(editingInvoiceId, {
        clientName: editInvoiceForm.clientName,
        vendor: editInvoiceForm.vendor || undefined,
        amount: Number(editInvoiceForm.amount),
        dueDate: editInvoiceForm.dueDate || undefined,
        status: editInvoiceForm.status,
        description: editInvoiceForm.description
      });
      await queryClient.invalidateQueries(['financeInvoices']);
      setEditInvoiceModalOpen(false);
      setEditingInvoiceId(null);
    } catch (error) {
      // handled by interceptor
    }
  };

  const handleDeleteInvoice = async (invoice) => {
    if (!invoice?.id) return;
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await deleteInvoice(invoice.id);
      await queryClient.invalidateQueries(['financeInvoices']);
    } catch (error) {
      // handled by interceptor
    }
  };

  const loadFundRequests = async () => {
    setFundLoading(true);
    try {
      const params = {
        status: fundFilters.status !== 'all' ? fundFilters.status : undefined,
        from: fundFilters.from || undefined,
        to: fundFilters.to || undefined
      };
      const data = canApproveFunds ? await fetchFundRequests(params) : await fetchMyFundRequests(params);
      setFundRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      // handled by interceptor
    } finally {
      setFundLoading(false);
    }
  };

  useEffect(() => {
    if (!canViewFundRequests) return;
    loadFundRequests();
  }, [canViewFundRequests]);

  const handleCreateFundRequest = async () => {
    const amountValue = Number.parseFloat(requestAmount);
    if (!amountValue || amountValue <= 0 || !requestPurpose.trim()) {
      alert('Please enter a valid amount and purpose.');
      return;
    }

    try {
      await createFundRequest({
        amount: amountValue,
        purpose: requestPurpose.trim(),
        notes: requestNotes.trim(),
      });
      setRequestAmount('');
      setRequestPurpose('');
      setRequestNotes('');
      loadFundRequests();
    } catch (error) {
      // handled by interceptor
    }
  };

  const handleReviewFundRequest = async (id, nextStatus) => {
    if (!canApproveFunds) {
      return;
    }

    try {
      if (nextStatus === 'approved') {
        await approveFundRequest(id);
        await queryClient.invalidateQueries(['financeExpenses']);
      } else {
        await rejectFundRequest(id);
      }
      loadFundRequests();
    } catch (error) {
      // handled by interceptor
    }
  };

  const getFundRequestStatusClasses = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    }
  };

  return (
    <div className="space-y-6">
      <GreetingBanner subtitle="Review invoices, expenses, and financial reports." />
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Finance Portal</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage invoices, expenses, and financial reports</p>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Total Revenue"
          value={formatCurrency(summary.totalRevenue)}
          color="emerald"
        />
        <StatCard
          icon={TrendingDown}
          label="Total Expenses"
          value={formatCurrency(summary.totalExpenses)}
          color="red"
        />
        <StatCard
          icon={DollarSign}
          label="Net Profit"
          value={formatCurrency(summary.netProfit)}
          color="indigo"
        />
        <StatCard
          icon={Clock}
          label="Pending Payments"
          value={formatCurrency(summary.pendingPayments)}
          color="blue"
        />
        <StatCard
          icon={PieChart}
          label="Budget Used"
          value={`${summary.budgetUtilization}%`}
          color="amber"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-zinc-700">
        {isFinance && (
          <>
            <button
              onClick={() => setSelectedTab('invoices')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                selectedTab === 'invoices'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              Invoices
            </button>
          </>
        )}
        {canViewExpenses && (
          <button
            onClick={() => setSelectedTab('expenses')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              selectedTab === 'expenses'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            Expenses
          </button>
        )}
        {canViewFundRequests && (
          <button
            onClick={() => setSelectedTab('funds')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              selectedTab === 'funds'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            Request Funds
          </button>
        )}
        <button
          onClick={() => setSelectedTab('reports')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            selectedTab === 'reports'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Reports
        </button>
      </div>

      {/* Fund Requests Tab */}
      {selectedTab === 'funds' && canViewFundRequests && (
        <Card>
          <CardHeader>
            <CardTitle>Fund Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Select
                value={fundFilters.status}
                onValueChange={(value) => setFundFilters((prev) => ({ ...prev, status: value }))}
              >
              <SelectTrigger className="h-10 bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="dark:bg-zinc-900 dark:text-gray-100">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
              </Select>
              <Input
                type="date"
                value={fundFilters.from}
                onChange={(e) => setFundFilters((prev) => ({ ...prev, from: e.target.value }))}
                className="h-10 text-gray-900 dark:text-gray-100"
              />
              <Input
                type="date"
                value={fundFilters.to}
                onChange={(e) => setFundFilters((prev) => ({ ...prev, to: e.target.value }))}
                className="h-10 text-gray-900 dark:text-gray-100"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-gray-700 dark:text-gray-200" onClick={loadFundRequests}>
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-gray-700 dark:text-gray-200"
                  onClick={() => {
                    setFundFilters({ status: 'all', from: '', to: '' });
                    setTimeout(loadFundRequests, 0);
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>

            {canRequestFunds && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Amount"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                  className="h-10 text-gray-900 dark:text-gray-100"
                />
                <Input
                  placeholder="Purpose"
                  value={requestPurpose}
                  onChange={(e) => setRequestPurpose(e.target.value)}
                  className="h-10 text-gray-900 dark:text-gray-100"
                />
                <Button
                  className="bg-blue-700 hover:bg-blue-800 text-white h-10"
                  onClick={handleCreateFundRequest}
                >
                  Submit Request
                </Button>
                <textarea
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  className="md:col-span-3 w-full h-20 p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div className="space-y-3">
              {fundLoading ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading fund requests...</p>
              ) : fundRequests.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">No fund requests yet.</p>
              ) : (
                fundRequests.map((request) => (
                  <div
                    key={request._id}
                    className="border border-gray-200 dark:border-zinc-700 rounded-lg p-4 bg-white dark:bg-zinc-800"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(request.amount || 0)} - {request.purpose}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Requested by {request.requestedBy?.firstName || request.requestedBy?.email || 'Finance Officer'} on{' '}
                          {new Date(request.createdAt || request.requestedAt).toLocaleDateString()}
                        </p>
                        {request.notes && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{request.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getFundRequestStatusClasses(request.status)}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                        {canApproveFunds && request.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => handleReviewFundRequest(request._id, 'approved')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-500/60 dark:text-red-300 dark:hover:bg-red-900/30"
                              onClick={() => handleReviewFundRequest(request._id, 'rejected')}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    {request.decidedAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {request.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
                        {request.decidedBy?.firstName || request.decidedBy?.email || 'Admin'} on{' '}
                        {new Date(request.decidedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices Tab */}
      {isFinance && selectedTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search invoices..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-10 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 hover:border-gray-300 dark:hover:border-zinc-600 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                  />
                </div>

                <Select value={invoiceStatusFilter} onValueChange={setInvoiceStatusFilter}>
                  <SelectTrigger className="h-10 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-700/50 font-medium text-gray-900 dark:text-gray-100 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/50 dark:hover:to-purple-900/50 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all cursor-pointer">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-zinc-900 dark:text-gray-100">
                    <SelectItem value="all" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-2 hover:from-indigo-700 hover:to-purple-700 cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-white"></span>
                        All Status
                      </span>
                    </SelectItem>
                    <SelectItem value="paid" className="hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer">Paid</SelectItem>
                    <SelectItem value="pending" className="hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer">Pending</SelectItem>
                    <SelectItem value="overdue" className="hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer">! Overdue</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    className="bg-blue-700 hover:bg-blue-800 text-white h-10"
                    onClick={() => alert(`Exporting invoice report...`)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-10"
                    onClick={() => setNewInvoiceModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Invoice
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Cards */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Invoices ({filteredInvoices.length})
            </h2>
            {invoicesLoading ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Loading invoices...
              </p>
            ) : filteredInvoices.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No invoices available yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInvoices.map((invoice) => (
                  <InvoiceCard
                    key={invoice.id}
                    invoice={invoice}
                    onSelect={() => setSelectedInvoice(invoice)}
                    onEdit={openEditInvoice}
                    onDelete={handleDeleteInvoice}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {canViewExpenses && selectedTab === 'expenses' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search expenses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 hover:border-gray-300 dark:hover:border-zinc-600 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                />
              </div>

              <Select value={expenseStatusFilter} onValueChange={setExpenseStatusFilter}>
                <SelectTrigger className="h-10 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-700/50 font-medium text-gray-900 dark:text-gray-100 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/50 dark:hover:to-orange-900/50 hover:border-amber-300 dark:hover:border-amber-600 transition-all cursor-pointer">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-900 dark:text-gray-100">
                    <SelectItem value="all" className="bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold py-2 hover:from-amber-700 hover:to-orange-700 cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-white"></span>
                        All Status
                      </span>
                    </SelectItem>
                    <SelectItem value="approved" className="hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer">Approved</SelectItem>
                    <SelectItem value="pending" className="hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer">Pending Review</SelectItem>
                  </SelectContent>
                </Select>

                {isFinance && (
                  <Button 
                    className="bg-blue-700 hover:bg-blue-800 text-white h-10"
                    onClick={() => setNewExpenseModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Expenses Table */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Vendor</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {expensesLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-6 text-sm text-gray-600 dark:text-gray-400"
                      >
                        Loading expenses...
                      </td>
                    </tr>
                  ) : filteredExpenses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-6 text-sm text-gray-600 dark:text-gray-400"
                      >
                        No expenses available yet.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="border-b border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700/50 cursor-pointer"
                        onClick={() => setSelectedExpense(expense)}
                      >
                        <td className="px-6 py-3 text-sm text-gray-900 dark:text-white font-medium">{expense.category}</td>
                        <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{expense.vendor}</td>
                        <td className="px-6 py-3 text-sm font-semibold text-amber-600">{formatCurrency(expense.amount || 0)}</td>
                        <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <Badge className={
                            expense.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          }>
                            {expense.status === 'approved' ? 'Approved' : 'Pending'}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {selectedTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center">
              <div className="text-center">
                <PieChart className="h-12 w-12 text-indigo-600 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">Revenue chart visualization</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">Trend analysis</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invoice Detail Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedInvoice(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-lg w-full max-w-md"
            >
              <CardHeader className="border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-start justify-between">
                  <CardTitle>{selectedInvoice.id}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedInvoice(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Client</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedInvoice.clientName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                  <p className="text-2xl font-bold text-indigo-600">{formatCurrency(selectedInvoice.amount || 0)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Invoice Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                    {selectedInvoice.date ? new Date(selectedInvoice.date).toLocaleDateString() : 'â€”'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Due Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                    {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'â€”'}
                    </p>
                  </div>
                </div>

                <Separator />

                {selectedInvoice.status !== 'paid' && (
                  canApproveFunds ? (
                    <Button 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setNewPaymentModalOpen(true)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Process Payment
                    </Button>
                  ) : (
                    <p className="text-sm text-amber-700 dark:text-amber-200">
                      Manager approval is required before releasing funds.
                    </p>
                  )
                )}
                {isFinance && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedInvoice(null);
                      openEditInvoice(selectedInvoice);
                    }}
                  >
                    Edit Invoice
                  </Button>
                )}
              </CardContent>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {newPaymentModalOpen && canApproveFunds && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setNewPaymentModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-lg w-full max-w-md"
            >
              <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Process Payment
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Amount (₦)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Note
                  </label>
                  <textarea
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="Optional payment note..."
                    className="w-full h-20 p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-zinc-800">
                <Button
                  variant="outline"
                  className="flex-1 text-gray-700 dark:text-gray-200"
                  onClick={() => setNewPaymentModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleProcessPayment()}
                >
                  Process Payment
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Invoice Modal */}
      <AnimatePresence>
        {newInvoiceModalOpen && isFinance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setNewInvoiceModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-lg w-full max-w-md"
            >
              <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create Invoice
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Client Name
                  </label>
                  <Input
                    value={invoiceForm.clientName}
                    onChange={(e) => setInvoiceForm((prev) => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Client or vendor name"
                    className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vendor (optional)
                  </label>
                  <Select
                    value={invoiceForm.vendor}
                    onValueChange={(value) =>
                      setInvoiceForm((prev) => ({
                        ...prev,
                        vendor: value === '__none__' ? '' : value
                      }))
                    }
                  >
                    <SelectTrigger className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-gray-100">
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-zinc-900 dark:text-gray-100">
                      <SelectItem value="__none__">No vendor</SelectItem>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount (₦)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={invoiceForm.amount}
                      onChange={(e) => setInvoiceForm((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Due Date
                    </label>
                    <Input
                      type="date"
                      value={invoiceForm.dueDate}
                      onChange={(e) => setInvoiceForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                      className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <Select
                    value={invoiceForm.status}
                    onValueChange={(value) => setInvoiceForm((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-gray-100">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-zinc-900 dark:text-gray-100">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={invoiceForm.description}
                    onChange={(e) => setInvoiceForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-zinc-800">
                <Button
                  variant="outline"
                  className="flex-1 text-gray-700 dark:text-gray-200"
                  onClick={() => setNewInvoiceModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleCreateInvoice}
                >
                  Create Invoice
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Invoice Modal */}
      <AnimatePresence>
        {editInvoiceModalOpen && isFinance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setEditInvoiceModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-lg w-full max-w-md"
            >
              <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Edit Invoice
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Client Name
                  </label>
                  <Input
                    value={editInvoiceForm.clientName}
                    onChange={(e) => setEditInvoiceForm((prev) => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Client or vendor name"
                    className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vendor (optional)
                  </label>
                  <Select
                    value={editInvoiceForm.vendor}
                    onValueChange={(value) =>
                      setEditInvoiceForm((prev) => ({
                        ...prev,
                        vendor: value === '__none__' ? '' : value
                      }))
                    }
                  >
                    <SelectTrigger className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-gray-100">
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-zinc-900 dark:text-gray-100">
                      <SelectItem value="__none__">No vendor</SelectItem>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount (₦)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editInvoiceForm.amount}
                      onChange={(e) => setEditInvoiceForm((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Due Date
                    </label>
                    <Input
                      type="date"
                      value={editInvoiceForm.dueDate}
                      onChange={(e) => setEditInvoiceForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                      className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <Select
                    value={editInvoiceForm.status}
                    onValueChange={(value) => setEditInvoiceForm((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-gray-100">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-zinc-900 dark:text-gray-100">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editInvoiceForm.description}
                    onChange={(e) => setEditInvoiceForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-zinc-800">
                <Button
                  variant="outline"
                  className="flex-1 text-gray-700 dark:text-gray-200"
                  onClick={() => setEditInvoiceModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleUpdateInvoice}
                >
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expense Detail Modal */}
      <AnimatePresence>
        {selectedExpense && canViewExpenses && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedExpense(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-lg w-full max-w-md"
            >
              <CardHeader className="border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-start justify-between">
                  <CardTitle>Expense {selectedExpense.id}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedExpense(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedExpense.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vendor</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedExpense.vendor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                  <p className="text-2xl font-bold text-amber-600">{formatCurrency(selectedExpense.amount || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(selectedExpense.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <Badge className={
                    selectedExpense.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  }>
                    {selectedExpense.status === 'approved' ? 'Approved' : 'Pending'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Submitted By</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedExpense.submittedBy || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Notes</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedExpense.notes || 'None'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Attachments</p>
                  {selectedExpense.attachments && selectedExpense.attachments.length > 0 ? (
                    <ul className="text-sm text-indigo-600 dark:text-indigo-300">
                      {selectedExpense.attachments.map((file) => (
                        <li key={file}>{file}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white">None</p>
                  )}
                </div>
              </CardContent>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {newExpenseModalOpen && isFinance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setNewExpenseModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-lg w-full max-w-md"
            >
              <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Add Expense
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <Select
                    value={expenseForm.category}
                    onValueChange={(value) => setExpenseForm((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-gray-100">
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-zinc-900 dark:text-gray-100">
                      <SelectItem value="parts">Parts & Materials</SelectItem>
                      <SelectItem value="labor">Labor</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount (₦)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vendor
                  </label>
                  <Input
                    placeholder="Vendor name..."
                    value={expenseForm.vendor}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, vendor: e.target.value }))}
                    className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Optional notes..."
                  />
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-zinc-800">
                <Button
                  variant="outline"
                  className="flex-1 text-gray-700 dark:text-gray-200"
                  onClick={() => setNewExpenseModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white"
                  onClick={() => handleAddExpense()}
                >
                  Add Expense
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

