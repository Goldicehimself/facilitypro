import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ClipboardList, Clock } from 'lucide-react';
import { useQuery } from 'react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import GreetingBanner from '@/components/common/GreetingBanner';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkOrders } from '../../api/workOrders';
import { fetchMyLeaves } from '../../api/leave';

const StaffPortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentUserName = user?.name || 'Carlos Mendez';
  const [statusFilter, setStatusFilter] = useState('all');
  const [dueFilter, setDueFilter] = useState('all');

  const { data: workOrders = [], isLoading } = useQuery(
    ['workOrders', { scope: 'staff' }],
    () => getWorkOrders()
  );
  const { data: myLeaves = [], isLoading: leavesLoading } = useQuery(
    ['myLeaves', user?.id],
    () => fetchMyLeaves(),
    { enabled: !!user }
  );

  const workOrdersList = Array.isArray(workOrders)
    ? workOrders
    : (workOrders?.workOrders || workOrders?.data || []);

  const myWorkOrders = useMemo(
    () => workOrdersList.filter((order) => order.assignedTo?.name === currentUserName),
    [currentUserName, workOrdersList]
  );

  const filteredWorkOrders = useMemo(() => {
    const now = new Date();
    return myWorkOrders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (dueFilter === 'due_soon') {
        if (!order.dueDate) return false;
        const due = new Date(order.dueDate);
        if (Number.isNaN(due.getTime())) return false;
        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0 || diffDays > 7) return false;
      }
      return true;
    });
  }, [myWorkOrders, statusFilter, dueFilter]);

  const counts = useMemo(() => {
    return myWorkOrders.reduce(
      (acc, order) => {
        acc.total += 1;
        if (order.status === 'in_progress') acc.inProgress += 1;
        if (order.status === 'overdue') acc.overdue += 1;
        if (order.status === 'completed') acc.completed += 1;
        return acc;
      },
      { total: 0, inProgress: 0, overdue: 0, completed: 0 }
    );
  }, [myWorkOrders]);

  const leaveSummary = useMemo(() => {
    const list = Array.isArray(myLeaves) ? myLeaves : [];
    return list.reduce(
      (acc, leave) => {
        acc.total += 1;
        if (leave.status === 'approved') acc.approved += 1;
        if (leave.status === 'pending') acc.pending += 1;
        if (leave.status === 'rejected') acc.rejected += 1;
        return acc;
      },
      { total: 0, approved: 0, pending: 0, rejected: 0 }
    );
  }, [myLeaves]);

  const nextLeave = useMemo(() => {
    const list = Array.isArray(myLeaves) ? myLeaves : [];
    const now = new Date();
    const upcoming = list
      .filter((leave) => leave.startDate && new Date(leave.startDate) >= now)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    return upcoming[0] || null;
  }, [myLeaves]);

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'TBD';
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'overdue':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    }
  };

  const formatStatus = (status) =>
    status.replace('_', ' ').replace(/^\w/, (char) => char.toUpperCase());

  return (
    <div className="space-y-6">
      <GreetingBanner subtitle="Track your assigned work orders and leave requests." />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Work</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your assigned work orders and leave requests.
          </p>
        </div>
        <Button onClick={() => navigate('/leave-center')} className="bg-blue-700 hover:bg-blue-800">
          <span className="inline-flex items-center gap-2">
            Go to Leave Center
            {leaveSummary.pending > 0 && (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-white/90 px-1.5 py-0.5 text-xs font-semibold text-blue-700">
                {leaveSummary.pending}
              </span>
            )}
          </span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Leave Tracking</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Summary of your leave requests and approvals.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/leave-center')}>
              View Details
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {leavesLoading ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading leave requests...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{leaveSummary.pending}</p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Approved</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{leaveSummary.approved}</p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Rejected</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{leaveSummary.rejected}</p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Next Leave</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {nextLeave
                    ? `${formatDate(nextLeave.startDate)} to ${formatDate(nextLeave.endDate)}`
                    : 'None scheduled'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts.total}</p>
            </div>
            <ClipboardList className="h-5 w-5 text-indigo-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts.inProgress}</p>
            </div>
            <Clock className="h-5 w-5 text-blue-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Overdue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts.overdue}</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-rose-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts.completed}</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Work Orders</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Assigned to {currentUserName}.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={statusFilter === 'open' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('open')}
                >
                  Open Only
                </Button>
                <Button
                  variant={dueFilter === 'due_soon' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDueFilter('due_soon')}
                >
                  Due Soon
                </Button>
                <Button
                  variant={statusFilter === 'all' && dueFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setDueFilter('all');
                  }}
                >
                  Reset
                </Button>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-full sm:w-40 bg-white dark:bg-zinc-900">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dueFilter} onValueChange={setDueFilter}>
                <SelectTrigger className="h-9 w-full sm:w-40 bg-white dark:bg-zinc-900">
                  <SelectValue placeholder="Due" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Due Dates</SelectItem>
                  <SelectItem value="due_soon">Due in 7 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Loading work orders...
            </p>
          ) : filteredWorkOrders.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You do not have matching work orders.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWorkOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {order.woNumber} - {order.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {order.location?.name || 'No location set'}
                      </p>
                    </div>
                    <Badge className={getStatusBadge(order.status)}>
                      {formatStatus(order.status)}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Due: {formatDate(order.dueDate)}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/work-orders/${order.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffPortal;

