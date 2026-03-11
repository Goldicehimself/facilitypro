import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, DollarSign, CheckCircle2, Clock, AlertCircle, FileText, MessageSquare, Download, Eye, Calendar, Plus, LogOut, Star, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import GreetingBanner from '@/components/common/GreetingBanner';
import { useQuery } from 'react-query';
import { fetchVendors } from '@/api/vendors';
import { getWorkOrders } from '@/api/workOrders';

const mockServiceRequests = [
  {
    id: 'SR-2024-001',
    title: 'Emergency HVAC Expansion',
    description: 'Need additional HVAC capacity for new server room. Urgent installation required within 2 weeks.',
    status: 'pending',
    priority: 'high',
    requestDate: '2026-02-20',
    estimatedCost: 8000,
    attachments: 1
  },
  {
    id: 'SR-2024-002',
    title: 'Preventive Maintenance Contract',
    description: 'Request for monthly preventive maintenance contract for Building A systems. Current reactive service is becoming cost-prohibitive.',
    status: 'approved',
    priority: 'medium',
    requestDate: '2026-02-15',
    approvedDate: '2026-02-18',
    estimatedCost: 2000
  },
  {
    id: 'SR-2024-003',
    title: 'System Upgrade Assessment',
    description: 'Request for comprehensive assessment of existing HVAC systems for upgrade recommendations.',
    status: 'submitted',
    priority: 'low',
    requestDate: '2026-02-10',
    estimatedCost: 500
  }
];

const mockInvoices = [];

const mockDocuments = [];

const VendorPortal = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [workOrders, setWorkOrders] = useState([]);
  const [serviceRequests, setServiceRequests] = useState(mockServiceRequests);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusValue, setStatusValue] = useState('open');
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    estimatedCost: '',
  });
  const navigate = useNavigate();
  const { data: vendorsResponse = [] } = useQuery('vendors', fetchVendors);
  const { data: workOrdersResponse = [] } = useQuery(
    ['vendorWorkOrders', vendorProfile?.id],
    () => getWorkOrders(vendorProfile?.id ? { vendor: vendorProfile.id } : {}),
    { enabled: !!vendorProfile?.id }
  );
  
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

  const normalizedWorkOrders = useMemo(() => {
    const list = Array.isArray(workOrdersResponse)
      ? workOrdersResponse
      : (workOrdersResponse?.workOrders || workOrdersResponse?.data || []);
    const vendorId = vendorProfile?.id;
    return list
      .filter((wo) => (vendorId ? wo.vendor?.id === vendorId || wo.vendor === vendorId : true))
      .map((wo) => ({
        id: wo.woNumber || wo.id,
        title: wo.title,
        location: wo.location || '—',
        status: wo.status,
        priority: wo.priority,
        scheduledDate: wo.dueDate || wo.createdAt,
        assignedTech: wo.assignedTo?.name || 'Unassigned',
        description: wo.description || '',
        estimatedHours: wo.estimatedHours || 0,
        notesCount: Array.isArray(wo.comments) ? wo.comments.length : 0,
        attachmentsCount: Array.isArray(wo.attachments) ? wo.attachments.length : 0,
        completedDate: wo.completionDate || null
      }));
  }, [workOrdersResponse, auth?.user?.id]);

  const derivedVendorData = useMemo(() => {
    const active = normalizedWorkOrders.filter((wo) => wo.status !== 'completed').length;
    const completed = normalizedWorkOrders.filter((wo) => wo.status === 'completed').length;
    return {
      id: vendorProfile?.id || 'vendor',
      name: vendorProfile?.name || 'Vendor',
      rating: vendorProfile?.rating || 0,
      totalSpend: 0,
      monthlySpend: 0,
      activeWorkOrders: active,
      completedOrders: completed,
      nextPaymentDate: '—'
    };
  }, [normalizedWorkOrders, vendorProfile]);

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

  const handleSaveStatus = () => {
    if (!selectedWorkOrder) return;
    setWorkOrders((prev) =>
      prev.map((wo) =>
        wo.id === selectedWorkOrder.id
          ? {
              ...wo,
              status: statusValue,
              completedDate: statusValue === 'completed'
                ? new Date().toISOString().slice(0, 10)
                : wo.completedDate,
            }
          : wo
      )
    );
    setStatusOpen(false);
    setSelectedWorkOrder(null);
  };

  const handleRequestChange = (field, value) => {
    setRequestForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    if (!requestForm.title.trim() || !requestForm.description.trim()) {
      return;
    }

    const nextId = `SR-${new Date().getFullYear()}-${String(serviceRequests.length + 1).padStart(3, '0')}`;
    const newRequest = {
      id: nextId,
      title: requestForm.title.trim(),
      description: requestForm.description.trim(),
      status: 'submitted',
      priority: requestForm.priority,
      requestDate: new Date().toISOString().slice(0, 10),
      estimatedCost: requestForm.estimatedCost ? Number(requestForm.estimatedCost) : null,
      attachments: 0,
    };

    setServiceRequests((prev) => [newRequest, ...prev]);
    setRequestForm({ title: '', description: '', priority: 'medium', estimatedCost: '' });
    setRequestOpen(false);
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
      `Issue Date: ${invoice.date}`,
      `Due Date: ${invoice.dueDate}`,
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
                            <p className="font-medium text-gray-900 dark:text-white">{wo.id}</p>
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

                {serviceRequests.map((req) => (
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
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Request Date</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(req.requestDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Estimated Cost</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          ${req.estimatedCost ? req.estimatedCost.toLocaleString() : 'TBD'}
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
                    {req.status === 'approved' && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-3">
                        Approved on {new Date(req.approvedDate).toLocaleDateString()} - Work order will be created
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              <div className="space-y-3">
                {mockInvoices.map((invoice) => (
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
                              {new Date(invoice.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">Due Date</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {new Date(invoice.dueDate).toLocaleDateString()}
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
                ))}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-3">
                {mockDocuments.map((doc) => (
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
                          <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                          <span>|</span>
                          <span>{doc.size}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                {/* On-Time Completion */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">On-Time Completion</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">This Month</span>
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">92%</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 dark:bg-emerald-500" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Last Month</span>
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">87%</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-700 dark:bg-indigo-500" style={{ width: '87%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quality Rating */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quality Rating</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Customer Satisfaction</span>
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">4.8/5</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 dark:bg-emerald-500" style={{ width: '96%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Work Quality</span>
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">4.6/5</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-700 dark:bg-indigo-500" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Response Time */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Response Time</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Average Response</span>
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">2.3 hours</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Fastest Response</span>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">15 minutes</span>
                    </div>
                  </div>
                </div>

                {/* Compliance */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Compliance</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Safety Standards</span>
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100">
                        Compliant
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">License Status</span>
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100">
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
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




