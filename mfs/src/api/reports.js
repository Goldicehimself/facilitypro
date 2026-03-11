import axiosInstance from './axiosConfig';

const mockReportsData = {
  summary: {
    totalWorkOrders: 1247,
    completionRate: 94.2,
    avgResponseTime: 2.4,
    totalCosts: 47200,
  },
  workOrderTrends: [
    { week: 'Week 1', completed: 280, pending: 45, overdue: 12 },
    { week: 'Week 2', completed: 310, pending: 38, overdue: 8 },
    { week: 'Week 3', completed: 290, pending: 42, overdue: 15 },
    { week: 'Week 4', completed: 340, pending: 35, overdue: 10 },
  ],
  costBreakdown: [
    { name: 'Labor', value: 21050, color: '#3b82f6' },
    { name: 'Contractors', value: 7000, color: '#ef4444' },
    { name: 'Equipment', value: 9000, color: '#f59e0b' },
    { name: 'Parts', value: 1500, color: '#10b981' },
  ],
  assetPerformance: {
    activeAssets: 847,
    assetsTrend: 2.0,
    uptime: 96.5,
    uptimeTrend: 0.8,
    criticalIssues: 23,
    criticalTrend: -3,
    repairCosts: 8200,
    repairTrend: 3.0,
  },
  scheduleOverview: [
    { day: 'Mon', scheduled: 15 },
    { day: 'Tue', scheduled: 18 },
    { day: 'Wed', scheduled: 22 },
    { day: 'Thu', scheduled: 20 },
    { day: 'Fri', scheduled: 16 },
    { day: 'Sat', scheduled: 8 },
    { day: 'Sun', scheduled: 5 },
  ],
};

export async function fetchReports() {
  const useMockReports = import.meta.env.VITE_USE_MOCK_REPORTS === 'true';
  if (useMockReports) {
    return mockReportsData;
  }

  try {
    const response = await axiosInstance.get('/reports');
    const payload = response.data?.data;
    if (!payload || Object.keys(payload).length === 0) {
      return mockReportsData;
    }
    return payload;
  } catch (error) {
    return mockReportsData;
  }
}

export async function exportReport(format = 'pdf') {
  try {
    const response = await axiosInstance.post('/reports/export', { format });
    return response.data?.data;
  } catch (error) {
    console.error('Error exporting report:', error);
  }
}
