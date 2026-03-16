import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, DollarSign, CheckCircle2, Clock, AlertCircle, FileText, MessageSquare, Download, Eye, Calendar, Plus, LogOut, Star, X, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import GreetingBanner from '@/components/common/GreetingBanner';
import { useQuery, useQueryClient } from 'react-query';
import { fetchVendors, getVendorDocuments, getVendorPerformance, uploadVendorDocument, deleteVendorDocument, updateVendorDocument } from '@/api/vendors';
import { getWorkOrders, updateWorkOrderStatus } from '@/api/workOrders';
import { createServiceRequest, getServiceRequests } from '@/api/serviceRequests';
import { getInvoices } from '@/api/finance';

const VendorPortal = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusValue, setStatusValue] = useState('open');
  const [requestOpen, setRequestOpen] = useState(false);
  const [docUploadOpen, setDocUploadOpen] = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  const [docFile, setDocFile] = useState(null);
  const [docName, setDocName] = useState('');
  const [docDeletingId, setDocDeletingId] = useState(null);
  const [docEditOpen, setDocEditOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState(null);
  const [docEditForm, setDocEditForm] = useState({ name: '', type: '' });
  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    estimatedCost: '',
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: vendorsResponse = [] } = useQuery('vendors', fetchVendors);
  
  const auth = useAuth();
  const logout = auth?.logout;

  const vendors = useMemo(() => {
    if (Array.isArray(vendorsResponse)) return vendorsResponse;
    if (Array.isArray(vendorsResponse?.vendors)) return vendorsResponse.vendors;
    return [];
  }, [vendorsResponse]);

  const vendorProfile = useMemo(() => {
    if (!vendors.length) return null;
    const email = (auth?.user?.email || '').toLowerCase();
    return vendors.find((v) => (v.email || '').toLowerCase() === email) || vendors[0];
  }, [vendors, auth?.user?.email]);

  const { data: workOrdersResponse = [] } = useQuery(
    ['vendorWorkOrders', vendorProfile?.id],
    () => getWorkOrders(vendorProfile?.id ? { vendor: vendorProfile.id } : {}),
    { enabled: !!vendorProfile?.id }
  );
  const { data: serviceRequestsResponse = [], isLoading: serviceRequestsLoading } = useQuery(
    ['vendorServiceRequests', vendorProfile?.id],
    () => getServiceRequests(vendorProfile?.id ? { vendor: vendorProfile.id } : {}),
    { enabled: !!vendorProfile?.id }
  );
  const { data: invoicesResponse = [], isLoading: invoicesLoading } = useQuery(
    ['vendorInvoices', vendorProfile?.id],
    () => getInvoices(vendorProfile?.id ? { vendor: vendorProfile.id } : {}),
    { enabled: !!vendorProfile?.id }
  );
  const { data: documentsResponse = [], isLoading: documentsLoading } = useQuery(
    ['vendorDocuments', vendorProfile?.id],
    () => getVendorDocuments(vendorProfile?.id),
    { enabled: !!vendorProfile?.id }
  );
  const { data: performanceData, isLoading: performanceLoading } = useQuery(
    ['vendorPerformance', vendorProfile?.id],
    () => getVendorPerformance(vendorProfile?.id),
    { enabled: !!vendorProfile?.id }
  );

  const normalizedWorkOrders = useMemo(() => {
    const list = Array.isArray(workOrdersResponse)
      ? workOrdersResponse
      : (workOrdersResponse?.workOrders || workOrdersResponse?.data || []);
    const vendorId = vendorProfile?.id;
    return list
      .filter((wo) => (vendorId ? wo.vendor?.id === vendorId || wo.vendor === vendorId : true))
      .map((wo) => ({
        id: wo.id,
        displayId: wo.woNumber || wo.id,
        title: wo.title,
        location: wo.location || '—',
        status: wo.status || 'open',
        priority: wo.priority || 'medium',
        scheduledDate: wo.dueDate || wo.createdAt,
        assignedTech: wo.assignedTo?.name || 'Unassigned',
        description: wo.description || '',
        estimatedHours: wo.estimatedHours || 0,
        notesCount: Array.isArray(wo.comments) ? wo.comments.length : 0,
        attachmentsCount: Array.isArray(wo.attachments) ? wo.attachments.length : 0,
        completedDate: wo.completionDate || null
      }));
  }, [workOrdersResponse, vendorProfile?.id]);

  const serviceRequests = useMemo(() => {
    const list = Array.isArray(serviceRequestsResponse)
      ? serviceRequestsResponse
      : (serviceRequestsResponse?.requests || serviceRequestsResponse?.data || []);
    return list.map((request) => ({
      id: request.id,
      title: request.title,
      description: request.description,
      status: request.status || 'pending',
      priority: request.priority || 'medium',
      requestDate: request.requestDate || request.createdAt,
      approvedDate: request.approvedDate,
      estimatedCost: request.estimatedCost ?? request.amount ?? null,
      attachments: Array.isArray(request.attachments) ? request.attachments.length : 0
    }));
  }, [serviceRequestsResponse]);

  const invoices = useMemo(() => {
    const list = Array.isArray(invoicesResponse)
      ? invoicesResponse
      : (invoicesResponse?.invoices || invoicesResponse?.data || []);
    return list.map((invoice) => ({
      id: invoice.id || invoice._id,
      description: invoice.description,
      status: invoice.status || 'pending',
      date: invoice.date || invoice.issueDate || invoice.createdAt,
      dueDate: invoice.dueDate,
      amount: invoice.amount || 0
    }));
  }, [invoicesResponse]);

  const documents = useMemo(() => {
    const list = Array.isArray(documentsResponse)
      ? documentsResponse
      : (documentsResponse?.documents || documentsResponse?.data || []);
    return list.map((doc) => ({
      id: doc.id || doc._id,
      name: doc.name,
      type: doc.type || 'Document',
      uploadDate: doc.uploadDate || doc.uploadedAt || doc.createdAt,
      size: doc.size || '—',
      url: doc.url
    }));
  }, [documentsResponse]);

  const vendorPerformance = performanceData || null;

  const derivedVendorData = useMemo(() => {
    const active = normalizedWorkOrders.filter((wo) => wo.status !== 'completed').length;
    const completed = normalizedWorkOrders.filter((wo) => wo.status === 'completed').length;
    const totalSpend = invoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
    const now = new Date();
    const monthlySpend = invoices.reduce((sum, invoice) => {
      if (!invoice.date) return sum;
      const date = new Date(invoice.date);
      if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
        return sum + Number(invoice.amount || 0);
      }
      return sum;
    }, 0);
    const nextPaymentDate = invoices
      .filter((invoice) => invoice.status !== 'paid' && invoice.dueDate)
      .map((invoice) => new Date(invoice.dueDate))
      .sort((a, b) => a - b)[0];
    return {
      id: vendorProfile?.id || 'vendor',
      name: vendorProfile?.name || 'Vendor',
      rating: vendorProfile?.rating || 0,
      totalSpend,
      monthlySpend,
      activeWorkOrders: active,
      completedOrders: completed,
      nextPaymentDate: nextPaymentDate ? nextPaymentDate.toLocaleDateString() : '—'
    };
  }, [normalizedWorkOrders, vendorProfile, invoices]);


  useEffect(() => {
    setWorkOrders(normalizedWorkOrders);
  }, [normalizedWorkOrders]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'completed':
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      open: 'Open',
      in_progress: 'In Progress',
      completed: 'Completed',
      pending: 'Pending',
      submitted: 'Submitted',
      approved: 'Approved',
      rejected: 'Rejected',
      paid: 'Paid',
    };
    return labels[status] || status;
  };

  const handleOpenDetails = (wo) => {
    setSelectedWorkOrder(wo);
    setDetailsOpen(true);
  };

  const handleOpenStatus = (wo) => {
    setSelectedWorkOrder(wo);
    setStatusValue(wo.status);
    setStatusOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedWorkOrder) return;
    try {
      await updateWorkOrderStatus(selectedWorkOrder.id, statusValue);
      await queryClient.invalidateQueries(['vendorWorkOrders', vendorProfile?.id]);
    } catch (error) {
      // handled by interceptor
    } finally {
      setStatusOpen(false);
      setSelectedWorkOrder(null);
    }
  };

  const handleRequestChange = (field, value) => {
    setRequestForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docFile || !vendorProfile?.id) return;
    setDocUploading(true);
    try {
      await uploadVendorDocument(vendorProfile.id, docFile, {
        name: docName || docFile.name,
        type: docFile.type,
        size: `${Math.round(docFile.size / 1024)} KB`
      });
      await queryClient.invalidateQueries(['vendorDocuments', vendorProfile.id]);
      setDocFile(null);
      setDocName('');
      setDocUploadOpen(false);
    } catch (error) {
      // handled by interceptor
    } finally {
      setDocUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!vendorProfile?.id || !docId) return;
    if (!window.confirm('Delete this document?')) return;
    setDocDeletingId(docId);
    try {
      await deleteVendorDocument(vendorProfile.id, docId);
      await queryClient.invalidateQueries(['vendorDocuments', vendorProfile.id]);
    } catch (error) {
      // handled by interceptor
    } finally {
      setDocDeletingId(null);
    }
  };

  const openEditDocument = (doc) => {
    setEditingDocId(doc.id);
    setDocEditForm({ name: doc.name || '', type: doc.type || '' });
    setDocEditOpen(true);
  };

  const handleUpdateDocument = async (e) => {
    e.preventDefault();
    if (!vendorProfile?.id || !editingDocId) return;
    try {
      await updateVendorDocument(vendorProfile.id, editingDocId, {
        name: docEditForm.name,
        type: docEditForm.type
      });
      await queryClient.invalidateQueries(['vendorDocuments', vendorProfile.id]);
      setDocEditOpen(false);
      setEditingDocId(null);
    } catch (error) {
      // handled by interceptor
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.title.trim() || !requestForm.description.trim()) {
      return;
    }

    try {
      await createServiceRequest({
        title: requestForm.title.trim(),
        description: requestForm.description.trim(),
        priority: requestForm.priority,
        estimatedCost: requestForm.estimatedCost ? Number(requestForm.estimatedCost) : null,
      });
      await queryClient.invalidateQueries(['vendorServiceRequests', vendorProfile?.id]);
      setRequestForm({ title: '', description: '', priority: 'medium', estimatedCost: '' });
      setRequestOpen(false);
    } catch (error) {
      // handled by interceptor
    }
  };

  const buildInvoicePdf = (lines) => {
    const escapePdfText = (value) =>
      String(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

    const contentLines = lines.map((line, index) => {
      const prefix = index === 0 ? '' : '0 -18 Td ';
      return `${prefix}(${escapePdfText(line)}) Tj`;
    });

    const contentStream = [
      'BT',
      '/F1 12 Tf',
      '72 740 Td',
      ...contentLines,
      'ET',
    ].join('\n');

    const header = '%PDF-1.4';
    const objects = [
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
      `4 0 obj << /Length ${contentStream.length} >> stream\n${contentStream}\nendstream\nendobj`,
      '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    ];

    const offsets = [];
    let currentOffset = header.length + 1;
    const body = objects
      .map((obj) => {
        offsets.push(currentOffset);
        currentOffset += obj.length + 1;
        return obj;
      })
      .join('\n');

    const xrefStart = currentOffset;
    const xrefLines = ['xref', `0 ${objects.length + 1}`, '0000000000 65535 f '];
    offsets.forEach((offset) => {
      xrefLines.push(String(offset).padStart(10, '0') + ' 00000 n ');
    });
    const xref = xrefLines.join('\n');
    const trailer = `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    return `${header}\n${body}\n${xref}\n${trailer}`;
  };

  const downloadInvoice = (invoice) => {
    const lines = [
      `Invoice: ${invoice.id}`,
      `Vendor: ${derivedVendorData.name}`,
      `Issue Date: ${invoice.date || 'â€”'}`,
      `Due Date: ${invoice.dueDate || 'â€”'}`,
      `Amount: $${invoice.amount}`,
      `Status: ${getStatusLabel(invoice.status)}`,
      `Description: ${invoice.description}`,
    ];
    const pdfContent = buildInvoicePdf(lines);
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <GreetingBanner subtitle="Review assigned work orders, requests, and invoices." />
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">Vendor Portal</h1>
            <p className="text-indigo-700 dark:text-indigo-300 mt-1">
              View and manage your assigned work orders, submit service requests, and track performance
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-indigo-700 dark:text-indigo-400">Your Rating</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                  {derivedVendorData.rating}
                </span>
                <Star className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          icon={<DollarSign className="h-5 w-5" />}
          title="Monthly Spend"
          value={`$${derivedVendorData.monthlySpend.toLocaleString()}`}
          color="indigo"
        />
        <KPICard
          icon={<TrendingUp className="h-5 w-5" />}
          title="Total Spend"
          value={`$${derivedVendorData.totalSpend.toLocaleString()}`}
          color="blue"
        />
        <KPICard
          icon={<Clock className="h-5 w-5" />}
          title="Active Work Orders"
          value={derivedVendorData.activeWorkOrders}
          color="amber"
        />
        <KPICard
          icon={<CheckCircle2 className="h-5 w-5" />}
          title="Completed"
          value={derivedVendorData.completedOrders}
          color="emerald"
        />
        <KPICard
          icon={<Calendar className="h-5 w-5" />}
          title="Next Payment"
          value={derivedVendorData.nextPaymentDate}
          subtext="Due date"
          color="rose"
        />
      </div>

      {/* Tabs */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-0 p-4">
              {[
                { id: 'overview', label: 'My Work Orders' },
                { id: 'requests', label: 'Service Requests' },
                { id: 'invoices', label: 'Invoices' },
                { id: 'documents', label: 'Documents' },
                { id: 'performance', label: 'Performance' },
                { id: 'support', label: 'Support' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Work Orders Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-3">
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-100 text-sm">Read-Only Access</p>
                    <p className="text-amber-800 dark:text-amber-200 text-xs mt-0.5">
                      You can view your assigned work orders and update their status. To request new work, use the Service Requests tab.
                    </p>
                  </div>
                </div>
                {workOrders.map((wo) => (
                  <div
                    key={wo.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{wo.title}</h3>
                          <Badge className={getStatusColor(wo.status)}>
                            {getStatusLabel(wo.status)}
                          </Badge>
                          <Badge
                            className={
                              wo.priority === 'critical'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100'
                                : wo.priority === 'medium'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100'
                            }
                          >
                            {wo.priority.charAt(0).toUpperCase() + wo.priority.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{wo.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">Location</p>
                            <p className="font-medium text-gray-900 dark:text-white">{wo.location}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">Assigned To</p>
                            <p className="font-medium text-gray-900 dark:text-white">{wo.assignedTech}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">Scheduled</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {new Date(wo.scheduledDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">Est. Hours</p>
                            <p className="font-medium text-gray-900 dark:text-white">{wo.estimatedHours}h</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">Work Order ID</p>
                            <p className="font-medium text-gray-900 dark:text-white">{wo.displayId}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{wo.notesCount} notes</span>
                          <span>|</span>
                          <span>{wo.attachmentsCount} attachments</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="whitespace-nowrap"
                          onClick={() => handleOpenDetails(wo)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          className="bg-blue-700 hover:bg-blue-800 text-white whitespace-nowrap"
                          size="sm"
                          onClick={() => handleOpenStatus(wo)}
                        >
                          Update Status
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Service Requests Tab */}
            {activeTab === 'requests' && (
              <div className="space-y-4">
                <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-4 flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-indigo-900 dark:text-indigo-100 text-sm">Request New Work</p>
                      <p className="text-indigo-800 dark:text-indigo-200 text-xs mt-0.5">
                        Submit a service request for new work. Our team will review and convert approved requests to work orders.
                      </p>
                    </div>
                  </div>
                  <Button
                    className="bg-blue-700 hover:bg-blue-800 text-white whitespace-nowrap ml-4"
                    onClick={() => setRequestOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Request
                  </Button>
                </div>

                {serviceRequestsLoading ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Loading service requests...
                  </p>
                ) : serviceRequests.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No service requests yet.
                  </p>
                ) : (
                  serviceRequests.map((req) => (
                    <div
                      key={req.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        req.status === 'pending' || req.status === 'submitted'
                          ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20'
                          : req.status === 'approved'
                          ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{req.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{req.description}</p>
                        </div>
                        <Badge
                          className={
                            req.status === 'pending' || req.status === 'submitted'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100'
                              : req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100'
                          }
                        >
                          {getStatusLabel(req.status)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Request Date</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {req.requestDate ? new Date(req.requestDate).toLocaleDateString() : 'â€”'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Estimated Cost</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {req.estimatedCost ? `$${req.estimatedCost.toLocaleString()}` : 'TBD'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Priority</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {req.priority.charAt(0).toUpperCase() + req.priority.slice(1)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Request ID</p>
                          <p className="font-medium text-gray-900 dark:text-white">{req.id}</p>
                        </div>
                      </div>
                      {req.status === 'rejected' && req.rejectionReason && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded text-sm text-rose-800 dark:text-rose-200 mt-3">
                          <p className="font-medium mb-1">Rejection Reason:</p>
                          <p>{req.rejectionReason}</p>
                        </div>
                      )}
                      {req.status === 'approved' && req.approvedDate && (
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-3">
                          Approved on {new Date(req.approvedDate).toLocaleDateString()} - Work order will be created
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              <div className="space-y-3">
                {invoicesLoading ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Loading invoices...
                  </p>
                ) : invoices.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No invoices available yet.
                  </p>
                ) : (
                  invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{invoice.id}</h3>
                            <Badge className={getStatusColor(invoice.status)}>
                              {getStatusLabel(invoice.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{invoice.description}</p>
                          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-500">Issue Date</p>
                              <p className="font-medium text-gray-900 dark:text-white">
                              {invoice.date ? new Date(invoice.date).toLocaleDateString() : 'â€”'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-500">Due Date</p>
                              <p className="font-medium text-gray-900 dark:text-white">
                              {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'â€”'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-500">Amount</p>
                              <p className="font-medium text-gray-900 dark:text-white text-lg">
                                ${invoice.amount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => downloadInvoice(invoice)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button
                    className="bg-blue-700 hover:bg-blue-800 text-white"
                    size="sm"
                    onClick={() => setDocUploadOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
                {documentsLoading ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Loading documents...
                  </p>
                ) : documents.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No documents available yet.
                  </p>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{doc.name}</h3>
                          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <span>{doc.type}</span>
                            <span>|</span>
                            <span>{doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : 'â€”'}</span>
                            <span>|</span>
                            <span>{doc.size}</span>
                          </div>
                        </div>
                      </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!doc.url}
                        onClick={() => doc.url && window.open(doc.url, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDocument(doc)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={docDeletingId === doc.id}
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
                )}
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                {performanceLoading ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Loading performance metrics...
                  </p>
                ) : !vendorPerformance ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No performance metrics available yet.
                  </p>
                ) : (
                  <>
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">On-Time Completion</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {vendorPerformance.onTimeCompletion?.current ?? 'â€”'}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Last Month</p>
                          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                            {vendorPerformance.onTimeCompletion?.previous ?? 'â€”'}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Completion Time</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Average</p>
                          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                            {vendorPerformance.completionTime?.averageHours ?? 'â€”'} hours
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Fastest</p>
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {vendorPerformance.completionTime?.fastestMinutes ?? 'â€”'} minutes
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Work Order Totals</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {vendorPerformance.totals?.total ?? 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {vendorPerformance.totals?.completed ?? 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Open</p>
                          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                            {vendorPerformance.totals?.open ?? 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Support Tab */}
            {activeTab === 'support' && (
              <div className="space-y-4">
                <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <MessageSquare className="h-6 w-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Need Help?</h3>
                      <p className="text-indigo-700 dark:text-indigo-300 text-sm mb-4">
                        Contact our support team for any questions or issues with your account, work orders, or invoices.
                      </p>
                      <div className="space-y-2 text-sm">
                        <p className="text-indigo-800 dark:text-indigo-200">
                          <span className="font-medium">Email:</span> support@maintainpro.com
                        </p>
                        <p className="text-indigo-800 dark:text-indigo-200">
                          <span className="font-medium">Phone:</span> 1-800-MAINTAIN
                        </p>
                        <p className="text-indigo-800 dark:text-indigo-200">
                          <span className="font-medium">Hours:</span> Monday - Friday, 8:00 AM - 6:00 PM EST
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => alert('Starting chat support session...')}
                    className="bg-blue-700 hover:bg-blue-800 text-white w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Chat Support
                  </Button>
                  <Button 
                    onClick={() => alert('Opening FAQs...')}
                    variant="outline" 
                    className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    View FAQs
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {detailsOpen && selectedWorkOrder && (
        <ModalShell title="Work Order Details" onClose={() => setDetailsOpen(false)}>
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Title</p>
              <p className="font-semibold text-gray-900 dark:text-white">{selectedWorkOrder.title}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                <p className="font-medium text-gray-900 dark:text-white">{getStatusLabel(selectedWorkOrder.status)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Priority</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedWorkOrder.priority.charAt(0).toUpperCase() + selectedWorkOrder.priority.slice(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedWorkOrder.location}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Assigned To</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedWorkOrder.assignedTech}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Scheduled</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(selectedWorkOrder.scheduledDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Est. Hours</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedWorkOrder.estimatedHours}h</p>
              </div>
            </div>
            {selectedWorkOrder.completedDate && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Completed Date</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(selectedWorkOrder.completedDate).toLocaleDateString()}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Description</p>
              <p className="text-gray-700 dark:text-gray-300">{selectedWorkOrder.description}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
              <Button
                className="bg-blue-700 hover:bg-blue-800 text-white"
                onClick={() => {
                  setDetailsOpen(false);
                  handleOpenStatus(selectedWorkOrder);
                }}
              >
                Update Status
              </Button>
            </div>
          </div>
        </ModalShell>
      )}

      {statusOpen && selectedWorkOrder && (
        <ModalShell title="Update Status" onClose={() => setStatusOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={statusValue}
                onChange={(e) => setStatusValue(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStatusOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-blue-700 hover:bg-blue-800 text-white" onClick={handleSaveStatus}>
                Save
              </Button>
            </div>
          </div>
        </ModalShell>
      )}

      {requestOpen && (
        <ModalShell title="New Service Request" onClose={() => setRequestOpen(false)}>
          <form className="space-y-4" onSubmit={handleSubmitRequest}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              <input
                value={requestForm.title}
                onChange={(e) => handleRequestChange('title', e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter a short request title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={requestForm.description}
                onChange={(e) => handleRequestChange('description', e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Describe the work needed"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={requestForm.priority}
                  onChange={(e) => handleRequestChange('priority', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estimated Cost (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={requestForm.estimatedCost}
                  onChange={(e) => handleRequestChange('estimatedCost', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRequestOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-700 hover:bg-blue-800 text-white"
                disabled={!requestForm.title.trim() || !requestForm.description.trim()}
              >
                Submit Request
              </Button>
            </div>
          </form>
        </ModalShell>
      )}

      {docUploadOpen && (
        <ModalShell title="Upload Document" onClose={() => setDocUploadOpen(false)}>
          <form className="space-y-4" onSubmit={handleUploadDocument}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Document Name
              </label>
              <input
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                File
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDocUploadOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-700 hover:bg-blue-800 text-white"
                disabled={!docFile || docUploading}
              >
                {docUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </form>
        </ModalShell>
      )}

      {docEditOpen && (
        <ModalShell title="Edit Document" onClose={() => setDocEditOpen(false)}>
          <form className="space-y-4" onSubmit={handleUpdateDocument}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                value={docEditForm.name}
                onChange={(e) => setDocEditForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <input
                value={docEditForm.type}
                onChange={(e) => setDocEditForm((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Optional"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDocEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white">
                Save
              </Button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Logout Button */}
      <div className="flex justify-end">
        <Button
          onClick={async () => {
            if (logout) {
              await logout();
            }
            navigate('/login');
          }}
          className="bg-rose-600 hover:bg-rose-700 text-white gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

// KPI Card Component
const KPICard = ({ icon, title, value, subtext, color = 'indigo' }) => {
  const colorClasses = {
    indigo: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100',
    blue: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
    amber: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100',
    rose: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100',
  };

  const iconColor = {
    indigo: 'text-indigo-600 dark:text-indigo-400',
    blue: 'text-blue-600 dark:text-blue-400',
    amber: 'text-amber-600 dark:text-amber-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    rose: 'text-rose-600 dark:text-rose-400',
  };

  return (
    <div className={`p-4 border rounded-lg ${colorClasses[color]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 bg-white/50 dark:bg-black/20 rounded-lg ${iconColor[color]}`}>{icon}</div>
      </div>
      <p className="text-xs font-medium opacity-75 mb-1">{title}</p>
      <p className="text-2xl font-bold mb-1">{value}</p>
      {subtext && <p className="text-xs opacity-75">{subtext}</p>}
    </div>
  );
};

const ModalShell = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-900 shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  </div>
);

export default VendorPortal;






