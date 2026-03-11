import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const MetricCard = ({ label, value, trend, trendLabel, trendTone }) => {
  const trendStyles = {
    up: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    neutral: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    down: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
  };

  const TrendIcon = trend === 'down' ? TrendingDown : TrendingUp;

  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              {label}
            </p>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {value}
            </p>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded ${trendStyles[trendTone]}`}>
            <TrendIcon className="h-4 w-4" />
            <span className="text-sm font-semibold">{trendLabel}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PerformanceMetrics = ({ stats }) => {
  const averageRating = stats.averageRating || 0;
  const monthlySpend = stats.monthlySpend || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Total Vendors"
        value={stats.totalVendors}
        trend="up"
        trendLabel="+8%"
        trendTone="up"
      />
      <MetricCard
        label="Active Contracts"
        value={stats.activeContracts}
        trend="up"
        trendLabel="+3%"
        trendTone="up"
      />
      <MetricCard
        label="Average Rating"
        value={averageRating}
        trend="up"
        trendLabel="+0.2"
        trendTone="neutral"
      />
      <MetricCard
        label="Monthly Spend"
        value={`$${(monthlySpend / 1000).toFixed(0)}K`}
        trend="down"
        trendLabel="-3%"
        trendTone="down"
      />
    </div>
  );
};

export default PerformanceMetrics;
