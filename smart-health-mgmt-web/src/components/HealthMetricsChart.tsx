import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface HealthMetric {
  day?: string;
  week?: string;
  date?: string;
  steps: number;
  heartRate: number;
  bloodOxygen: number;
}

interface HealthMetricsChartProps {
  data: HealthMetric[];
  period: 'weekly' | 'monthly';
  summary?: {
    averageSteps: number;
    averageHeartRate: number;
    averageBloodOxygen: number;
  };
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
        <p className="text-sm font-semibold text-slate-800 mb-2">
          {payload[0].payload.day || payload[0].payload.week}
        </p>
        {payload.map((entry: any, idx: number) => (
          <div key={idx}>
            <p className="text-xs font-medium" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const HealthMetricsChart: React.FC<HealthMetricsChartProps> = ({
  data,
  period,
  summary
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-72 text-slate-400">
        No trend data available for this period
      </div>
    );
  }

  // Format data for display
  const chartData = data.map((item) => ({
    ...item,
    label: item.day || item.week || ''
  }));

  return (
    <div className="w-full space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">
              Average Steps
            </p>
            <p className="text-2xl font-bold text-blue-900">
              {summary.averageSteps.toLocaleString()}
            </p>
            <p className="text-xs text-blue-600 mt-1">steps per {period === 'weekly' ? 'day' : 'week'}</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <p className="text-xs text-red-600 font-semibold uppercase tracking-wide mb-1">
              Average Heart Rate
            </p>
            <p className="text-2xl font-bold text-red-900">
              {summary.averageHeartRate} bpm
            </p>
            <p className="text-xs text-red-600 mt-1">beats per minute</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">
              Average Blood Oxygen
            </p>
            <p className="text-2xl font-bold text-green-900">
              {summary.averageBloodOxygen}%
            </p>
            <p className="text-xs text-green-600 mt-1">SpO2 level</p>
          </div>
        </div>
      )}

      {/* Steps vs Heart Rate Comparison Chart */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-6 border border-slate-300 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Steps & Heart Rate Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              stroke="#64748b"
              style={{ fontSize: '12px', fontWeight: 500 }}
            />
            <YAxis
              yAxisId="left"
              stroke="#3b82f6"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#ef4444"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '13px', fontWeight: 500 }}
              iconType="line"
            />
            <Bar
              yAxisId="left"
              dataKey="steps"
              fill="#3b82f6"
              name="Steps"
              radius={[8, 8, 0, 0]}
              opacity={0.8}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="heartRate"
              stroke="#ef4444"
              strokeWidth={3}
              name="Heart Rate (bpm)"
              dot={{ fill: '#ef4444', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Blood Oxygen Trend Chart */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-6 border border-slate-300 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Blood Oxygen Levels (SpO2)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              stroke="#64748b"
              style={{ fontSize: '12px', fontWeight: 500 }}
            />
            <YAxis
              domain={[90, 100]}
              stroke="#10b981"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 500 }} />
            <Line
              type="monotone"
              dataKey="bloodOxygen"
              stroke="#10b981"
              strokeWidth={3}
              name="SpO2 Level (%)"
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const isLow = payload.bloodOxygen < 95;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isLow ? 6 : 5}
                    fill={isLow ? '#ef4444' : '#10b981'}
                    stroke={isLow ? '#991b1b' : '#047857'}
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <span className="font-semibold">Healthy Range:</span> Normal SpO2 levels are typically 95-100%. Values below 95% may indicate oxygen saturation issues.
          </p>
        </div>
      </div>

      {/* All Metrics Combined View */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-6 border border-slate-300 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">All Metrics Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              stroke="#64748b"
              style={{ fontSize: '12px', fontWeight: 500 }}
            />
            <YAxis
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 500 }} />
            <Bar dataKey="steps" fill="#3b82f6" name="Steps" radius={[8, 8, 0, 0]} />
            <Bar dataKey="heartRate" fill="#ef4444" name="Heart Rate (bpm)" radius={[8, 8, 0, 0]} />
            <Bar dataKey="bloodOxygen" fill="#10b981" name="SpO2 (%)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HealthMetricsChart;
