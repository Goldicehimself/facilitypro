import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { createLeave, fetchMyLeaves, fetchPendingLeaves, approveLeave, rejectLeave } from '@/api/leave';

const LeaveCenter = () => {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decisionNotes, setDecisionNotes] = useState({});
  const [leaveSubmitState, setLeaveSubmitState] = useState('idle');
  const [approveState, setApproveState] = useState({});
  const [rejectState, setRejectState] = useState({});
  const [newLeave, setNewLeave] = useState({
    type: 'Annual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const leaveTypes = ['Annual', 'Sick', 'Emergency', 'Other'];

  const parseDate = (dateString) => {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString;
    if (typeof dateString === 'string' && dateString.includes('T')) {
      return new Date(dateString);
    }
    return new Date(`${dateString}T00:00:00`);
  };

  const formatDate = (dateString) => {
    const date = parseDate(dateString);
    if (!date || Number.isNaN(date.getTime())) return 'TBD';
    return date.toLocaleDateString();
  };

  const getLeavePhase = (startDate, endDate) => {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    const now = new Date();
    if (!start || !end) return 'Scheduled';
    if (now < start) return 'Upcoming';
    if (now > end) return 'Completed';
    return 'In progress';
  };

  const getLeaveProgress = (startDate, endDate) => {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    const now = new Date();
    if (!start || !end) return 0;
    if (now <= start) return 0;
    if (now >= end) return 100;
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  };

  const getStatusBadge = (status) => {
    if (status === 'approved' || status === 'Approved') {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100';
    }
    if (status === 'rejected' || status === 'Rejected') {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100';
    }
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100';
  };

  const pushNotification = (payload) => {
    setNotifications((prev) => [
      {
        ...payload,
        id: Date.now() + Math.floor(Math.random() * 1000),
        createdAt: new Date().toLocaleString(),
      },
      ...prev,
    ]);
  };

  const handleLeaveSubmit = async (event) => {
    event.preventDefault();
    if (!newLeave.startDate || !newLeave.endDate || !newLeave.reason) {
      toast.error('Please complete all leave request fields.');
      return;
    }

    try {
      setLeaveSubmitState('loading');
      const created = await createLeave({
        type: newLeave.type,
        startDate: newLeave.startDate,
        endDate: newLeave.endDate,
        reason: newLeave.reason,
      });
      setLeaveRequests((prev) => [created, ...prev]);
      setNewLeave((prev) => ({
        ...prev,
        startDate: '',
        endDate: '',
        reason: '',
      }));
      pushNotification({
        title: 'Leave request submitted',
        message: `Your ${created.type} leave request was sent for approval.`,
        type: 'pending',
      });
      toast.success('Leave request submitted');
      setLeaveSubmitState('done');
      setTimeout(() => setLeaveSubmitState('idle'), 2000);
    } catch (error) {
      // handled by interceptor
      setLeaveSubmitState('idle');
    }
  };

  const loadLeaves = useCallback(async (activeRef) => {
    setLoading(true);
    try {
      const [myLeaves, pending] = await Promise.all([
        fetchMyLeaves(),
        user && ['facility_manager', 'admin'].includes(user.role) ? fetchPendingLeaves() : Promise.resolve([]),
      ]);
      if (activeRef && !activeRef.current) return;
      setLeaveRequests(Array.isArray(myLeaves) ? myLeaves : []);
      setPendingApprovals(Array.isArray(pending) ? pending : []);
    } finally {
      if (activeRef && !activeRef.current) return;
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const activeRef = { current: true };
    loadLeaves(activeRef);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadLeaves(activeRef);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      activeRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadLeaves]);

  const canApprove = useMemo(() => user && ['facility_manager', 'admin'].includes(user.role), [user]);

  const staffLeaveRequests = leaveRequests;

  const handleApprove = async (request) => {
    try {
      const note = decisionNotes[request._id] || '';
      setApproveState((prev) => ({ ...prev, [request._id]: 'loading' }));
      await approveLeave(request._id, note);
      toast.success('Leave approved');
      setPendingApprovals((prev) => prev.filter((item) => item._id !== request._id));
      setDecisionNotes((prev) => ({ ...prev, [request._id]: '' }));
      const refreshed = await fetchMyLeaves();
      setLeaveRequests(Array.isArray(refreshed) ? refreshed : []);
      setApproveState((prev) => ({ ...prev, [request._id]: 'done' }));
      setTimeout(() => setApproveState((prev) => ({ ...prev, [request._id]: 'idle' })), 2000);
    } catch (error) {
      // handled by interceptor
      setApproveState((prev) => ({ ...prev, [request._id]: 'idle' }));
    }
  };

  const handleReject = async (request) => {
    try {
      const note = decisionNotes[request._id] || '';
      if (!note.trim()) {
        toast.error('Rejection note is required.');
        return;
      }
      setRejectState((prev) => ({ ...prev, [request._id]: 'loading' }));
      await rejectLeave(request._id, note);
      toast.success('Leave rejected');
      setPendingApprovals((prev) => prev.filter((item) => item._id !== request._id));
      setDecisionNotes((prev) => ({ ...prev, [request._id]: '' }));
      const refreshed = await fetchMyLeaves();
      setLeaveRequests(Array.isArray(refreshed) ? refreshed : []);
      setRejectState((prev) => ({ ...prev, [request._id]: 'done' }));
      setTimeout(() => setRejectState((prev) => ({ ...prev, [request._id]: 'idle' })), 2000);
    } catch (error) {
      // handled by interceptor
      setRejectState((prev) => ({ ...prev, [request._id]: 'idle' }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Leave Center</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Submit leave requests, track progress, and see updates from your manager.
        </p>
        <div className="mt-3">
          <Button variant="outline" size="sm" onClick={() => loadLeaves()}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="border-0 shadow-md xl:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Leave Requests
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Apply for leave and track each request.
                </p>
              </div>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                <AlertCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Apply for Leave
                  </h4>
                  <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-100">
                    {user?.role === 'staff' ? 'Staff' : 'Manager'}
                  </Badge>
                </div>
                {user?.role === 'staff' ? (
                  <form onSubmit={handleLeaveSubmit} className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        Leave Type
                      </label>
                      <select
                        value={newLeave.type}
                        onChange={(event) =>
                          setNewLeave((prev) => ({ ...prev, type: event.target.value }))
                        }
                        className="mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                      >
                        {leaveTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={newLeave.startDate}
                          onChange={(event) =>
                            setNewLeave((prev) => ({ ...prev, startDate: event.target.value }))
                          }
                          className="mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={newLeave.endDate}
                          onChange={(event) =>
                            setNewLeave((prev) => ({ ...prev, endDate: event.target.value }))
                          }
                          className="mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        Reason
                      </label>
                      <textarea
                        rows={3}
                        value={newLeave.reason}
                        onChange={(event) =>
                          setNewLeave((prev) => ({ ...prev, reason: event.target.value }))
                        }
                        className="mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                        placeholder="Add brief context for your manager."
                      />
                    </div>
                    <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800" disabled={leaveSubmitState === 'loading'}>
                      {leaveSubmitState === 'loading' ? 'Sending...' : leaveSubmitState === 'done' ? 'Sent' : 'Submit Leave Request'}
                    </Button>
                  </form>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Managers review and approve leave requests. Use the approvals list below.
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Your Leave Tracker
                  </h4>
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                    {user?.role === 'staff' ? 'Staff' : 'Manager'}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-sm text-muted-foreground">Loading leave requests...</div>
                  ) : staffLeaveRequests.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No leave requests yet. Submit your first request.
                    </div>
                  ) : (
                    staffLeaveRequests.map((request) => {
                      const progress = getLeaveProgress(request.startDate, request.endDate);
                      const phase = getLeavePhase(request.startDate, request.endDate);
                      return (
                        <div
                          key={request._id || request.id}
                          className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {request.type} Leave
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(request.startDate)} to {formatDate(request.endDate)}
                              </p>
                            </div>
                            <Badge className={getStatusBadge(request.status)}>
                              {request.status?.toUpperCase?.() || request.status}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-300">
                              <span>{phase}</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
                              <div
                                className="h-2 rounded-full bg-blue-700"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Manager: {request.approvedBy?.firstName || request.rejectedBy?.firstName || 'Pending'}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                In-App Notifications
              </h3>
              <div className="p-2 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notifications yet.</p>
              ) : (
                notifications.slice(0, 6).map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3"
                  >
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2">
                      {notification.createdAt}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {canApprove && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Pending Approvals
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Review and approve staff leave requests.
                </p>
              </div>
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100">
                Manager
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading approvals...</div>
            ) : pendingApprovals.length === 0 ? (
              <div className="text-sm text-muted-foreground">No pending leave approvals.</div>
            ) : (
              pendingApprovals.map((request) => (
                <div
                  key={request._id}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {request.staff?.firstName} {request.staff?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {request.type} leave • {formatDate(request.startDate)} to {formatDate(request.endDate)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Reason: {request.reason}
                      </p>
                    </div>
                    <Badge className={getStatusBadge(request.status)}>
                      {request.status?.toUpperCase?.() || request.status}
                    </Badge>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                      Manager note (optional)
                    </label>
                    <textarea
                      rows={2}
                      value={decisionNotes[request._id] || ''}
                      onChange={(event) =>
                        setDecisionNotes((prev) => ({ ...prev, [request._id]: event.target.value }))
                      }
                      className="mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                      placeholder="Add a brief note"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleApprove(request)}
                      disabled={approveState[request._id] === 'loading'}
                    >
                      {approveState[request._id] === 'loading'
                        ? 'Approving...'
                        : approveState[request._id] === 'done'
                          ? 'Approved'
                          : 'Approve'}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-rose-200 text-rose-700 hover:bg-rose-50"
                      onClick={() => handleReject(request)}
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
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeaveCenter;


