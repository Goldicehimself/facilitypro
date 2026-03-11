import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowUpRight, BarChart3, Clock, Sparkles } from 'lucide-react';

// Components
import KPICard from '../components/dashboard/KPICards';
import RecentActivity from '../components/dashboard/RecentActivity';
import ComplianceChart from '../components/dashboard/Charts/ComplianceChart';
import CostAnalysisChart from '../components/dashboard/Charts/CostAnalysisChart';

// API
import { getDashboardData } from '../api/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useActivity } from '../contexts/ActivityContext';
import GreetingBanner from '@/components/common/GreetingBanner';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const navigate = useNavigate();
  const { activities, addActivity } = useActivity();
  const { data: dashboardData, isLoading } = useQuery(
    'dashboard',
    getDashboardData,
    {
      refetchInterval: 30000,
      onError: () => {
        toast.error('Failed to load dashboard data');
      }
    }
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || token.startsWith('local-')) return;

    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const streamUrl = `${apiBase.replace(/\/$/, '')}/activities/stream?token=${encodeURIComponent(token)}`;
    const stream = new EventSource(streamUrl);

    const iconForType = (type) => {
      if (type.startsWith('workorder')) return 'WO';
      if (type.startsWith('asset')) return 'AS';
      if (type.startsWith('maintenance')) return 'PM';
      return 'EV';
    };

    stream.addEventListener('activity', (event) => {
      try {
        const payload = JSON.parse(event.data);
        const type = payload.type || 'event';
        const action = type.includes('created')
          ? 'created'
          : type.includes('deleted')
          ? 'deleted'
          : type.includes('comment')
          ? 'comment'
          : type.includes('assigned')
          ? 'assigned'
          : type.includes('status')
          ? 'status'
          : 'updated';

        addActivity({
          id: `${type}-${payload.entityId || Date.now()}`,
          type,
          action,
          title: payload.message || 'Activity',
          description: payload.entityType || '',
          timestamp: payload.createdAt || new Date().toISOString(),
          icon: iconForType(type),
          status: null
        });
      } catch (e) {
        // ignore parse errors
      }
    });

    return () => {
      stream.close();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_55%),radial-gradient(circle_at_85%_10%,_rgba(14,165,233,0.10),_transparent_45%),linear-gradient(180deg,#f8fafc_0%,#ffffff_65%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_55%),radial-gradient(circle_at_85%_10%,_rgba(14,165,233,0.12),_transparent_45%),linear-gradient(180deg,#0b1220_0%,#0f172a_65%)]">
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.65)]">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-8 w-56 mt-3" />
            <Skeleton className="h-4 w-80 mt-2" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20 mt-3" />
                <Skeleton className="h-3 w-28 mt-2" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-40 w-full mt-4" />
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-40 w-full mt-4" />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <Skeleton className="h-5 w-40" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-3 w-24 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const defaultDashboardData = {
    openWorkOrders: 24,
    overdueWorkOrders: 5,
    pmCompliance: 87,
    pendingRequests: 12,
    activeAssets: 156,
    vendorPerformance: 92,
    complianceTrend: [
      { month: 'Jan', compliance: 78, target: 85, completed: 45, pending: 12 },
      { month: 'Feb', compliance: 82, target: 85, completed: 52, pending: 8 },
      { month: 'Mar', compliance: 80, target: 85, completed: 48, pending: 10 },
      { month: 'Apr', compliance: 85, target: 85, completed: 56, pending: 6 },
      { month: 'May', compliance: 88, target: 85, completed: 62, pending: 5 },
      { month: 'Jun', compliance: 87, target: 85, completed: 59, pending: 4 }
    ],
    costAnalysis: null,
    serviceCategories: [
      { name: 'HVAC', count: 45, trend: 'up' },
      { name: 'Electrical', count: 32, trend: 'down' },
      { name: 'Plumbing', count: 28, trend: 'up' },
      { name: 'General', count: 51, trend: 'up' }
    ]
  };

  const safeDashboardData = dashboardData && Object.keys(dashboardData).length
    ? dashboardData
    : defaultDashboardData;

  const kpis = [
    {
      title: 'Open Work Orders',
      value: safeDashboardData.openWorkOrders || 0,
      change: '+12%',
      trend: 'up',
      icon: '??',
      color: 'primary',
      link: '/work-orders?status=open'
    },
    {
      title: 'Overdue',
      value: safeDashboardData.overdueWorkOrders || 0,
      change: '-5%',
      trend: 'down',
      icon: '??',
      color: 'error',
      link: '/work-orders?status=overdue'
    },
    {
      title: 'PM Compliance',
      value: `${safeDashboardData.pmCompliance || 0}%`,
      change: '+8%',
      trend: 'up',
      icon: '?',
      color: 'success',
      link: '/preventive-maintenance'
    },
    {
      title: 'Pending Requests',
      value: safeDashboardData.pendingRequests || 0,
      change: '+3%',
      trend: 'up',
      icon: '??',
      color: 'warning',
      link: '/service-requests'
    },
    {
      title: 'Active Assets',
      value: safeDashboardData.activeAssets || 0,
      change: '+2%',
      trend: 'up',
      icon: '??',
      color: 'info',
      link: '/assets'
    },
    {
      title: 'Vendor Performance',
      value: `${safeDashboardData.vendorPerformance || 0}%`,
      change: '+4%',
      trend: 'up',
      icon: '??',
      color: 'secondary',
      link: '/vendors'
    }
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_55%),radial-gradient(circle_at_85%_10%,_rgba(14,165,233,0.10),_transparent_45%),linear-gradient(180deg,#f8fafc_0%,#ffffff_65%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_55%),radial-gradient(circle_at_85%_10%,_rgba(14,165,233,0.12),_transparent_45%),linear-gradient(180deg,#0b1220_0%,#0f172a_65%)]">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <GreetingBanner subtitle="Real-time visibility across work orders, assets, and compliance health." />
        <div className="mt-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.65)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">Operations</p>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-2">Admin Dashboard</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Real-time visibility across work orders, assets, and compliance health.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100">Live</Badge>
              <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Updated every 30s</Badge>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1">
                <Sparkles className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                System health: Stable
              </div>
              <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1">
                <Clock className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                Last sync: {new Date().toLocaleTimeString()}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                className="bg-blue-700 text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                onClick={() => {
                  addActivity({
                    type: 'user_action',
                    action: 'created',
                    title: 'New Service Request Initiated',
                    description: 'User started creating a new maintenance request',
                    user: 'Current User',
                    status: 'pending'
                  });
                  navigate('/service-requests/new');
                }}
              >
                ?? New Request
              </Button>
              <Button
                variant="outline"
                className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => {
                  addActivity({
                    type: 'work_order',
                    action: 'created',
                    title: 'New Work Order Created',
                    description: 'User initiated work order creation',
                    user: 'Current User',
                    status: 'pending'
                  });
                  navigate('/work-orders/new');
                }}
              >
                Create Work Order
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-md dark:bg-slate-900">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      Preventive Maintenance Compliance
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Track PM compliance trends over time
                    </p>
                  </div>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ComplianceChart data={safeDashboardData.complianceTrend} />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md dark:bg-slate-900">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      Maintenance Cost Analysis
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Monthly maintenance expenses
                    </p>
                  </div>
                  <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CostAnalysisChart data={safeDashboardData.costAnalysis} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-md h-full dark:bg-slate-900">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Recent Activity
                  </h3>
                  <div className="p-2 bg-amber-50 dark:bg-amber-950 rounded-lg">
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <RecentActivity activities={activities} />
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-0 shadow-md dark:bg-slate-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Service Categories
              </h3>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {safeDashboardData.serviceCategories?.map((category) => (
                <div key={category.name} className="text-center p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:shadow-md transition-shadow">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                    {category.count}
                  </div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    {category.name}
                  </p>
                  <Badge
                    variant={category.trend === 'up' ? 'default' : 'secondary'}
                    className={category.trend === 'up'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100'
                    }
                  >
                    {category.trend === 'up' ? 'Up' : 'Down'} {category.trend === 'up' ? 'Increasing' : 'Decreasing'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
