import React, { useEffect, useMemo, useState } from 'react';
import {
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Avatar,
  Pagination,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Search,
  Plus,
  TrendingUp,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { getServiceRequests, getServiceRequestSummary, assignServiceRequest } from '../../api/serviceRequests';
import { fetchMembers } from '../../api/org';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ServiceRequests = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const queryClient = useQueryClient();

  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignee, setAssignee] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [members, setMembers] = useState([]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const { data: requestData } = useQuery(
    ['serviceRequests', { currentTab, searchQuery, sortBy, currentPage }],
    () => getServiceRequests({
      page: currentPage,
      limit: itemsPerPage,
      search: searchQuery || undefined,
      status: currentTab === 'all' ? undefined : currentTab,
    })
  );

  useEffect(() => {
    const list = Array.isArray(requestData)
      ? requestData
      : (requestData?.requests || requestData?.data || []);
    setRequests(list);
  }, [requestData]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const canManage = user?.role === 'admin' || user?.role === 'facility_manager';
      if (!canManage) {
        if (active) setMembers([]);
        return;
      }
      try {
        const memberRes = await fetchMembers();
        const list = Array.isArray(memberRes) ? memberRes : (memberRes?.members || memberRes?.data || []);
        if (active) setMembers(list);
      } catch (error) {
        if (active) setMembers([]);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [user?.role]);

  const { data: summaryData } = useQuery(['serviceRequestSummary'], () => getServiceRequestSummary());

  const summaryFromList = useMemo(() => {
    return (requests || []).reduce((acc, req) => {
      const key = req?.status || 'pending';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [requests]);

  const summaryHasData = summaryData?.summary && Object.keys(summaryData.summary).length > 0;
  const requestSummaryHasData = requestData?.summary && Object.keys(requestData.summary).length > 0;
  const summary = summaryHasData
    ? summaryData.summary
    : (requestSummaryHasData ? requestData.summary : (summaryFromList || {}));
  const totalCount = summaryData?.total ?? requestData?.pagination?.total ?? requests.length ?? 0;
  const kpiData = [
    {
      label: 'Total Requests',
      value: String(totalCount),
      trend: '',
      icon: Clock,
      color: '#4f46e5',
      bgColor: '#eef2ff',
      description: 'Total service requests',
    },
    {
      label: 'Pending Review',
      value: String(summary.pending || 0),
      trend: '',
      icon: AlertCircle,
      color: '#f59e0b',
      bgColor: '#fffbeb',
      description: 'Awaiting assignment',
    },
    {
      label: 'In Progress',
      value: String(summary['in-progress'] || 0),
      trend: '',
      icon: TrendingUp,
      color: '#10b981',
      bgColor: '#f0fdf4',
      description: 'Currently being worked on',
    },
    {
      label: 'Completed',
      value: String(summary.completed || 0),
      trend: '',
      icon: '✓',
      color: '#06b6d4',
      bgColor: '#ecfdf5',
      description: 'Finished requests',
    },
  ];

  // Apply sorting for current page
  const sortedRequests = [...requests].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    } else if (sortBy === 'priority') {
      const priorityOrder = { low: 1, medium: 2, high: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (sortBy === 'status') {
      const statusOrder = { pending: 1, assigned: 2, 'in-progress': 3, completed: 4 };
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return 0;
  });

  const totalPages = requestData?.pagination?.totalPages || 1;
  const displayedRequests = sortedRequests;

  const tabs = [
    { label: 'All', value: 'all', count: totalCount },
    { label: 'Pending', value: 'pending', count: summary.pending || 0 },
    { label: 'Assigned', value: 'assigned', count: summary.assigned || 0 },
    { label: 'In Progress', value: 'in-progress', count: summary['in-progress'] || 0 },
    { label: 'Completed', value: 'completed', count: summary.completed || 0 },
  ];

  const getPriorityColor = (priority) => {
    const colors = {
      high: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
      medium: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
      low: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
    };
    return colors[priority] || { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' };
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: '#fef3c7', text: '#92400e', border: '#fde68a', label: 'Pending' },
      assigned: { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe', label: 'Assigned' },
      'in-progress': { bg: '#dbeafe', text: '#0c4a6e', border: '#7dd3fc', label: 'In Progress' },
      completed: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0', label: 'Completed' },
    };
    return colors[status] || { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' };
  };

  const assignMutation = useMutation(({ id, assigneeId, note }) => assignServiceRequest(id, assigneeId, note), {
    onSuccess: () => {
      queryClient.invalidateQueries('serviceRequests');
    }
  });

  const handleOpenView = (request) => {
    setSelectedRequest(request);
    setViewOpen(true);
  };

  const handleOpenAssign = (request) => {
    setSelectedRequest(request);
    setAssignee('');
    setAssignNote('');
    setAssignOpen(true);
  };

  const handleCloseView = () => {
    setViewOpen(false);
    setSelectedRequest(null);
  };

  const handleCloseAssign = () => {
    setAssignOpen(false);
    setSelectedRequest(null);
  };

  const handleAssignSubmit = async () => {
    if (!assignee.trim()) {
      toast.error('Please enter an assignee');
      return;
    }
    try {
      await assignMutation.mutateAsync({
        id: selectedRequest.id,
        assigneeId: assignee.trim(),
        note: assignNote
      });
      toast.success('Request assigned successfully');
      handleCloseAssign();
    } catch (error) {
      toast.error('Failed to assign request');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', backgroundColor: isDark ? '#0b1120' : 'transparent' }}>
      {/* Header Section */}
      <Box sx={{ mb: 4, p: 3, background: isDark ? 'linear-gradient(to right, rgba(99, 102, 241, 0.12), rgba(79, 70, 229, 0.12))' : 'linear-gradient(to right, rgba(99, 102, 241, 0.05), rgba(79, 70, 229, 0.05))', border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`, borderRadius: 2 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 0.5,
            color: isDark ? '#c7d2fe' : '#4f46e5',
            fontSize: { xs: '28px', md: '32px' },
          }}
        >
          Service Requests
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '15px', color: isDark ? '#94a3b8' : '#3f4a5a' }}>
          Manage and track maintenance service requests across your facility
        </Typography>
      </Box>

      {/* KPI Cards - Enhanced Design */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
                {kpiData.map((kpi, idx) => {
          const Icon = typeof kpi.icon === 'string' ? null : kpi.icon;
          return (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  background: isDark ? '#0f172a' : '#ffffff',
                  border: `1px solid ${isDark ? '#1f2937' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    borderColor: kpi.color,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '10px',
                      background: kpi.bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: kpi.color,
                    }}
                  >
                    {Icon ? <Icon size={24} /> : <span style={{ fontSize: '24px' }}>{kpi.icon}</span>}
                  </Box>
                  {kpi.trend ? (
                    <Chip
                      label={kpi.trend}
                      size="small"
                      sx={{
                        background: kpi.trend.includes('+') ? '#dcfce7' : '#fee2e2',
                        color: kpi.trend.includes('+') ? '#166534' : '#991b1b',
                        fontWeight: 700,
                        fontSize: '12px',
                      }}
                    />
                  ) : null}
                </Box>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', mb: 0.5 }}
                >
                  {kpi.value}
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '13px' }}>
                  {kpi.description}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Main Content Paper */}
      <Paper
        elevation={0}
        sx={{
          background: isDark ? '#0f172a' : '#ffffff',
          border: `1px solid ${isDark ? '#1f2937' : '#e2e8f0'}`,
          borderRadius: '14px',
          overflow: 'hidden',
        }}
      >
        {/* Toolbar */}
        <Box sx={{ p: 4, borderBottom: `1px solid ${isDark ? '#1f2937' : '#e2e8f0'}`, background: isDark ? '#111827' : '#f8fafc' }}>
          {/* Tab Filters */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {tabs.map((tab) => (
                <Button
                  key={tab.value}
                  variant={currentTab === tab.value ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => {
                    setCurrentTab(tab.value);
                    setCurrentPage(1);
                  }}
                  sx={{
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '13px',
                    textTransform: 'none',
                    ...(currentTab === tab.value
                      ? {
                          background: '#3b82f6',
                          color: '#fff',
                          border: 'none',
                        }
                      : {
                          color: isDark ? '#cbd5f5' : '#64748b',
                          borderColor: isDark ? '#1f2937' : '#e2e8f0',
                          '&:hover': {
                            background: isDark ? '#0f172a' : '#f1f5f9',
                            borderColor: isDark ? '#334155' : '#cbd5e1',
                          },
                        }),
                  }}
                >
                  {tab.label} <span style={{ marginLeft: '6px', opacity: 0.7 }}>({tab.count})</span>
                </Button>
              ))}
            </Stack>
          </Box>

          {/* Search and Controls */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
              alignItems: { xs: 'stretch', md: 'center' },
              justifyContent: 'space-between',
            }}
          >
            <TextField
              placeholder="Search requests by ID, title, or requester..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} style={{ color: isDark ? '#94a3b8' : '#94a3b8' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  background: isDark ? '#0f172a' : '#fff',
                  borderRadius: '8px',
                  color: isDark ? '#e2e8f0' : '#0f172a',
                  '& fieldset': {
                    borderColor: isDark ? '#1f2937' : '#e2e8f0',
                  },
                  '&:hover fieldset': {
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                  },
                },
              }}
            />
            <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
              <TextField
                select
                size="small"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                sx={{
                  minWidth: 150,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    background: isDark ? '#0f172a' : '#fff',
                    color: isDark ? '#e2e8f0' : '#0f172a',
                    '& fieldset': {
                      borderColor: isDark ? '#1f2937' : '#e2e8f0',
                    },
                  },
                }}
              >
                <MenuItem value="date">Sort by Date</MenuItem>
                <MenuItem value="priority">Sort by Priority</MenuItem>
                <MenuItem value="status">Sort by Status</MenuItem>
              </TextField>
              {!(user?.role === 'admin' || user?.role === 'facility_manager') && (
                <Button
                  variant="contained"
                  startIcon={<Plus size={18} />}
                  onClick={() => navigate('/service-requests/new')}
                  sx={{
                    background: '#3b82f6',
                    color: '#fff',
                    borderRadius: '8px',
                    fontWeight: 600,
                    textTransform: 'none',
                    px: 3,
                    '&:hover': {
                      background: '#2563eb',
                    },
                  }}
                >
                  New Request
                </Button>
              )}
            </Stack>
          </Box>
        </Box>

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ background: isDark ? '#111827' : '#f8fafc', borderBottom: `2px solid ${isDark ? '#1f2937' : '#e2e8f0'}` }}>
                <TableCell sx={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#0f172a', fontSize: '13px' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#0f172a', fontSize: '13px' }}>Request</TableCell>
                <TableCell sx={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#0f172a', fontSize: '13px' }}>Requester</TableCell>
                <TableCell sx={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#0f172a', fontSize: '13px' }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#0f172a', fontSize: '13px' }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#0f172a', fontSize: '13px' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#0f172a', fontSize: '13px' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedRequests.map((request, idx) => {
                const priorityColor = getPriorityColor(request.priority);
                const statusColor = getStatusColor(request.status);
                const requesterName = request.requester?.name || [request.requester?.firstName, request.requester?.lastName].filter(Boolean).join(' ') || 'Unknown';
                const requesterInitials = request.requester?.initials || requesterName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <TableRow
                    key={idx}
                    sx={{
                      borderBottom: `1px solid ${isDark ? '#1f2937' : '#e2e8f0'}`,
                      '&:hover': {
                        background: isDark ? '#0f172a' : '#f8fafc',
                      },
                      '&:last-child td, &:last-child th': {
                        border: 0,
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        color: '#3b82f6',
                        fontSize: '13px',
                      }}
                    >
                      {request.id}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontSize: '14px',
                            color: isDark ? '#f8fafc' : '#0f172a',
                            mb: 0.5,
                          }}
                        >
                          {request.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '12px' }}
                        >
                          {request.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            fontSize: '16px',
                            background: isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
                            color: isDark ? '#93c5fd' : '#0c4a6e',
                            fontWeight: 600,
                          }}
                        >
                          {requesterInitials}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#e2e8f0' : '#0f172a' }}>
                            {requesterName}
                          </Typography>
                          <Typography sx={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>
                            {request.requester?.role || 'Requester'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: isDark ? '#cbd5f5' : '#475569', fontSize: '13px' }}>
                      {request.location}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                        size="small"
                        sx={{
                          background: priorityColor.bg,
                          color: priorityColor.text,
                          fontWeight: 700,
                          fontSize: '11px',
                          border: `1px solid ${priorityColor.border}`,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={statusColor.label}
                          size="small"
                          sx={{
                            background: statusColor.bg,
                            color: statusColor.text,
                            fontWeight: 700,
                            fontSize: '11px',
                            border: `1px solid ${statusColor.border}`,
                          }}
                        />
                        {request.assignee?.name && (
                          <Typography
                            variant="caption"
                            sx={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', whiteSpace: 'nowrap' }}
                          >
                            Assigned {request.assignee.name}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          const canAssign = user?.role === 'admin' || user?.role === 'facility_manager';
                          if (canAssign) {
                            handleOpenAssign(request);
                          } else {
                            handleOpenView(request);
                          }
                        }}
                        sx={{
                          color: '#3b82f6',
                          borderColor: '#bfdbfe',
                          fontWeight: 600,
                          fontSize: '12px',
                          textTransform: 'none',
                          borderRadius: '6px',
                          '&:hover': {
                            borderColor: '#3b82f6',
                            background: '#eff6ff',
                          },
                        }}
                      >
                        {(user?.role === 'admin' || user?.role === 'facility_manager')
                          ? (request.assignee ? 'Reassign' : 'Assign')
                          : 'View'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 3,
            borderTop: `1px solid ${isDark ? '#1f2937' : '#e2e8f0'}`,
            background: isDark ? '#111827' : '#f8fafc',
          }}
        >
          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '13px', fontWeight: 500 }}>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, requestData?.pagination?.total || 0)} of {requestData?.pagination?.total || 0} results
          </Typography>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            size="small"
            sx={{
              '& .MuiPaginationItem-root': {
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
              },
            }}
          />
        </Box>
      </Paper>

      {/* View Request Dialog */}
      <Dialog
        open={viewOpen}
        onClose={handleCloseView}
        maxWidth="sm"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '18px' }}>
          Service Request Details
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedRequest && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Request ID</Typography>
                <Typography sx={{ fontWeight: 600 }}>{selectedRequest.id}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Title</Typography>
                <Typography sx={{ fontWeight: 600 }}>{selectedRequest.title}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Description</Typography>
                <Typography>{selectedRequest.description}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Location</Typography>
                <Typography>{selectedRequest.location}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Requester</Typography>
                <Typography>{selectedRequest.requester.name} ({selectedRequest.requester.role})</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Priority</Typography>
                <Typography>{selectedRequest.priority}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Typography>{getStatusColor(selectedRequest.status).label}</Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseView} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog
        open={assignOpen}
        onClose={handleCloseAssign}
        maxWidth="sm"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '18px' }}>
          Assign Service Request
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            {members.length ? (
              <FormControl fullWidth>
                <InputLabel>Assignee</InputLabel>
                <Select
                  label="Assignee"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                >
                  {members.map((member) => (
                    <MenuItem key={member.id || member._id} value={member.id || member._id}>
                      {member.name || [member.firstName, member.lastName].filter(Boolean).join(' ') || member.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                label="Assignee ID"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                fullWidth
              />
            )}
            <TextField
              label="Assignment Note"
              value={assignNote}
              onChange={(e) => setAssignNote(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseAssign} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAssignSubmit}
            sx={{ textTransform: 'none' }}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServiceRequests;

