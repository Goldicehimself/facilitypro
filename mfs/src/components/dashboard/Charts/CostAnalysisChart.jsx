import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

const CostAnalysisChart = ({ data = null }) => {
  const chartData = useMemo(() => {
    return Array.isArray(data) ? data : [];
  }, [data]);

  // Calculate cost statistics
  const stats = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { totalCost: 0, preventivePercentage: 0, savingsVsLast: 0 };
    }

    const currentMonth = chartData[chartData.length - 1];
    const previousMonth = chartData[chartData.length - 2];
    const totalCost = currentMonth.total;
    const preventivePercentage = Math.round(
      (currentMonth.preventive / currentMonth.total) * 100
    );
    const savingsVsLast = previousMonth ? previousMonth.total - currentMonth.total : 0;

    return { totalCost, preventivePercentage, savingsVsLast };
  }, [chartData]);

  const isSavings = stats.savingsVsLast > 0;
  const distribution = useMemo(() => {
    if (!chartData.length) return [];
    const currentMonth = chartData[chartData.length - 1];
    const preventive = Number(currentMonth.preventive || 0);
    const corrective = Number(currentMonth.corrective || 0);
    const emergency = Number(currentMonth.emergency || 0);
    const total = Number(currentMonth.total || preventive + corrective + emergency);
    if (!total) return [];
    return [
      { type: 'Preventive Maintenance', color: 'bg-emerald-500', amount: preventive, percentage: Math.round((preventive / total) * 100) },
      { type: 'Corrective Maintenance', color: 'bg-amber-500', amount: corrective, percentage: Math.round((corrective / total) * 100) },
      { type: 'Emergency Repairs', color: 'bg-red-500', amount: emergency, percentage: Math.round((emergency / total) * 100) },
    ];
  }, [chartData]);

  return (
    <div className="space-y-6">
      {/* Cost Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-300 mb-1">
            Current Month Cost
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {formatCurrency(stats.totalCost)}
            </span>
            <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-300 mb-1">
            Preventive %
          </p>
          <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
            {stats.preventivePercentage}%
          </p>
        </div>

        <div className={`bg-gradient-to-br ${isSavings 
          ? 'from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900' 
          : 'from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900'
        } rounded-lg p-4 border ${isSavings 
          ? 'border-emerald-200 dark:border-emerald-800' 
          : 'border-amber-200 dark:border-amber-800'
        }`}>
          <p className={`text-sm font-medium mb-1 ${isSavings 
            ? 'text-emerald-600 dark:text-emerald-300' 
            : 'text-amber-600 dark:text-amber-300'
          }`}>
            vs Last Month
          </p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${isSavings 
              ? 'text-emerald-900 dark:text-emerald-100' 
              : 'text-amber-900 dark:text-amber-100'
            }`}>
              {formatCurrency(Math.abs(stats.savingsVsLast))}
            </span>
            {isSavings && (
              <TrendingDown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
        </div>
      </div>

      {/* Cost Breakdown Chart */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Monthly Cost Breakdown
        </h4>
        {chartData.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No cost breakdown data available yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
              <XAxis 
                dataKey="month" 
                className="text-xs text-zinc-600 dark:text-zinc-400"
              />
              <YAxis 
                className="text-xs text-zinc-600 dark:text-zinc-400"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
                formatter={(value) => formatCurrency(value)}
              />
              <Legend />
              <Bar dataKey="preventive" fill="#10b981" name="Preventive Maintenance" />
              <Bar dataKey="corrective" fill="#f59e0b" name="Corrective Maintenance" />
              <Bar dataKey="emergency" fill="#ef4444" name="Emergency Repairs" />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={{ fill: '#4f46e5', r: 4 }}
                name="Total Cost"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Cost by Type */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Cost Distribution
        </h4>
        {distribution.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No cost distribution data available yet.
          </p>
        ) : (
          <div className="space-y-4">
            {distribution.map((item) => (
              <div key={item.type}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {item.type}
                  </p>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${item.color}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {item.percentage}% of total
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CostAnalysisChart;

