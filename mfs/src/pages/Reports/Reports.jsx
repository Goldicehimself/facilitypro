import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Avatar,
  IconButton,
  Tooltip as MuiTooltip,
  Divider,
  Container,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  TrendingUp,
  TrendingDown,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Banknote,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { fetchReports, exportReport, fetchReportWarnings } from '../../api/reports';
import { createPreventiveMaintenance } from '../../api/preventiveMaintenance';
import { formatCurrency } from '@/utils/formatters';

const ReportsPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [timeRange, setTimeRange] = useState('Last 30 days');
  const [activeFilter, setActiveFilter] = useState('All Status');

  const rangeDays = useMemo(() => {
    switch (timeRange) {
      case 'Last 7 days':
        return 7;
      case 'Last 90 days':
        return 90;
      case 'Last Year':
        return 365;
      case 'Last 30 days':
      default:
        return 30;
    }
  }, [timeRange]);

  const { data: reports = {} } = useQuery(['reports', rangeDays], () => fetchReports(rangeDays));
  const { data: reportWarnings = [] } = useQuery('report-warnings', fetchReportWarnings);
  const [dismissedWarnings, setDismissedWarnings] = useState([]);
  const [scheduling, setScheduling] = useState(false);
  const [exporting, setExporting] = useState(false);

  const {
    summary = {},
    workOrderTrends = [],
    costBreakdown = [],
    assetPerformance = {},
    scheduleOverview = [],
  } = reports;

  const safeSummary = {
    totalWorkOrders: 0,
    totalWorkOrdersTrend: 0,
    completionRate: 0,
    completionRateTrend: 0,
    avgResponseTime: 0,
    avgResponseTimeTrend: 0,
    totalCosts: 0,
    totalCostsTrend: 0,
    ...summary,
  };

  const safeAssetPerformance = {
    activeAssets: 0,
    assetsTrend: 0,
    uptime: 0,
    uptimeTrend: 0,
    criticalIssues: 0,
    criticalTrend: 0,
    repairCosts: 0,
    repairTrend: 0,
    ...assetPerformance,
  };

  const getFilenameFromHeaders = (headers) => {
    const contentDisposition = headers?.['content-disposition'] || headers?.['Content-Disposition'];
    if (!contentDisposition) return null;
    const match = contentDisposition.match(/filename="([^"]+)"/i);
    return match ? match[1] : null;
  };

  const handleExportReport = async () => {
    try {
      setExporting(true);
      const response = await exportReport('pdf', rangeDays);
      if (!response) {
        toast.error('Failed to export report.');
        return;
      }
      const filename = getFilenameFromHeaders(response.headers) || `report_${rangeDays}_days.pdf`;
      const blob = new Blob([response.data], {
        type: response.headers?.['content-type'] || 'application/pdf'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported.');
    } catch (error) {
      toast.error('Failed to export report.');
    } finally {
      setExporting(false);
    }
  };

  const currentWarning = useMemo(
    () => reportWarnings.find((warning) => !dismissedWarnings.includes(warning.id)),
    [reportWarnings, dismissedWarnings]
  );

  const handleScheduleNow = async () => {
    if (!currentWarning?.action?.payload) {
      toast.error('No schedule data available.');
      return;
    }
    try {
      setScheduling(true);
      await createPreventiveMaintenance(currentWarning.action.payload);
      toast.success('Preventive maintenance scheduled.');
      setDismissedWarnings((prev) => [...prev, currentWarning.id]);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to schedule preventive maintenance.');
    } finally {
      setScheduling(false);
    }
  };

  const handleLater = () => {
    if (!currentWarning?.id) return;
    setDismissedWarnings((prev) => [...prev, currentWarning.id]);
  };

  const formatTrend = (value) => `${value >= 0 ? '+' : ''}${Math.round(value)}%`;
  const formatCurrencyShort = (value) => {
    const numeric = Number(value) || 0;
    if (Math.abs(numeric) >= 1000) {
      return `NGN ${(numeric / 1000).toFixed(1)}K`;
    }
    return `NGN ${numeric.toFixed(0)}`;
  };

  const costColors = {
    preventive: '#4f46e5',
    corrective: '#f59e0b',
    emergency: '#ef4444',
    other: '#6b7280'
  };

  return (
    <Container maxWidth="xl" sx={{ minHeight: '100vh', background: isDark ? 'linear-gradient(135deg, #0b1120 0%, #111827 100%)' : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)', py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'flex-start' }, gap: { xs: 2, md: 4 } }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary' }}>
            Reports & Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
            Monitor maintenance performance and analyze operational trends
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
          <FormControl size="small" sx={{ minWidth: 160, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="Last 7 days">This Week</MenuItem>
              <MenuItem value="Last 30 days">This Month</MenuItem>
              <MenuItem value="Last 90 days">This Quarter</MenuItem>
              <MenuItem value="Last Year">Last Year</MenuItem>
            </Select>
          </FormControl>
          <Button 
            variant="contained" 
            size="small" 
            startIcon={<Download size={14} />} 
            onClick={handleExportReport}
            disabled={exporting}
            sx={{ fontWeight: 600, textTransform: 'none', fontSize: '0.85rem', width: { xs: '100%', sm: 'auto' } }}
          >
            {exporting ? 'Exporting...' : 'Export Report'}
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Work Orders */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderLeft: '6px solid #4f46e5', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.12)', transform: 'translateY(-2px)' } }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Total Work Orders
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    {safeSummary.totalWorkOrders.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#4f46e520', width: 42, height: 42, color: '#4f46e5' }}>
                  <TrendingUp size={18} />
                </Avatar>
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip
                  label={formatTrend(safeSummary.totalWorkOrdersTrend)}
                  size="small"
                  color={safeSummary.totalWorkOrdersTrend >= 0 ? 'success' : 'error'}
                  variant="filled"
                  sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                  {timeRange}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Completion Rate */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderLeft: '6px solid #059669', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.12)', transform: 'translateY(-2px)' } }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Completion Rate
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    {safeSummary.completionRate}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#05966920', width: 42, height: 42, color: '#059669' }}>
                  <TrendingUp size={18} />
                </Avatar>
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip
                  label={formatTrend(safeSummary.completionRateTrend)}
                  size="small"
                  color={safeSummary.completionRateTrend >= 0 ? 'success' : 'error'}
                  variant="filled"
                  sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                  {timeRange}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Avg Response Time */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderLeft: '6px solid #dc2626', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.12)', transform: 'translateY(-2px)' } }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Avg Response Time
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    {safeSummary.avgResponseTime}h
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#dc262620', width: 42, height: 42, color: '#dc2626' }}>
                  <TrendingDown size={18} />
                </Avatar>
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip
                  label={formatTrend(safeSummary.avgResponseTimeTrend)}
                  size="small"
                  color={safeSummary.avgResponseTimeTrend >= 0 ? 'success' : 'error'}
                  variant="filled"
                  sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                  {timeRange}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Costs */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderLeft: '6px solid #d97706', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.12)', transform: 'translateY(-2px)' } }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Total Costs
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    {formatCurrencyShort(safeSummary.totalCosts)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#d9770620', width: 42, height: 42, color: '#d97706' }}>
                  <Banknote size={18} />
                </Avatar>
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip
                  label={formatTrend(safeSummary.totalCostsTrend)}
                  size="small"
                  color={safeSummary.totalCostsTrend >= 0 ? 'success' : 'error'}
                  variant="filled"
                  sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                  {timeRange}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Grid - Top Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Work Order Trends */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: '#4f46e520', color: '#4f46e5', width: 36, height: 36 }}>
                    <TrendingUp size={16} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.95rem' }}>Work Order Trends</Typography>
                </Box>
                <Button 
                  size="small" 
                  variant="text" 
                  onClick={() => alert('Viewing work order trends details...')}
                  sx={{ textTransform: 'none', fontWeight: 600, color: '#4f46e5', fontSize: '0.8rem' }}
                >
                  View Details
                </Button>
              </Box>
              <Divider sx={{ mb: 2.5 }} />
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workOrderTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f2937' : '#e5e7eb'} />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#6b7280' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#fff',
                      border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      color: isDark ? '#e2e8f0' : '#111827',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                  <Bar dataKey="overdue" fill="#ef4444" name="Overdue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Cost Breakdown */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: '#d9770620', color: '#d97706', width: 36, height: 36 }}>
                    <Banknote size={16} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.95rem' }}>Cost Breakdown</Typography>
                </Box>
                <Button 
                  size="small" 
                  variant="text" 
                  onClick={() => alert('Viewing cost breakdown details...')}
                  sx={{ textTransform: 'none', fontWeight: 600, color: '#4f46e5', fontSize: '0.8rem' }}
                >
                  View Details
                </Button>
              </Box>
              <Divider sx={{ mb: 2.5 }} />
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {costBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={costColors[entry.name] || costColors.other} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#fff',
                      border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      color: isDark ? '#e2e8f0' : '#111827',
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry) => `${value}: ${formatCurrencyShort(entry.payload.value)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Grid - Bottom Row */}
      <Grid container spacing={3}>
        {/* Asset Performance */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: '#05966920', color: '#059669', width: 36, height: 36 }}>
                    <CheckCircle size={16} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.95rem' }}>Asset Performance</Typography>
                </Box>
                <Button 
                  size="small" 
                  variant="text" 
                  onClick={() => alert('Viewing all asset performance details...')}
                  sx={{ textTransform: 'none', fontWeight: 600, color: '#4f46e5', fontSize: '0.8rem' }}
                >
                  View All
                </Button>
              </Box>
              <Divider sx={{ mb: 2.5 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Active Assets */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Active Assets
                  </Typography>
                  <Chip label={`${safeAssetPerformance.assetsTrend >= 0 ? '+' : ''}${safeAssetPerformance.assetsTrend}%`} size="small" color={safeAssetPerformance.assetsTrend >= 0 ? 'success' : 'error'} variant="outlined" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {safeAssetPerformance.activeAssets}
                </Typography>

                {/* Uptime */}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Uptime
                  </Typography>
                  <Chip label={`${safeAssetPerformance.uptimeTrend >= 0 ? '+' : ''}${safeAssetPerformance.uptimeTrend}%`} size="small" color={safeAssetPerformance.uptimeTrend >= 0 ? 'success' : 'error'} variant="outlined" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {safeAssetPerformance.uptime}%
                </Typography>

                {/* Critical Issues */}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Critical Issues
                  </Typography>
                  <Chip label={`${safeAssetPerformance.criticalTrend >= 0 ? '+' : ''}${safeAssetPerformance.criticalTrend}%`} size="small" color={safeAssetPerformance.criticalTrend >= 0 ? 'success' : 'error'} variant="outlined" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {safeAssetPerformance.criticalIssues}
                </Typography>

                {/* Repair Costs */}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Repair Costs
                  </Typography>
                  <Chip label={`${safeAssetPerformance.repairTrend >= 0 ? '+' : ''}${safeAssetPerformance.repairTrend}%`} size="small" color={safeAssetPerformance.repairTrend >= 0 ? 'success' : 'error'} variant="outlined" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {formatCurrencyShort(safeAssetPerformance.repairCosts)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Schedule Overview */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: '#4f46e520', color: '#4f46e5', width: 36, height: 36 }}>
                    <Clock size={16} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.95rem' }}>Schedule Overview</Typography>
                </Box>
                <Button size="small" variant="text" sx={{ textTransform: 'none', fontWeight: 600, color: '#4f46e5', fontSize: '0.8rem' }}>Manage</Button>
              </Box>
              <Divider sx={{ mb: 2.5 }} />
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={scheduleOverview}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f2937' : '#e5e7eb'} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#6b7280' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#fff',
                      border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      color: isDark ? '#e2e8f0' : '#111827',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="scheduled"
                    stroke="#4f46e5"
                    dot={{ fill: '#4f46e5', r: 5 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Alert + Quick Filters */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Alert */}
            <Card sx={{ backgroundColor: '#1e40af', color: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                  <AlertCircle size={20} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
                      {currentWarning?.title || 'No active alerts'}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400, lineHeight: 1.5, opacity: 0.9 }}>
                      {currentWarning?.message || 'You are all set for now.'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleScheduleNow}
                    disabled={!currentWarning?.action?.payload || scheduling}
                    sx={{ flex: 1, backgroundColor: 'white', color: '#4f46e5', fontWeight: 600, textTransform: 'none', '&:hover': { backgroundColor: '#f3f4f6' } }}
                  >
                    {scheduling ? 'Scheduling...' : (currentWarning?.action?.label || 'Schedule Now')}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleLater}
                    disabled={!currentWarning}
                    sx={{ borderColor: 'white', color: 'white', fontWeight: 600, textTransform: 'none', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'white' } }}
                  >
                    Later
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Quick Filters */}
            <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.95rem', mb: 2 }}>
                  Quick Filters
                </Typography>
                <Divider sx={{ mb: 2.5 }} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {[
                    { label: 'This Week', value: 'Last 7 days' },
                    { label: 'This Month', value: 'Last 30 days' },
                    { label: 'This Quarter', value: 'Last 90 days' },
                    { label: 'Last Year', value: 'Last Year' },
                  ].map((filter) => (
                    <Chip
                      key={filter.value}
                      label={filter.label}
                      clickable
                      variant={timeRange === filter.value ? 'filled' : 'outlined'}
                      color={timeRange === filter.value ? 'primary' : 'default'}
                      size="small"
                      onClick={() => setTimeRange(filter.value)}
                      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {['All Status', 'Critical'].map((filter) => (
                    <Chip
                      key={filter}
                      label={filter}
                      clickable
                      variant={activeFilter === filter ? 'filled' : 'outlined'}
                      color={activeFilter === filter ? 'primary' : 'default'}
                      size="small"
                      onClick={() => setActiveFilter(filter)}
                      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ReportsPage;





