import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Search, MoreHorizontal, Eye, Edit2, Trash2, Plus, Download, X, ArrowUp, ArrowDown, ArrowUpDown, AlertCircle, Clock, CheckCircle2, Zap } from 'lucide-react';
import { getWorkOrders, deleteWorkOrder, bulkAssignWorkOrders, updateWorkOrderStatus } from '../../api/workOrders';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function WorkOrders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  const [selectAllMode, setSelectAllMode] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [assigneeQuery, setAssigneeQuery] = useState('');
  const [assigneeSelected, setAssigneeSelected] = useState(null);
  const [confirmStep, setConfirmStep] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [updatingId, setUpdatingId] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Read URL search params and apply filters
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
    const priorityParam = searchParams.get('priority');
    if (priorityParam) {
      setPriorityFilter(priorityParam);
    }
    const searchParam = searchParams.get('search');
    if (searchParam !== null) {
      setSearch(searchParam);
      setPage(0);
    }
  }, [searchParams]);

  const { data: workOrders = [], isLoading } = useQuery(
    ['workOrders', { statusFilter, priorityFilter, search, categoryFilter, assigneeFilter, dateRange, locationFilter }],
    () => getWorkOrders({ status: statusFilter, priority: priorityFilter, search, category: categoryFilter, assignee: assigneeFilter, dateRange, location: locationFilter })
  );
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!isLoading) setHasLoaded(true);
  }, [isLoading]);

  const workOrdersList = Array.isArray(workOrders)
    ? workOrders
    : (workOrders?.workOrders || workOrders?.data || []);

  const assignees = useMemo(() => {
    const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
    const list = [...localUsers, ...workOrdersList.map(w => w.assignedTo).filter(Boolean)];
    const seen = new Set();
    return list.filter(u => {
      if (!u) return false;
      if (seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    }).filter(u => {
      if (!assigneeQuery) return true;
      return (u.name || '').toLowerCase().includes(assigneeQuery.toLowerCase()) || (u.email || '').toLowerCase().includes(assigneeQuery.toLowerCase());
    });
  }, [workOrdersList, assigneeQuery]);

  const bulkAssignMutation = useMutation(({ ids, assignee, filters }) => bulkAssignWorkOrders({ ids, assignee, filters }), {
    onSuccess: (data) => {
      queryClient.invalidateQueries('workOrders');
      toast.success(`Assigned ${data.updatedCount} work orders`);
      setSelected([]);
      setSelectAllMode(false);
      setBulkModalOpen(false);
    },
    onError: () => toast.error('Bulk assign failed'),
  });

  const displayedWorkOrders = useMemo(() => {
    let arr = [...workOrdersList];
    if (sortBy) {
      arr.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];
        if (sortBy === 'asset') {
          valA = a.asset?.name || '';
          valB = b.asset?.name || '';
        }
        if (sortBy === 'assignedTo') {
          valA = a.assignedTo?.name || '';
          valB = b.assignedTo?.name || '';
        }
        if (sortBy === 'dueDate') {
          valA = a.dueDate || '';
          valB = b.dueDate || '';
          const dateA = valA ? new Date(valA) : new Date(0);
          const dateB = valB ? new Date(valB) : new Date(0);
          if (dateA < dateB) return sortDir === 'asc' ? -1 : 1;
          if (dateA > dateB) return sortDir === 'asc' ? 1 : -1;
          return 0;
        }

        const A = typeof valA === 'string' ? valA.toLowerCase() : (valA || '').toString();
        const B = typeof valB === 'string' ? valB.toLowerCase() : (valB || '').toString();
        if (A < B) return sortDir === 'asc' ? -1 : 1;
        if (A > B) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return arr;
  }, [workOrdersList, sortBy, sortDir]);

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('asc'); }
    setPage(0);
  };

  const deleteMutation = useMutation(deleteWorkOrder, {
    onSuccess: () => {
      queryClient.invalidateQueries('workOrders');
      toast.success('Work order deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const statusMutation = useMutation(
    ({ id, status }) => updateWorkOrderStatus(id, status),
    {
      onMutate: ({ id }) => {
        setUpdatingId(id);
      },
      onSuccess: () => {
        queryClient.invalidateQueries('workOrders');
        toast.success('Status updated');
      },
      onError: () => toast.error('Failed to update status'),
      onSettled: () => setUpdatingId(null),
    }
  );

  const buildFilters = () => ({
    status: statusFilter,
    priority: priorityFilter,
    search,
    category: categoryFilter,
    assignee: assigneeFilter,
    dateRange,
    location: locationFilter
  });

  const escapeCsv = (value) => {
    const safe = value === null || value === undefined ? '' : String(value);
    return `"${safe.replace(/\"/g, '\"\"')}"`;
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const filters = buildFilters();
      const limit = 100;
      let pageNum = 1;
      let all = [];
      while (true) {
        const data = await getWorkOrders({ ...filters, page: pageNum, limit });
        const list = Array.isArray(data) ? data : (data?.workOrders || data?.data || []);
        all = all.concat(list);
        const totalPages = data?.pagination?.totalPages;
        if (!totalPages || pageNum >= totalPages) break;
        pageNum += 1;
      }
      if (!all.length) {
        toast.info('No work orders to export');
        return;
      }
      const csv = [
        ['WO ID', 'Title', 'Asset', 'Assigned To', 'Assigned Email', 'Priority', 'Status', 'Progress', 'Estimated Hours', 'Actual Hours', 'Extra Cost Total', 'Replaced Parts', 'Issues', 'Started At', 'Completed At', 'Location', 'Due Date'],
        ...all.map(wo => [
          wo.woNumber,
          wo.title || wo.description,
          wo.asset?.name || wo.location?.name || '',
          wo.assignedTo?.name || 'Unassigned',
          wo.assignedTo?.email || '',
          wo.priority,
          wo.status,
          Number.isFinite(wo.progress) ? wo.progress : '',
          wo.estimatedHours ?? wo.estimatedDuration ?? '',
          wo.actualHours ?? '',
          (Array.isArray(wo.extraCosts) ? wo.extraCosts : []).reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0),
          Array.isArray(wo.replacedParts) ? wo.replacedParts.length : 0,
          Array.isArray(wo.issues) ? wo.issues.length : 0,
          wo.startedAt || wo.startDate || '',
          wo.completedAt || wo.completionDate || '',
          wo.location?.name || wo.location || '',
          wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : ''
        ])
      ].map(row => row.map(escapeCsv).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `work-orders-${new Date().toLocaleDateString()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const stats = useMemo(() => {
    const total = workOrdersList.length;
    const open = workOrdersList.filter(w => w.status === 'open').length;
    const inProgress = workOrdersList.filter(w => w.status === 'in_progress').length;
    const completed = workOrdersList.filter(w => w.status === 'completed').length;
    const overdue = workOrdersList.filter(w => w.status === 'overdue').length;
    return { total, open, inProgress, completed, overdue };
  }, [workOrdersList]);

  const categories = useMemo(() => {
    const set = new Set();
    workOrdersList.forEach(w => {
      const value = w.category || w.serviceCategory || w.serviceType;
      if (value) set.add(value);
    });
    return Array.from(set);
  }, [workOrdersList]);

  const locations = useMemo(() => {
    const set = new Set();
    workOrdersList.forEach(w => {
      const value = w.location?.name || w.location;
      if (value) set.add(value);
    });
    return Array.from(set);
  }, [workOrdersList]);

  const assigneeOptions = useMemo(() => {
    const seen = new Set();
    const list = [];
    workOrdersList.forEach(w => {
      if (w.assignedTo && !seen.has(w.assignedTo.id)) {
        seen.add(w.assignedTo.id);
        list.push(w.assignedTo);
      }
    });
    return list;
  }, [workOrdersList]);

  function priorityBadge(p) {
    const variants = {
      critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      low: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    };
    const labels = { critical: '🔴', high: '🟠', medium: '🔵', low: '🟢' };
    return <Badge className={`${variants[p] || variants.low} font-semibold`}>{labels[p]} {p}</Badge>;
  }

  function statusBadge(s) {
    const variants = {
      open: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      cancelled: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200',
    };
    const icons = { open: '📋', in_progress: '⚙️', completed: '✓', overdue: '⚠️', cancelled: '❌' };
    return <Badge className={`${variants[s] || variants.open} font-semibold`}>{icons[s]} {s.replace('_', ' ')}</Badge>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
        <h1 className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">All Work Orders</h1>
        <p className="text-indigo-700 dark:text-indigo-300 mt-1">
          Comprehensive view of all maintenance work orders in the system
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<Zap className="h-5 w-5" />} label="Total" value={stats.total} color="indigo" />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Open" value={stats.open} color="amber" />
        <StatCard icon={<AlertCircle className="h-5 w-5" />} label="In Progress" value={stats.inProgress} color="blue" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Completed" value={stats.completed} color="emerald" />
        <StatCard icon={<AlertCircle className="h-5 w-5" />} label="Overdue" value={stats.overdue} color="rose" />
      </div>

      {/* Filters Card */}
      <Card className="border-0 shadow-sm dark:bg-zinc-900">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                className="w-full pl-9 pr-3 py-2 h-10 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                type="text"
                placeholder="Search work orders by ID or title..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              />
            </div>

            <select className="h-10 px-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>

            <select className="h-10 px-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100" value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(0); }}>
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select className="h-10 px-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}>
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select className="h-10 px-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100" value={assigneeFilter} onChange={(e) => { setAssigneeFilter(e.target.value); setPage(0); }}>
              <option value="all">All Technicians</option>
              {assigneeOptions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>

            <Button className="bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-2" onClick={() => navigate('/work-orders/new')}>
              <Plus size={16} /> Create
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <select className="h-9 px-2 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100" value={dateRange} onChange={(e) => { setDateRange(e.target.value); setPage(0); }}>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>

            <select className="h-9 px-2 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100" value={locationFilter} onChange={(e) => { setLocationFilter(e.target.value); setPage(0); }}>
              <option value="all">All Locations</option>
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            <Button variant="outline" size="sm" className="ml-auto text-zinc-700 dark:text-zinc-200" onClick={() => setBulkModalOpen(true)}>
              Bulk Assign
            </Button>

            <Button
              className="bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-2"
              size="sm"
              onClick={handleExportCsv}
              disabled={exporting}
            >
              <Download size={14} /> Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="border-0 shadow-sm overflow-hidden dark:bg-zinc-900">
        {isLoading && !hasLoaded ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="grid grid-cols-7 gap-3 items-center">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-20 hidden md:block" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24 hidden lg:block" />
                  <Skeleton className="h-8 w-20 justify-self-end" />
                </div>
              ))}
            </div>
          </div>
        ) : displayedWorkOrders.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No work orders found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                  <tr>
                    <th className="px-4 py-3 text-left"><input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={selected.length === displayedWorkOrders.length && displayedWorkOrders.length > 0} onChange={(e) => { if (e.target.checked) setSelected(displayedWorkOrders.map(w => w.id)); else setSelected([]); }} /></th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 cursor-pointer" onClick={() => toggleSort('woNumber')}>
                      <div className="flex items-center gap-2">ID {sortBy === 'woNumber' ? (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-30" />}</div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 cursor-pointer" onClick={() => toggleSort('title')}>
                      <div className="flex items-center gap-2">Title {sortBy === 'title' ? (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-30" />}</div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">Assigned To</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">Due Date</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  {displayedWorkOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((wo) => (
                    <tr key={wo.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors border-l-4" style={{borderLeftColor: wo.priority === 'critical' ? '#ef4444' : wo.priority === 'high' ? '#f97316' : wo.priority === 'medium' ? '#3b82f6' : '#10b981'}}>
                      <td className="px-4 py-3"><input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={selectAllMode || selected.includes(wo.id)} onChange={() => {
                        if (selectAllMode) {
                          setSelectAllMode(false);
                          const pageIds = displayedWorkOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(w => w.id);
                          setSelected(pageIds.filter(id => id !== wo.id));
                        } else {
                          setSelected(prev => prev.includes(wo.id) ? prev.filter(x => x !== wo.id) : [...prev, wo.id]);
                        }
                      }} /></td>
                      <td className="px-4 py-3"><span className="font-semibold text-sm text-indigo-600 dark:text-indigo-400">{wo.woNumber}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-zinc-900 dark:text-zinc-100">{wo.title || wo.description}</span></td>
                      <td className="px-4 py-3 hidden md:table-cell">{priorityBadge(wo.priority)}</td>
                      <td className="px-4 py-3">{statusBadge(wo.status)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          {wo.assignedTo ? (
                            <>
                              <img src={wo.assignedTo.avatar || '/avatar-placeholder.png'} alt="avatar" className="w-6 h-6 rounded-full" />
                              <span className="text-sm text-zinc-900 dark:text-zinc-100">{wo.assignedTo.name}</span>
                            </>
                          ) : (<span className="text-sm text-zinc-500 dark:text-zinc-400">Unassigned</span>)}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell"><span className="text-sm text-zinc-600 dark:text-zinc-400">{wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : '—'}</span></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/work-orders/${wo.id}`, { state: { workOrder: wo } })} className="text-xs text-zinc-700 dark:text-zinc-200">
                            <Eye size={14} /> View
                          </Button>
                          {wo.status === 'completed' && <Button size="sm" variant="outline" className="text-xs text-zinc-700 dark:text-zinc-200">Completed</Button>}
                          {wo.status === 'cancelled' && <Button size="sm" variant="outline" className="text-xs text-zinc-700 dark:text-zinc-200">Cancelled</Button>}
                          {(wo.status === 'open' || wo.status === 'in_progress' || wo.status === 'overdue') && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-xs text-zinc-700 dark:text-zinc-200"
                              onClick={() => statusMutation.mutate({ id: wo.id, status: 'cancelled' })}
                              disabled={statusMutation.isLoading && updatingId === wo.id}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-gray-200 dark:border-zinc-700 flex items-center justify-between flex-wrap gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {(page * rowsPerPage) + 1}-{Math.min((page + 1) * rowsPerPage, displayedWorkOrders.length)} of {displayedWorkOrders.length}
              </div>
              <div className="flex items-center gap-2">
                <select className="h-8 px-2 text-sm border border-gray-200 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800" value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <Button variant="outline" size="sm" className="text-zinc-700 dark:text-zinc-200" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
                <Button variant="outline" size="sm" className="text-zinc-700 dark:text-zinc-200" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * rowsPerPage >= displayedWorkOrders.length}>Next</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Bulk Assign Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
              <h3 className="text-xl font-bold">
                Assign {selectAllMode ? workOrdersList.length : selected.length} selected work order{selectAllMode || selected.length !== 1 ? 's' : ''} to a technician
              </h3>
            </div>

            <div className="p-6 space-y-5">
              {!confirmStep ? (
                <>
                  {/* Summary */}
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-indigo-900 dark:text-indigo-100 text-sm">
                          {selectAllMode ? `${workOrdersList.length} work orders` : `${selected.length} work order${selected.length !== 1 ? 's' : ''}`} ready to assign
                        </p>
                        <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">Select a technician below</p>
                      </div>
                    </div>
                  </div>

                  {/* Search */}
                  <div>
                    <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Select Technician</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <input 
                        value={assigneeQuery} 
                        onChange={(e) => setAssigneeQuery(e.target.value)} 
                        placeholder="Search by name or email..." 
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all text-sm" 
                      />
                    </div>
                  </div>

                  {/* Technician List */}
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                    {assignees.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">No technicians found</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200 dark:divide-zinc-700">
                        {assignees.map((u) => (
                          <li 
                            key={u.id} 
                            onClick={() => setAssigneeSelected(u)}
                            className={`p-4 cursor-pointer transition-all ${assigneeSelected && assigneeSelected.id === u.id 
                              ? 'bg-indigo-50 dark:bg-indigo-950/30' 
                              : 'hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative flex-shrink-0">
                                <img src={u.avatar || '/avatar-placeholder.png'} alt="avatar" className="w-10 h-10 rounded-full" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{u.name}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">{u.email || 'No email'}</p>
                              </div>
                              {assigneeSelected && assigneeSelected.id === u.id && (
                                <CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-zinc-700">
                    <Button variant="outline" className="text-zinc-700 dark:text-zinc-200" onClick={() => { setBulkModalOpen(false); setConfirmStep(false); setAssigneeSelected(null); setAssigneeQuery(''); }}>
                      Cancel
                    </Button>
                    <Button className="bg-blue-700 hover:bg-blue-800 text-white" onClick={() => {
                      if (!assigneeSelected) { toast.error('Please select a technician'); return; }
                      setConfirmStep(true);
                    }} disabled={!assigneeSelected}>
                      Continue
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Confirmation */}
                  <div className="space-y-4">
                    {/* Selected Technician Card */}
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg">
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">Assigning to</p>
                      <div className="flex items-center gap-4">
                        <img src={assigneeSelected.avatar || '/avatar-placeholder.png'} alt="avatar" className="w-12 h-12 rounded-full" />
                        <div className="flex-1">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100">{assigneeSelected.name}</p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">{assigneeSelected.email || 'No email'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900">
                      <p className="text-sm text-amber-900 dark:text-amber-100">
                        You are about to assign <strong>{selectAllMode ? workOrdersList.length : selected.length} work order{selectAllMode || selected.length !== 1 ? 's' : ''}</strong> to <strong>{assigneeSelected.name}</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Confirmation Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-zinc-700">
                    <Button variant="outline" className="text-zinc-700 dark:text-zinc-200" onClick={() => setConfirmStep(false)}>
                      Back
                    </Button>
                    <Button className="bg-blue-700 hover:bg-blue-800 text-white" onClick={() => {
                      if (selectAllMode) {
                        bulkAssignMutation.mutate({ ids: null, assignee: assigneeSelected, filters: buildFilters() });
                      } else {
                        bulkAssignMutation.mutate({ ids: selected, assignee: assigneeSelected, filters: {} });
                      }
                    }} disabled={bulkAssignMutation.isLoading}>
                      {bulkAssignMutation.isLoading ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Assigning...
                        </>
                      ) : (
                        'Confirm & Assign'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    indigo: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    amber: 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    blue: 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    rose: 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  };
  return (
    <Card className={`border ${colors[color]}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold opacity-70 uppercase">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className="opacity-40">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

