import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Users,
  CheckCircle2,
  TrendingUp,
  Star,
  Clock,
  Award,
  Eye,
  BarChart3,
  Target
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
import { fetchAllLeaves, fetchPendingLeaves, approveLeave, rejectLeave } from '@/api/leave';
import { toast } from 'react-toastify';
import { fetchMembers, updateCertificateStatus } from '@/api/org';
import { getWorkOrders, assignWorkOrder } from '@/api/workOrders';
import { getCertificateUrl } from '@/api/profile';

// StatCard Component
const StatCard = ({ icon: Icon, label, value, color = 'indigo' }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className={`bg-white dark:bg-zinc-800 p-4 rounded-lg border border-gray-200 dark:border-zinc-700`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
      <Icon className={`h-5 w-5 text-${color}-600`} />
    </div>
  </motion.div>
);

// Staff Card Component
const StaffCard = ({ staff, onSelect }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'on_leave':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onSelect}
      className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-4 cursor-pointer hover:shadow-lg transition-all"
    >
      <div className="flex items-start gap-3 mb-3">
        <img
          src={staff.avatar}
          alt={staff.name}
          className="h-12 w-12 rounded-full"
        />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">{staff.name}</h3>
            {staff.role === 'technician' && (
              <Badge className={staff.isCertified
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
              }>
                {staff.isCertified ? 'Verified' : 'Unverified'}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{staff.role}</p>
        </div>
        <Badge className={getStatusColor(staff.status)}>
          <span className="flex items-center gap-1">
            {staff.status === 'active' ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {staff.status === 'active' ? 'Active' : 'On Leave'}
          </span>
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div>
          <p className="text-gray-600 dark:text-gray-400">Assigned</p>
          <p className="font-semibold text-gray-900 dark:text-white">{staff.assignedOrders} orders</p>
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-400">Performance</p>
          <p className="font-semibold text-indigo-600">{staff.performance}%</p>
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-400">Completed</p>
          <p className="font-semibold text-gray-900 dark:text-white">{staff.completedOrders}</p>
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-400">Rating</p>
          <p className="font-semibold text-amber-600 flex items-center gap-1">
            <Star className="h-3 w-3" />
            {staff.rating}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 text-xs text-gray-700 dark:text-gray-200">
          <Eye className="h-3 w-3 mr-1" />
          View
        </Button>
      </div>
    </motion.div>
  );
};

const getCertStatus = (cert) => {
  if (!cert) return 'pending';
  if (typeof cert === 'string') return 'approved';
  return cert.status || 'approved';
};

const formatCertName = (cert) => {
  if (!cert) return 'Certificate';
  if (typeof cert === 'string') {
    const cleaned = cert.split('?')[0];
    const parts = cleaned.split('/');
    return parts[parts.length - 1] || 'Certificate';
  }
  return cert.originalName || cert.publicId || 'Certificate';
};

export default function StaffManagement() {
  const [staffMembers, setStaffMembers] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [performanceModalOpen, setPerformanceModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [managementView, setManagementView] = useState('staff');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [leaveFilters, setLeaveFilters] = useState({
    status: 'all',
    type: 'all',
    staff: '',
    from: '',
    to: '',
  });
  const [decisionNotes, setDecisionNotes] = useState({});
  const [approveState, setApproveState] = useState({});
  const [rejectState, setRejectState] = useState({});
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [certActionLoading, setCertActionLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const memberRes = await fetchMembers({ includeStats: true, limit: 200 });
        const list = Array.isArray(memberRes) ? memberRes : (memberRes?.members || memberRes?.data || []);
        if (active) setStaffMembers(list);
      } catch (error) {
        if (active) setStaffMembers([]);
      }
      try {
        const ordersRes = await getWorkOrders({ page: 1, limit: 500 });
        const list = Array.isArray(ordersRes)
          ? ordersRes
          : (ordersRes?.workOrders || ordersRes?.data || []);
        if (active) setWorkOrders(list);
      } catch (error) {
        if (active) setWorkOrders([]);
      }
      try {
        const approved = await fetchAllLeaves({ status: 'approved' });
        if (active) setApprovedLeaves(Array.isArray(approved) ? approved : []);
      } catch (error) {
        if (active) setApprovedLeaves([]);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const onLeaveStaffIds = useMemo(() => {
    const now = new Date();
    return new Set(
      approvedLeaves
        .filter((leave) => {
          const start = leave.startDate ? new Date(leave.startDate) : null;
          const end = leave.endDate ? new Date(leave.endDate) : null;
          if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
          return start <= now && now <= end;
        })
        .map((leave) => leave.staff?._id || leave.staff?.id || leave.staff)
        .filter(Boolean)
    );
  }, [approvedLeaves]);

  const normalizedStaff = useMemo(() => {
    return staffMembers.map((member) => {
      const id = member.id || member._id;
      const name = member.name || [member.firstName, member.lastName].filter(Boolean).join(' ') || member.email || 'Staff';
      const performance = Number.isFinite(member.performanceScore)
        ? member.performanceScore
        : 0;
      const rating = Number.isFinite(member.rating)
        ? member.rating
        : 0;
      const completedOrders = Number.isFinite(member.completedOrders)
        ? member.completedOrders
        : 0;
      const assignedOrders = Number.isFinite(member.assignedOrders)
        ? member.assignedOrders
        : 0;
      const certificateList = Array.isArray(member.certificates) ? member.certificates : [];
      const certificationsApproved = Number.isFinite(member.certifications)
        ? member.certifications
        : certificateList.filter((cert) => getCertStatus(cert) === 'approved').length;
      const certificationsPending = Number.isFinite(member.certificationsPending)
        ? member.certificationsPending
        : certificateList.filter((cert) => getCertStatus(cert) === 'pending').length;
      return {
        id,
        name,
        role: member.role || 'staff',
        department: member.department || 'General',
        status: onLeaveStaffIds.has(id) ? 'on_leave' : (member.active === false ? 'inactive' : 'active'),
        avatar: member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        email: member.email || '—',
        phone: member.phone || '—',
        assignedOrders,
        completedOrders,
        performance,
        rating,
        certificates: certificateList,
        certifications: certificationsApproved,
        certificationsPending,
        isCertified: certificationsApproved > 0,
        lastActive: member.lastActive || member.lastLogin || member.updatedAt || member.createdAt,
        joinDate: member.createdAt
      };
    });
  }, [staffMembers, onLeaveStaffIds]);

  const kpi = useMemo(() => {
    const totalStaff = normalizedStaff.length;
    const activeAssignments = workOrders.filter((order) =>
      ['open', 'assigned', 'in_progress', 'on_hold'].includes(order.status)
    ).length;
    const completed = workOrders.filter((order) => order.status === 'completed').length;
    const completionRate = workOrders.length ? Math.round((completed / workOrders.length) * 100) : 0;
    const rated = normalizedStaff.filter((staff) => staff.rating > 0);
    const teamRating = rated.length
      ? Math.round((rated.reduce((sum, staff) => sum + staff.rating, 0) / rated.length) * 10) / 10
      : 0;
    return { totalStaff, activeAssignments, completionRate, teamRating };
  }, [normalizedStaff, workOrders]);

  const getCertificatesForStaff = (staff) => Array.isArray(staff?.certificates) ? staff.certificates : [];

  const handleReviewCertificate = async (staff, cert, status) => {
    if (!staff?.id) return;
    const publicId = typeof cert === 'string' ? cert : cert.publicId;
    if (!publicId) return;
    setCertActionLoading(true);
    try {
      const result = await updateCertificateStatus(staff.id, { publicId, status });
      const updatedCert = result?.certificate;
      setStaffMembers((prev) =>
        prev.map((member) => {
          if ((member.id || member._id) !== staff.id) return member;
          const certs = Array.isArray(member.certificates) ? member.certificates : [];
          const nextCerts = certs.map((entry) => {
            const entryId = typeof entry === 'string' ? entry : entry.publicId;
            if (entryId !== publicId) return entry;
            return updatedCert || entry;
          });
          return { ...member, certificates: nextCerts };
        })
      );
      setSelectedStaff((prev) => {
        if (!prev) return prev;
        const nextCerts = getCertificatesForStaff(prev).map((entry) => {
          const entryId = typeof entry === 'string' ? entry : entry.publicId;
          if (entryId !== publicId) return entry;
          return updatedCert || entry;
        });
        return { ...prev, certificates: nextCerts };
      });
      toast.success(status === 'approved' ? 'Certificate approved' : 'Certificate rejected');
    } catch (error) {
      // handled by interceptor
    } finally {
      setCertActionLoading(false);
    }
  };

  const handleViewCertificate = async (staff, cert) => {
    try {
      const publicId = typeof cert === 'string' ? cert : cert.publicId;
      if (!publicId) return;
      const data = await getCertificateUrl({ publicId, userId: staff.id });
      if (data?.url) {
        window.open(data.url, '_blank', 'noopener');
      }
    } catch (error) {
      toast.error('Unable to open certificate');
    }
  };


  const filteredStaff = useMemo(() => {
    return normalizedStaff.filter((staff) => {
      if (statusFilter !== 'all' && staff.status !== statusFilter) return false;
      if (roleFilter !== 'all' && staff.role !== roleFilter) return false;
      if (search && !staff.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, statusFilter, roleFilter, normalizedStaff]);

  const roleOptions = useMemo(() => {
    const set = new Set(normalizedStaff.map((staff) => staff.role).filter(Boolean));
    return Array.from(set);
  }, [normalizedStaff]);

  const handleAddNote = () => {
    if (newNote.trim()) {
      alert(`Note added for ${selectedStaff.name}`);
      setNoteModalOpen(false);
      setNewNote('');
    } else {
      alert('Please enter a note');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'TBD';
    return date.toLocaleDateString();
  };

  const getLeaveStatusClass = (status) => {
    if (status === 'approved' || status === 'Approved') {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    }
    if (status === 'rejected' || status === 'Rejected') {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
    }
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
  };

  const loadLeaves = async () => {
    setLeaveLoading(true);
    try {
      const [pending, all, approved] = await Promise.all([
        fetchPendingLeaves(),
        fetchAllLeaves({
          status: leaveFilters.status !== 'all' ? leaveFilters.status : undefined,
          type: leaveFilters.type !== 'all' ? leaveFilters.type : undefined,
          staff: leaveFilters.staff || undefined,
          from: leaveFilters.from || undefined,
          to: leaveFilters.to || undefined,
        }),
        fetchAllLeaves({ status: 'approved' }),
      ]);
      setPendingLeaveRequests(Array.isArray(pending) ? pending : []);
      setLeaveRequests(Array.isArray(all) ? all : []);
      setApprovedLeaves(Array.isArray(approved) ? approved : []);
    } catch (error) {
      // handled by interceptor
    } finally {
      setLeaveLoading(false);
    }
  };

  useEffect(() => {
    if (managementView !== 'leave') return;
    loadLeaves();
  }, [managementView]);

  const handleApproveLeave = async (request) => {
    try {
      const note = decisionNotes[request._id] || '';
      setApproveState((prev) => ({ ...prev, [request._id]: 'loading' }));
      await approveLeave(request._id, note);
      toast.success('Leave approved');
      setPendingLeaveRequests((prev) => prev.filter((r) => r._id !== request._id));
      setDecisionNotes((prev) => ({ ...prev, [request._id]: '' }));
      loadLeaves();
      setApproveState((prev) => ({ ...prev, [request._id]: 'done' }));
      setTimeout(() => setApproveState((prev) => ({ ...prev, [request._id]: 'idle' })), 2000);
    } catch (error) {
      // handled by interceptor
      setApproveState((prev) => ({ ...prev, [request._id]: 'idle' }));
    }
  };

  const handleRejectLeave = async (request) => {
    try {
      const note = decisionNotes[request._id] || '';
      if (!note.trim()) {
        toast.error('Rejection note is required.');
        return;
      }
      setRejectState((prev) => ({ ...prev, [request._id]: 'loading' }));
      await rejectLeave(request._id, note);
      toast.success('Leave rejected');
      setPendingLeaveRequests((prev) => prev.filter((r) => r._id !== request._id));
      setDecisionNotes((prev) => ({ ...prev, [request._id]: '' }));
      loadLeaves();
      setRejectState((prev) => ({ ...prev, [request._id]: 'done' }));
      setTimeout(() => setRejectState((prev) => ({ ...prev, [request._id]: 'idle' })), 2000);
    } catch (error) {
      // handled by interceptor
      setRejectState((prev) => ({ ...prev, [request._id]: 'idle' }));
    }
  };

  const exportLeaveHistory = () => {
    if (!leaveRequests.length) {
      toast.info('No leave records to export');
      return;
    }
    const rows = [
      ['Staff', 'Email', 'Type', 'Start Date', 'End Date', 'Status', 'Reason'],
      ...leaveRequests.map((leave) => [
        `${leave.staff?.firstName || ''} ${leave.staff?.lastName || ''}`.trim(),
        leave.staff?.email || '',
        leave.type,
        formatDate(leave.startDate),
        formatDate(leave.endDate),
        leave.status,
        leave.reason?.replace(/\n/g, ' ') || ''
      ])
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leave-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAssignWork = async () => {
    if (!selectedWorkOrderId) {
      alert('Select a work order to assign.');
      return;
    }

    const selectedOrder = workOrders.find((order) => (order.id || order._id) === selectedWorkOrderId);
    const orderLabel = selectedOrder ? `${selectedOrder.woNumber} - ${selectedOrder.title}` : selectedWorkOrderId;
    const dueLabel = assignmentDueDate ? ` (Due ${assignmentDueDate})` : '';

    try {
      await assignWorkOrder(selectedWorkOrderId, selectedStaff.id);
      setWorkOrders((prev) =>
        prev.map((order) => (order.id === selectedWorkOrderId || order._id === selectedWorkOrderId
          ? { ...order, assignedTo: { id: selectedStaff.id, name: selectedStaff.name }, status: 'assigned' }
          : order
        ))
      );
      alert(`Work order assigned to ${selectedStaff.name}: ${orderLabel}${dueLabel}`);
    } catch (error) {
      alert('Failed to assign work order.');
    }
    setAssignmentModalOpen(false);
    setSelectedWorkOrderId('');
    setAssignmentDueDate('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Staff Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage team members, assignments, and performance</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Staff"
          value={kpi.totalStaff}
          color="indigo"
        />
        <StatCard
          icon={Target}
          label="Active Assignments"
          value={kpi.activeAssignments}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Completion Rate"
          value={`${kpi.completionRate}%`}
          color="emerald"
        />
        <StatCard
          icon={Award}
          label="Team Rating"
          value={
            <span className="flex items-center gap-1">
              {kpi.teamRating || '—'}
              <Star className="h-4 w-4 text-amber-500" />
            </span>
          }
          color="amber"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={managementView === 'staff' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setManagementView('staff')}
          className={managementView === 'staff' ? '' : 'text-gray-700 dark:text-gray-200'}
        >
          Staff Directory
        </Button>
        <Button
          variant={managementView === 'leave' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setManagementView('leave')}
          className={managementView === 'leave' ? '' : 'text-gray-700 dark:text-gray-200'}
        >
          Leave Approvals
        </Button>
      </div>

      {managementView === 'leave' ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Leave Approvals</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pending requests need manager action.
                </p>
              </div>
              <Button size="sm" variant="outline" className="text-gray-700 dark:text-gray-200" onClick={exportLeaveHistory}>
                Export History
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
              <Input
                placeholder="Staff ID"
                value={leaveFilters.staff}
                onChange={(e) => setLeaveFilters((prev) => ({ ...prev, staff: e.target.value }))}
                className="text-gray-900 dark:text-gray-100"
              />
              <Select
                value={leaveFilters.status}
                onValueChange={(value) => setLeaveFilters((prev) => ({ ...prev, status: value }))}
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
              <Select
                value={leaveFilters.type}
                onValueChange={(value) => setLeaveFilters((prev) => ({ ...prev, type: value }))}
              >
              <SelectTrigger className="h-10 bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="dark:bg-zinc-900 dark:text-gray-100">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                  <SelectItem value="Sick">Sick</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={leaveFilters.from}
                onChange={(e) => setLeaveFilters((prev) => ({ ...prev, from: e.target.value }))}
                className="text-gray-900 dark:text-gray-100"
              />
              <Input
                type="date"
                value={leaveFilters.to}
                onChange={(e) => setLeaveFilters((prev) => ({ ...prev, to: e.target.value }))}
                className="text-gray-900 dark:text-gray-100"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-gray-700 dark:text-gray-200" onClick={loadLeaves}>
                  Apply Filters
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-gray-700 dark:text-gray-200"
                  onClick={() => {
                    setLeaveFilters({ status: 'all', type: 'all', staff: '', from: '', to: '' });
                    setTimeout(loadLeaves, 0);
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>

            {pendingLeaveRequests.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No pending leave approvals.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingLeaveRequests.map((request) => (
                  <div
                    key={request._id}
                    className="rounded-lg border border-gray-200 dark:border-zinc-700 p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {request.staff?.firstName} {request.staff?.lastName}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {request.type} leave
                        </p>
                      </div>
                      <Badge className={getLeaveStatusClass(request.status)}>
                        {request.status?.toUpperCase?.() || request.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {formatDate(request.startDate)} - {formatDate(request.endDate)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Reason: {request.reason || '—'}
                    </p>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        Manager note (optional)
                      </label>
                      <textarea
                        rows={2}
                        value={decisionNotes[request._id] || ''}
                        onChange={(event) =>
                          setDecisionNotes((prev) => ({ ...prev, [request._id]: event.target.value }))
                        }
                        className="mt-1 w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleApproveLeave(request)}
                      disabled={approveState[request._id] === 'loading'}
                    >
                      {approveState[request._id] === 'loading'
                        ? 'Approving...'
                        : approveState[request._id] === 'done'
                          ? 'Approved'
                          : 'Approve'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-500/60 dark:text-rose-300 dark:hover:bg-rose-900/30"
                      onClick={() => handleRejectLeave(request)}
                      disabled={rejectState[request._id] === 'loading'}
                    >
                      {rejectState[request._id] === 'loading'
                        ? 'Rejecting...'
                        : rejectState[request._id] === 'done'
                          ? 'Rejected'
                          : 'Reject'}
                    </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Leave History</h4>
              {leaveLoading ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading history...</p>
              ) : leaveRequests.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">No leave history yet.</p>
              ) : (
                <div className="space-y-2">
                  {leaveRequests.slice(0, 8).map((leave) => (
                    <div
                      key={leave._id}
                      className="rounded-lg border border-gray-200 dark:border-zinc-700 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {leave.staff?.firstName} {leave.staff?.lastName}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {leave.type} • {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                          </p>
                        </div>
                        <Badge className={getLeaveStatusClass(leave.status)}>
                          {leave.status?.toUpperCase?.() || leave.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search staff..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-10 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 hover:border-gray-300 dark:hover:border-zinc-600 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-700/50 font-medium text-gray-900 dark:text-gray-100 hover:from-emerald-100 hover:to-green-100 dark:hover:from-emerald-900/50 dark:hover:to-green-900/50 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all cursor-pointer">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-zinc-900 dark:text-gray-100">
                    <SelectItem value="all" className="bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold py-2 hover:from-emerald-700 hover:to-green-700 cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-white"></span>
                        All Status
                      </span>
                    </SelectItem>
                    <SelectItem value="active" className="hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer">Active</SelectItem>
                    <SelectItem value="on_leave" className="hover:bg-amber-50 dark:hover:bg-amber-900/30 cursor-pointer">On Leave</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="h-10 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-700/50 font-medium text-gray-900 dark:text-gray-100 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/50 dark:hover:to-pink-900/50 hover:border-purple-300 dark:hover:border-purple-600 transition-all cursor-pointer">
                    <SelectValue placeholder="Filter by Role" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-zinc-900 dark:text-gray-100">
                    <SelectItem value="all" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-2 hover:from-purple-700 hover:to-pink-700 cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-white"></span>
                        All Roles
                      </span>
                    </SelectItem>
                    {roleOptions.map((role) => (
                      <SelectItem key={role} value={role} className="hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer">
                        {role.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Staff Grid */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Team Members ({filteredStaff.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((staff) => (
                <StaffCard
                  key={staff.id}
                  staff={staff}
                  onSelect={() => setSelectedStaff(staff)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Staff Detail Modal */}
      <AnimatePresence>
        {selectedStaff && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedStaff(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <CardHeader className="border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-2xl text-gray-900 dark:text-white">
                        {selectedStaff.name}
                      </CardTitle>
                      {selectedStaff.role === 'technician' && (
                        <Badge className={selectedStaff.isCertified
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                        }>
                          {selectedStaff.isCertified ? 'Verified' : 'Unverified'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedStaff.role} - {selectedStaff.department}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedStaff(null)}
                  >
                    <span className="text-lg leading-none">x</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Contact Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedStaff.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Phone</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedStaff.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Join Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(selectedStaff.joinDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Active</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(selectedStaff.lastActive)}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Performance Metrics */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-700/50">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-indigo-600" />
                    Performance Metrics
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Overall Performance</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
                            style={{ width: `${selectedStaff.performance}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedStaff.performance}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rating</p>
                      <p className="text-xl font-bold text-amber-600 flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        {selectedStaff.rating}/5.0
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Certifications</p>
                    <p className="text-xl font-bold text-emerald-600 flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      {selectedStaff.certifications}
                    </p>
                    {selectedStaff.certificationsPending > 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        {selectedStaff.certificationsPending} pending
                      </p>
                    )}
                  </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed Orders</p>
                      <p className="text-xl font-bold text-blue-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        {selectedStaff.completedOrders}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Certificates */}
                <div className="rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4 text-emerald-600" />
                    Certificates
                  </h4>
                  {getCertificatesForStaff(selectedStaff).length === 0 ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No certificates uploaded.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {getCertificatesForStaff(selectedStaff).map((cert) => {
                        const status = getCertStatus(cert);
                        const isPdf = typeof cert === 'object' && cert?.mimeType === 'application/pdf';
                        const label = formatCertName(cert);
                        const uploadedAt = cert?.uploadedAt ? new Date(cert.uploadedAt).toLocaleDateString() : '';
                        return (
                          <div
                            key={typeof cert === 'string' ? cert : cert.publicId}
                            className="rounded-lg border border-gray-200 dark:border-zinc-700 p-3"
                          >
                            <div className="flex items-center gap-3">
                              {isPdf ? (
                                <div className="h-10 w-10 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-semibold">
                                  PDF
                                </div>
                              ) : (
                                <div className="h-10 w-10 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                                  IMG
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[160px]">
                                  {label}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {uploadedAt || 'Uploaded'}
                                </p>
                              </div>
                              <Badge className={
                                status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                  : status === 'rejected'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                              }>
                                {status}
                              </Badge>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => handleViewCertificate(selectedStaff, cert)}
                              >
                                View
                              </Button>
                              {status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={() => handleReviewCertificate(selectedStaff, cert, 'approved')}
                                    disabled={certActionLoading}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                                    onClick={() => handleReviewCertificate(selectedStaff, cert, 'rejected')}
                                    disabled={certActionLoading}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Assignment Summary */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">Active Assignments</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedStaff.assignedOrders} orders</p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-zinc-800">
                  <Button
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white"
                    onClick={() => setAssignmentModalOpen(true)}
                  >
                    Assign Work
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-gray-700 dark:text-gray-200"
                    onClick={() => setPerformanceModalOpen(true)}
                  >
                    View Performance
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-gray-700 dark:text-gray-200"
                    onClick={() => setNoteModalOpen(true)}
                  >
                    Add Note
                  </Button>
                </div>
              </CardContent>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Performance Modal */}
      <AnimatePresence>
        {performanceModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setPerformanceModalOpen(false)}
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
                  Performance Analysis
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Overall Score: {selectedStaff.performance}%
                  </p>
                  <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
                      style={{ width: `${selectedStaff.performance}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded">
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">Completed</p>
                    <p className="text-xl font-bold text-emerald-600">{selectedStaff.completedOrders}</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded">
                    <p className="text-xs text-amber-700 dark:text-amber-300">Rating</p>
                    <p className="text-xl font-bold text-amber-600 flex items-center gap-1">
                      {selectedStaff.rating}
                      <Star className="h-4 w-4" />
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-zinc-800">
                <Button
                  variant="outline"
                  className="flex-1 text-gray-700 dark:text-gray-200"
                  onClick={() => setPerformanceModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assignment Modal */}
      <AnimatePresence>
        {assignmentModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setAssignmentModalOpen(false)}
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
                  Assign Work Order
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Work Order
                  </label>
                  <Select value={selectedWorkOrderId} onValueChange={setSelectedWorkOrderId}>
                  <SelectTrigger className="bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-gray-100">
                    <SelectValue placeholder="Choose a work order..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 dark:text-gray-100">
                    {workOrders.map((order) => (
                      <SelectItem key={order.id || order._id} value={order.id || order._id}>
                        {(order.woNumber || order.workOrderNumber || order.id || order._id)}: {order.title}
                      </SelectItem>
                    ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date
                  </label>
                  <Input
                    type="date"
                    value={assignmentDueDate}
                    onChange={(event) => setAssignmentDueDate(event.target.value)}
                    className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-zinc-800">
                <Button
                  variant="outline"
                  className="flex-1 text-gray-700 dark:text-gray-200"
                  onClick={() => setAssignmentModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white"
                  onClick={handleAssignWork}
                >
                  Assign
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note Modal */}
      <AnimatePresence>
        {noteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setNoteModalOpen(false)}
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
                  Add Staff Note
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Note Content
                  </label>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter your note here..."
                    className="w-full h-32 p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-zinc-800">
                <Button
                  variant="outline"
                  className="flex-1 text-gray-700 dark:text-gray-200"
                  onClick={() => setNoteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white"
                  onClick={() => handleAddNote()}
                >
                  Save Note
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


