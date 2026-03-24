import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatters';

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
  const getTrend = (value) => {
    if (value === null || value === undefined) {
      return { label: '—', tone: 'neutral', dir: 'up' };
    }
    const rounded = Math.round(value * 10) / 10;
    return {
      label: `${rounded >= 0 ? '+' : ''}${rounded}`,
      tone: rounded >= 0 ? 'up' : 'down',
      dir: rounded >= 0 ? 'up' : 'down'
    };
  };

  const totalVendorsTrend = getTrend(stats.totalVendorsTrend);
  const activeContractsTrend = getTrend(stats.activeContractsTrend);
  const averageRatingTrend = getTrend(stats.averageRatingTrend);
  const monthlySpendTrend = getTrend(stats.monthlySpendTrend);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Total Vendors"
        value={stats.totalVendors}
        trend={totalVendorsTrend.dir}
        trendLabel={totalVendorsTrend.label}
        trendTone={totalVendorsTrend.tone}
      />
      <MetricCard
        label="Active Contracts"
        value={stats.activeContracts}
        trend={activeContractsTrend.dir}
        trendLabel={activeContractsTrend.label}
        trendTone={activeContractsTrend.tone}
      />
      <MetricCard
        label="Average Rating"
        value={averageRating}
        trend={averageRatingTrend.dir}
        trendLabel={averageRatingTrend.label}
        trendTone={averageRatingTrend.tone}
      />
      <MetricCard
        label="Monthly Spend"
        value={formatCurrency(monthlySpend)}
        trend={monthlySpendTrend.dir}
        trendLabel={monthlySpendTrend.label}
        trendTone={monthlySpendTrend.tone}
      />
    </div>
  );
};

export default PerformanceMetrics;
