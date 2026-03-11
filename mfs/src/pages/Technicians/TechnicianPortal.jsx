import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  MapPin,
  Wrench,
  Star,
  MessageSquare,
  Download,
  Filter,
  Eye,
  AlertTriangle,
  DollarSign,
  FileText,
  Plus,
  Trash2,
  Upload
} from 'lucide-react';
import { toast } from 'react-toastify';
import { sendMessageToAdmins } from '../../api/notifications';

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
import GreetingBanner from '@/components/common/GreetingBanner';
import { useQuery, useQueryClient } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkOrders } from '../../api/workOrders';
import { getProfile, deleteCertificate } from '../../api/profile';
import ProtectedImage from '@/components/common/ProtectedImage';

const getCertStatus = (cert) => {
  if (!cert) return 'pending';
  if (typeof cert === 'string') return 'approved';
  return cert.status || 'approved';
};

const formatCertLabel = (value) => {
  if (!value) return 'Certificate';
  if (typeof value === 'string') {
    const cleaned = value.split('?')[0];
    const parts = cleaned.split('/');
    return parts[parts.length - 1] || 'Certificate';
  }
  return value.originalName || value.publicId || 'Certificate';
};

// Priority badge color map
const priorityColorMap = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-blue-100 text-blue-800 border-blue-300'
};

const statusColorMap = {
  pending: 'bg-slate-100 text-slate-800 border-slate-300',
  scheduled: 'bg-blue-100 text-blue-800 border-blue-300',
  in_progress: 'bg-amber-100 text-amber-800 border-amber-300',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
  overdue: 'bg-rose-100 text-rose-800 border-rose-300',
};

// Stat Card Component
const StatCard = ({ icon, title, value, subtext, color = 'indigo' }) => {
  const bgColors = {
    indigo: 'bg-indigo-50 border-indigo-200',
    amber: 'bg-amber-50 border-amber-200',
    emerald: 'bg-emerald-50 border-emerald-200',
    rose: 'bg-rose-50 border-rose-200'
  };

  const textColors = {
    indigo: 'text-indigo-600',
    amber: 'text-amber-600',
    emerald: 'text-emerald-600',
    rose: 'text-rose-600'
  };

  return (
    <Card className={`border ${bgColors[color]}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{value}</p>
            {subtext && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtext}</p>}
          </div>
          <div className={`p-3 rounded-lg ${textColors[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Work Order Card Component
const WorkOrderCard = ({ order, onViewDetails }) => {
  const isOverdue = new Date(order.dueDate) < new Date() && order.status !== 'completed';
  const statusColor = statusColorMap[order.status] || statusColorMap.pending;
  const priorityColor = priorityColorMap[order.priority] || priorityColorMap.low;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-indigo-500">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                {order.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4" />
                {order.location}
              </div>
            </div>
            <Badge className={`${priorityColor} border`}>
              {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
            </Badge>
          </div>

          <div className="space-y-3">
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                <span className="text-sm font-bold text-indigo-600">{order.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${order.progress}%` }}
                />
              </div>
            </div>

            {/* Status & Dates */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Status</p>
                <Badge className={`${statusColor} border mt-1`}>
                  {formatStatusLabel(order.status)}
                </Badge>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Due Date</p>
                <p className={`font-medium mt-1 ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-900 dark:text-white'}`}>
                  {new Date(order.dueDate).toLocaleDateString()}
                  {isOverdue && <span className="ml-1 text-xs text-red-600">OVERDUE</span>}
                </p>
              </div>
            </div>

            {/* Hours & Asset */}
            <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 dark:bg-zinc-800 p-2 rounded">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Est. Hours</p>
                <p className="font-semibold text-gray-900 dark:text-white">{order.estimatedHours}h</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Asset</p>
                <p className="font-semibold text-gray-900 dark:text-white text-xs">{order.assetName}</p>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-sm text-blue-900 dark:text-blue-200 border-l-2 border-blue-500">
                {order.notes}
              </div>
            )}

            {/* Action Button */}
            <Button
              onClick={() => onViewDetails(order)}
              variant="outline"
              size="sm"
              className="w-full mt-2"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Technician Details Card Component
const TechnicianDetailsCard = ({ technician, metrics, onDeleteCertificate }) => {
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState('');

  const handleMessage = () => {
    setMessageOpen(true);
  };

  const handleDownloadProfile = () => {
    const certifications = Array.isArray(technician.certifications)
      ? technician.certifications.map((cert) => formatCertLabel(cert))
      : [];
    const csvHeader = [
      'name',
      'email',
      'phone',
      'department',
      'rating',
      'completedOrders',
      'onTimeCompletion',
      'avgCompletionHours',
      'certifications',
      'pending',
      'inProgress',
      'completedThisMonth'
    ].join(',');
    const rows = (certifications.length ? certifications : ['']).map((cert) => [
      technician.name,
      technician.email,
      technician.phone,
      technician.department,
      technician.rating,
      technician.completedOrders,
      technician.onTimeCompletion,
      technician.avgCompletionHours || 0,
      cert,
      metrics.pending,
      metrics.inProgress,
      metrics.totalThisMonth
    ]);
    const csvRows = rows
      .map((row) =>
        row
          .map((value) => {
            const safe = value === null || value === undefined ? '' : String(value);
            const escaped = safe.replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(',')
      )
      .join('\n');
    const csvContent = `${csvHeader}\n${csvRows}\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${technician.name || 'technician'}-profile.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      toast.error('Please enter a message');
      return;
    }
    try {
      await sendMessageToAdmins(messageText.trim());
      toast.success('Message sent to admin/facility manager');
      setMessageText('');
      setMessageOpen(false);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-200 dark:border-indigo-800">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <ProtectedImage
              src={technician.avatar}
              alt={technician.name}
              cacheKey={technician.updatedAt || technician.avatarUpdatedAt || ''}
              className="w-16 h-16 rounded-full border-2 border-indigo-300 object-cover"
              fallback="/avatar-placeholder.svg"
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{technician.name}</h2>
              <p className="text-indigo-600 dark:text-indigo-400 font-medium">{technician.department}</p>
              <div className="flex items-center gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(technician.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-1">
                  {technician.rating} ({technician.completedOrders} completed)
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleMessage} disabled={!technician.email}>
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadProfile}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">On-Time Rate</p>
            <p className="text-xl font-bold text-emerald-600">{technician.onTimeCompletion}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Certifications</p>
            <p className="text-lg font-bold text-indigo-600">
              {technician.certifications.filter((cert) => getCertStatus(cert) === 'approved').length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
            <p className="text-lg font-bold text-amber-600">{metrics.totalThisMonth}</p>
          </div>
        </div>

        {/* Certifications */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Certifications</p>
          <div className="flex gap-2 flex-wrap">
            {technician.certifications.map((cert) => {
              const status = getCertStatus(cert);
              return (
                <Badge
                  key={typeof cert === 'string' ? cert : cert.publicId}
                  variant="secondary"
                  className={
                    status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                      : status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200'
                  }
                >
                  <Wrench className="h-3 w-3 mr-1" />
                  {formatCertLabel(cert)} ({status})
                </Badge>
              );
            })}
          </div>
          {technician.certifications.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {technician.certifications.map((cert) => {
                const id = typeof cert === 'string' ? cert : cert.publicId;
                return (
                  <Button
                    key={id}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => onDeleteCertificate(id)}
                  >
                    Delete {formatCertLabel(cert)}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>

      <AnimatePresence>
        {messageOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setMessageOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-lg bg-white dark:bg-zinc-900 shadow-xl"
            >
              <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Message {technician.name || 'Technician'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Send an in-app message.
                </p>
              </div>
              <div className="p-6 space-y-4">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full h-32 p-3 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <Button variant="outline" className="flex-1" onClick={() => setMessageOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSendMessage}>
                  Send
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

// Main Technician Portal Component
export default function TechnicianPortal() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reportIssueOpen, setReportIssueOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({
    title: '',
    description: '',
    severity: 'medium',
    category: 'technical'
  });

  // Detail Modal States
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [newProgress, setNewProgress] = useState(0);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addPartModalOpen, setAddPartModalOpen] = useState(false);
  const [newPart, setNewPart] = useState({ name: '', cost: '', quantity: 1 });
  const [addCostModalOpen, setAddCostModalOpen] = useState(false);
  const [newCost, setNewCost] = useState({ description: '', amount: '', receipt: '' });

  const { data: workOrders = [], isLoading } = useQuery(
    ['workOrders', { scope: 'technician' }],
    () => getWorkOrders()
  );
  const { data: profileData } = useQuery(['profile'], () => getProfile(), {
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const handleDeleteCertificate = async (publicId) => {
    if (!publicId) return;
    try {
      await deleteCertificate(publicId);
      const currentCerts = Array.isArray(profileData?.certificates)
        ? profileData.certificates
        : (Array.isArray(user?.certificates) ? user.certificates : []);
      const nextCerts = currentCerts.filter((cert) => {
        const id = typeof cert === 'string' ? cert : cert.publicId;
        return id !== publicId;
      });
      updateUser({ certificates: nextCerts });
      await queryClient.invalidateQueries(['profile']);
      toast.success('Certificate deleted');
    } catch (error) {
      toast.error('Failed to delete certificate');
    }
  };

  const workOrdersList = Array.isArray(workOrders)
    ? workOrders
    : (workOrders?.workOrders || workOrders?.data || []);

  const currentUserId = user?.id || null;
  const currentUserName = user?.name || profileData?.name || 'Technician';

  const assignedOrders = useMemo(() => {
    return workOrdersList.filter((order) => {
      if (currentUserId) return order.assignedTo?.id === currentUserId;
      return order.assignedTo?.name === currentUserName;
    });
  }, [workOrdersList, currentUserId, currentUserName]);

  const normalizeStatus = (status, dueDate) => {
    if (status === 'overdue') return 'overdue';
    if (status === 'open') return 'pending';
    if (!status && dueDate && new Date(dueDate) < new Date()) return 'overdue';
    return status || 'pending';
  };

  const formatStatusLabel = (status) => {
    const map = {
      pending: 'Pending',
      scheduled: 'Scheduled',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      overdue: 'Overdue',
    };
    return map[status] || status;
  };

  const normalizedOrders = useMemo(() => {
    return assignedOrders.map((order) => {
      const dueDate = order.dueDate || order.scheduledDate || order.createdAt;
      const status = normalizeStatus(order.status, dueDate);
      const progress =
        status === 'completed' ? 100 : status === 'in_progress' ? 50 : 0;
      return {
        ...order,
        status,
        dueDate,
        progress,
        location: order.location?.name || order.location || '—',
        assetName: order.asset?.name || order.assetName || '—',
        estimatedHours: order.estimatedHours || 0,
        actualHours: order.actualHours || 0,
        notes: order.notes || order.description || '',
      };
    });
  }, [assignedOrders]);

  // Handle Update Progress
  const handleUpdateProgress = () => {
    if (newProgress >= 0 && newProgress <= 100) {
      setSelectedOrder({
        ...selectedOrder,
        progress: newProgress
      });
      setProgressModalOpen(false);
      setNewProgress(0);
      // Show success feedback
      alert(`✓ Progress updated to ${newProgress}%`);
    }
  };

  // Handle Add Note
  const handleAddNote = () => {
    if (newNote.trim()) {
      setSelectedOrder({
        ...selectedOrder,
        notes: (selectedOrder.notes ? selectedOrder.notes + '\n\n' : '') + newNote
      });
      setNoteModalOpen(false);
      setNewNote('');
      alert(`✓ Note added successfully`);
    } else {
      alert('⚠ Please enter a note');
    }
  };

  // Handle Complete Order
  const handleCompleteOrder = () => {
    setSelectedOrder({
      ...selectedOrder,
      status: 'completed'
    });
    setTimeout(() => {
      setSelectedOrder(null);
    }, 500);
    alert(`✓ Work Order marked as completed!`);
  };

  // Handle Add Part
  const handleAddPart = () => {
    if (newPart.name && newPart.cost) {
      const newPartObj = {
        id: Date.now(),
        name: newPart.name,
        cost: parseFloat(newPart.cost),
        originalCost: parseFloat(newPart.cost),
        quantity: newPart.quantity || 1
      };
      setSelectedOrder({
        ...selectedOrder,
        replacedParts: [...(selectedOrder.replacedParts || []), newPartObj]
      });
      setAddPartModalOpen(false);
      setNewPart({ name: '', cost: '', quantity: 1 });
      alert(`✓ Part "${newPart.name}" added successfully`);
    } else {
      alert('⚠ Please fill in part name and cost');
    }
  };

  // Handle Add Cost
  const handleAddCost = () => {
    if (newCost.description && newCost.amount) {
      const newCostObj = {
        id: Date.now(),
        description: newCost.description,
        amount: parseFloat(newCost.amount),
        date: new Date().toISOString(),
        receipt: newCost.receiptRef || null
      };
      setSelectedOrder({
        ...selectedOrder,
        extraCosts: [...(selectedOrder.extraCosts || []), newCostObj]
      });
      setAddCostModalOpen(false);
      setNewCost({ description: '', amount: '', receiptRef: '' });
      alert(`✓ Cost "$${newCost.amount}" added successfully`);
    } else {
      alert('⚠ Please fill in description and amount');
    }
  };

  // Handle Delete Part
  const handleDeletePart = (partId) => {
    setSelectedOrder({
      ...selectedOrder,
      replacedParts: selectedOrder.replacedParts.filter(p => p.id !== partId)
    });
    alert(`✓ Part removed`);
  };

  // Handle Delete Cost
  const handleDeleteCost = (costId) => {
    setSelectedOrder({
      ...selectedOrder,
      extraCosts: selectedOrder.extraCosts.filter(c => c.id !== costId)
    });
    alert(`✓ Cost removed`);
  };

  const filteredOrders = useMemo(() => {
    return normalizedOrders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && order.priority !== priorityFilter) return false;
      if (search && !order.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, statusFilter, priorityFilter, normalizedOrders]);

  const stats = useMemo(() => {
    const pending = normalizedOrders.filter(wo => wo.status === 'pending').length;
    const inProgress = normalizedOrders.filter(wo => wo.status === 'in_progress').length;
    const completed = normalizedOrders.filter(wo => wo.status === 'completed').length;
    return {
      pending,
      inProgress,
      completed,
    };
  }, [normalizedOrders]);

  const technicianProfile = useMemo(() => {
    const profile = profileData || user || {};
    const firstName = profile.firstName || '';
    const lastName = profile.lastName || '';
    const name = profile.name || [firstName, lastName].filter(Boolean).join(' ') || 'Technician';
    return {
      name,
      email: profile.email || '',
      phone: profile.phone || '—',
      department: profile.department || 'Technician',
      rating: typeof profile.rating === 'number' ? profile.rating : 0,
      completedOrders: profile.completedOrders ?? 0,
      onTimeCompletion: profile.onTimeCompletionRate ?? 0,
      certifications: Array.isArray(profile.certificates) ? profile.certificates : [],
      avatar: profile.avatar || '',
      avgCompletionHours: profile.avgCompletionHours ?? 0,
    };
  }, [profileData, user]);

  const technicianMetrics = useMemo(() => ({
    completedToday: 0,
    inProgress: stats.inProgress,
    pending: stats.pending,
    totalThisMonth: stats.completed,
    averageCompletionTime: technicianProfile.avgCompletionHours || 0,
    satisfactionRating: technicianProfile.rating || 0
  }), [stats, technicianProfile.rating, technicianProfile.avgCompletionHours]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <GreetingBanner subtitle="Here’s your workload and priorities for today." />
        {/* Technician Details */}
        <TechnicianDetailsCard
          technician={{
            ...technicianProfile,
            name: currentUserName,
          }}
          metrics={technicianMetrics}
          onDeleteCertificate={handleDeleteCertificate}
        />

        {/* KPI Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, idx) => (
              <Card key={idx} className="border">
                <CardContent className="p-4">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-zinc-800 rounded mb-3 animate-pulse" />
                  <div className="h-8 w-16 bg-gray-200 dark:bg-zinc-800 rounded mb-2 animate-pulse" />
                  <div className="h-3 w-20 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              icon={<AlertCircle className="h-5 w-5" />}
              title="Pending"
              value={stats.pending}
              color="rose"
              subtext="Awaiting assignment"
            />
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              title="In Progress"
              value={stats.inProgress}
              color="amber"
              subtext="Active work orders"
            />
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Completed"
              value={stats.completed}
              color="emerald"
              subtext="This month"
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              title="Avg Completion"
              value={`${technicianMetrics.averageCompletionTime}h`}
              color="indigo"
              subtext="Per order"
            />
            <StatCard
              icon={<Star className="h-5 w-5" />}
              title="Satisfaction"
              value={technicianMetrics.satisfactionRating}
              color="purple"
              subtext="Rating"
            />
          </div>
        )}

        {/* Filters Section */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-gray-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search work orders..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-700/50 font-medium hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/50 dark:hover:to-purple-900/50 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all cursor-pointer">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-900">
                  <SelectItem value="all" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-2 hover:from-indigo-700 hover:to-purple-700 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-white"></span>
                      All Status
                    </span>
                  </SelectItem>
                  <SelectItem value="pending" className="hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer">⏱️ Pending</SelectItem>
                  <SelectItem value="scheduled" className="hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer">📅 Scheduled</SelectItem>
                  <SelectItem value="in_progress" className="hover:bg-amber-50 dark:hover:bg-amber-900/30 cursor-pointer">⚙️ In Progress</SelectItem>
                  <SelectItem value="completed" className="hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer">✅ Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-10 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-700/50 font-medium hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/50 dark:hover:to-orange-900/50 hover:border-amber-300 dark:hover:border-amber-600 transition-all cursor-pointer">
                  <SelectValue placeholder="Filter by Priority" />
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-900">
                  <SelectItem value="all" className="bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold py-2 hover:from-amber-700 hover:to-orange-700 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-white"></span>
                      All Priorities
                    </span>
                  </SelectItem>
                  <SelectItem value="critical" className="hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer">🔴 Critical</SelectItem>
                  <SelectItem value="high" className="hover:bg-orange-50 dark:hover:bg-orange-900/30 cursor-pointer">🟠 High</SelectItem>
                  <SelectItem value="medium" className="hover:bg-yellow-50 dark:hover:bg-yellow-900/30 cursor-pointer">🟡 Medium</SelectItem>
                  <SelectItem value="low" className="hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer">🔵 Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Work Orders Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Work Orders ({filteredOrders.length})
          </h2>
          
          {isLoading ? (
            <Card className="text-center p-8">
              <p className="text-gray-500 dark:text-gray-400">Loading work orders...</p>
            </Card>
          ) : filteredOrders.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <AnimatePresence>
                {filteredOrders.map((order) => (
                  <WorkOrderCard
                    key={order.id}
                    order={order}
                    onViewDetails={setSelectedOrder}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <Card className="text-center p-8">
              <p className="text-gray-500 dark:text-gray-400">No work orders found matching your criteria</p>
            </Card>
          )}
        </div>

        {/* Work Order Details Modal */}
        <AnimatePresence>
          {selectedOrder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedOrder(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-zinc-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedOrder.title}</h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>

                <CardContent className="p-6 space-y-6">
                  {/* Order ID & Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Work Order ID</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedOrder.id}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={`${statusColorMap[selectedOrder.status]} border mb-2`}>
                        {formatStatusLabel(selectedOrder.status)}
                      </Badge>
                      <Badge className={`${priorityColorMap[selectedOrder.priority]} border ml-2`}>
                        {selectedOrder.priority}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Asset</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.assetName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Due Date</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {new Date(selectedOrder.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Hours</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.estimatedHours}h</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900 dark:text-white">Progress</p>
                      <p className="text-lg font-bold text-indigo-600">{selectedOrder.progress}%</p>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all"
                        style={{ width: `${selectedOrder.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white mb-2">Description</p>
                    <p className="text-gray-600 dark:text-gray-400">{selectedOrder.description}</p>
                  </div>

                  {/* Materials */}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white mb-2">Materials Required</p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedOrder.materials.map((material, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-zinc-800 rounded">
                          <Wrench className="h-4 w-4 text-indigo-600" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{material}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedOrder.notes && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">Notes</p>
                      <p className="text-sm text-blue-800 dark:text-blue-300">{selectedOrder.notes}</p>
                    </div>
                  )}

                  {/* Replaced Parts Section */}
                  <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-indigo-600" />
                        Replaced Parts
                      </h4>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8"
                        onClick={() => setAddPartModalOpen(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Part
                      </Button>
                    </div>
                    {selectedOrder.replacedParts && selectedOrder.replacedParts.length > 0 ? (
                      <div className="space-y-2">
                        {selectedOrder.replacedParts.map((part) => (
                          <div key={part.id} className="bg-white dark:bg-zinc-700 p-3 rounded flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{part.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Qty: {part.quantity} | Cost: ${part.originalCost * part.quantity}
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-red-600"
                              onClick={() => handleDeletePart(part.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No parts replaced yet</p>
                    )}
                  </div>

                  {/* Extra Costs Section */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-amber-600" />
                        Extra Costs
                      </h4>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8"
                        onClick={() => setAddCostModalOpen(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Cost
                      </Button>
                    </div>
                    {selectedOrder.extraCosts && selectedOrder.extraCosts.length > 0 ? (
                      <div className="space-y-2 mb-3">
                        {selectedOrder.extraCosts.map((cost) => (
                          <div key={cost.id} className="bg-white dark:bg-zinc-700 p-3 rounded">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{cost.description}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {new Date(cost.date).toLocaleDateString()}
                                </p>
                                {cost.receipt && (
                                  <div className="flex items-center gap-1 mt-2">
                                    <FileText className="h-3 w-3 text-indigo-600" />
                                    <a href="#" className="text-xs text-indigo-600 hover:underline">
                                      {cost.receipt}
                                    </a>
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-amber-600">${cost.amount}</p>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 text-red-600 mt-1"
                                  onClick={() => handleDeleteCost(cost.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2 mb-3">No extra costs recorded</p>
                    )}
                    {selectedOrder.totalExtraCost > 0 && (
                      <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded flex items-center justify-between">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Total Extra Cost:</p>
                        <p className="text-lg font-bold text-amber-700 dark:text-amber-300">${selectedOrder.totalExtraCost}</p>
                      </div>
                    )}
                  </div>

                  {/* Report Issue Section */}
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-700">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Report an Issue</h4>
                    </div>
                    <Button 
                      onClick={() => setReportIssueOpen(true)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Report Issue with This Work Order
                    </Button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-zinc-800">
                    <Button 
                      className="flex-1 bg-blue-700 hover:bg-blue-800 text-white"
                      onClick={() => setProgressModalOpen(true)}
                    >
                      Update Progress
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setNoteModalOpen(true)}
                    >
                      Add Note
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleCompleteOrder()}
                    >
                      Complete Order
                    </Button>
                  </div>
                </CardContent>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Update Progress Modal */}
        <AnimatePresence>
          {progressModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setProgressModalOpen(false)}
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
                    Update Progress
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Progress: {newProgress}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={newProgress}
                      onChange={(e) => setNewProgress(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Drag to set progress from 0% to 100%
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-zinc-800">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setProgressModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white"
                    onClick={() => handleUpdateProgress()}
                  >
                    Update
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Note Modal */}
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
                    Add Work Note
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
                    className="flex-1"
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

        {/* Add Part Modal */}
        <AnimatePresence>
          {addPartModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setAddPartModalOpen(false)}
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
                    Add Replaced Part
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Part Name
                    </label>
                    <input
                      type="text"
                      value={newPart.name || ''}
                      onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                      placeholder="e.g., Motor Bearing"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newPart.quantity || 1}
                      onChange={(e) => setNewPart({ ...newPart, quantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cost ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newPart.cost || ''}
                      onChange={(e) => setNewPart({ ...newPart, cost: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-zinc-800">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setAddPartModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white"
                    onClick={() => handleAddPart()}
                  >
                    Add Part
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Cost Modal */}
        <AnimatePresence>
          {addCostModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setAddCostModalOpen(false)}
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
                    Add Extra Cost
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={newCost.description || ''}
                      onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                      placeholder="e.g., Travel costs, Emergency fee"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newCost.amount || ''}
                      onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Receipt Reference
                    </label>
                    <input
                      type="text"
                      value={newCost.receiptRef || ''}
                      onChange={(e) => setNewCost({ ...newCost, receiptRef: e.target.value })}
                      placeholder="e.g., REC-001"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-zinc-800">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setAddCostModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white"
                    onClick={() => handleAddCost()}
                  >
                    Add Cost
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report Issue Modal */}
        <AnimatePresence>
          {reportIssueOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setReportIssueOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-zinc-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                    Report Issue
                  </h3>
                  <button
                    onClick={() => setReportIssueOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>

                <CardContent className="p-6 space-y-5">
                  {/* Work Order Reference */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded border border-blue-200 dark:border-blue-700">
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Work Order</p>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-200">
                      {selectedOrder?.id} - {selectedOrder?.title}
                    </p>
                  </div>

                  {/* Issue Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Issue Title *
                    </label>
                    <Input
                      placeholder="Brief description of the issue"
                      value={issueForm.title}
                      onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                      className="h-10 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
                    />
                  </div>

                  {/* Severity and Category */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Severity *
                      </label>
                      <Select value={issueForm.severity} onValueChange={(value) => setIssueForm({ ...issueForm, severity: value })}>
                        <SelectTrigger className="h-10 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Category *
                      </label>
                      <Select value={issueForm.category} onValueChange={(value) => setIssueForm({ ...issueForm, category: value })}>
                        <SelectTrigger className="h-10 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Technical Problem</SelectItem>
                          <SelectItem value="equipment">Equipment Issue</SelectItem>
                          <SelectItem value="safety">Safety Concern</SelectItem>
                          <SelectItem value="scheduling">Scheduling Conflict</SelectItem>
                          <SelectItem value="materials">Materials/Parts</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Detailed Description *
                    </label>
                    <textarea
                      placeholder="Please provide detailed information about the issue..."
                      value={issueForm.description}
                      onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                      className="w-full h-32 p-3 rounded border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-zinc-800">
                    <Button
                      onClick={() => {
                        if (issueForm.title && issueForm.description) {
                          alert(
                            `Issue Reported!\n\nTitle: ${issueForm.title}\nSeverity: ${issueForm.severity}\nCategory: ${issueForm.category}\nDescription: ${issueForm.description}\n\nWork Order: ${selectedOrder?.id}`
                          );
                          setReportIssueOpen(false);
                          setIssueForm({ title: '', description: '', severity: 'medium', category: 'technical' });
                        } else {
                          alert('Please fill in all required fields');
                        }
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Submit Issue Report
                    </Button>
                    <Button
                      onClick={() => setReportIssueOpen(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

