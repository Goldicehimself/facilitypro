import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ComplianceChart = ({ data = null, equipment = null, overdue = null }) => {
  const chartData = useMemo(() => {
    return Array.isArray(data) ? data : [];
  }, [data]);
  const equipmentData = useMemo(() => {
    return Array.isArray(equipment) ? equipment : [];
  }, [equipment]);
  const overdueData = useMemo(() => {
    return Array.isArray(overdue) ? overdue : [];
  }, [overdue]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { current: 0, average: 0, target: 0, trend: 0 };
    }

    const current = chartData[chartData.length - 1].compliance;
    const previous = chartData[chartData.length - 2]?.compliance || current;
    const average = Math.round(
      chartData.reduce((sum, item) => sum + item.compliance, 0) / chartData.length
    );
    const target = chartData[0]?.target || 0;
    const trend = current - previous;

    return { current, average, target, trend };
  }, [chartData]);

  const isCompliant = stats.current >= stats.target;
  const status = isCompliant ? 'On Track' : 'Below Target';

  return (
    <div className="space-y-6">
      {/* Compliance Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-300 mb-1">
            Current Compliance
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
              {stats.current}%
            </span>
            <span className={`text-sm font-semibold ${stats.trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {stats.trend >= 0 ? '+' : ''}{stats.trend}%
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-300 mb-1">
            Target
          </p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {stats.target}%
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-300 mb-1">
            Average
          </p>
          <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
            {stats.average}%
          </p>
        </div>

        <div className={`bg-gradient-to-br ${isCompliant 
          ? 'from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900' 
          : 'from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900'
        } rounded-lg p-4 border ${isCompliant 
          ? 'border-emerald-200 dark:border-emerald-800' 
          : 'border-amber-200 dark:border-amber-800'
        }`}>
          <p className={`text-sm font-medium mb-1 ${isCompliant 
            ? 'text-emerald-600 dark:text-emerald-300' 
            : 'text-amber-600 dark:text-amber-300'
          }`}>
            Status
          </p>
          <div className="flex items-center gap-2">
            {isCompliant ? (
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            )}
            <span className={`font-bold ${isCompliant 
              ? 'text-emerald-900 dark:text-emerald-100' 
              : 'text-amber-900 dark:text-amber-100'
            }`}>
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Compliance Trend Chart */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Compliance Trend (Last 6 Months)
        </h4>
        {chartData.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No compliance trend data available yet.
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
                domain={[0, 100]}
                className="text-xs text-zinc-600 dark:text-zinc-400"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
                formatter={(value) => `${value}%`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="compliance"
                stroke="#4f46e5"
                strokeWidth={3}
                dot={{ fill: '#4f46e5', r: 5 }}
                activeDot={{ r: 7 }}
                name="Compliance %"
              />
              <Bar
                dataKey="target"
                fill="#93c5fd"
                opacity={0.3}
                name="Target %"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tasks Breakdown */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Tasks Breakdown
        </h4>
        {chartData.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No task breakdown data available yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
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
              />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Completed" />
              <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Compliance Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Equipment Categories */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Compliance by Equipment
          </h4>
          {equipmentData.length === 0 ? (
            <div className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
              No equipment compliance data available yet.
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              {equipmentData.map((item) => (
                <div key={item.assetId || item.name} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {item.completed}/{item.total} completed
                    </p>
                  </div>
                  <Badge className={item.compliance >= 90 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100' : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100'}>
                    {item.compliance}%
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Critical Alerts */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Overdue Tasks
          </h4>
          {overdueData.length === 0 ? (
            <div className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
              No overdue task data available yet.
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              {overdueData.map((task) => (
                <div key={task.id || task.name} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {task.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {task.assetName} • {task.daysOverdue}d overdue
                    </p>
                  </div>
                  <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-100">
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplianceChart;

