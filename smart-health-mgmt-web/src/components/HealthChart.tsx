import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  // ReferenceLine,
} from 'recharts';

interface HealthData {
  day?: string;
  label?: string;
  date?: string;
  steps: number;
}

interface HealthChartProps {
  data: HealthData[];
  period?: 'weekly' | 'monthly';
  summary?: {
    averageSteps: number;
  };
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 min-w-[220px]">
        <p className="font-semibold text-slate-900 mb-2">
          {item.label || item.day}
        </p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4 text-sm text-slate-700">
            <span>Steps</span>
            <span className="font-semibold text-slate-900">{payload[0].value.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const HealthChart: React.FC<HealthChartProps> = ({ data, period }) => {
  const hasValidStepData = data && data.some((item) => item.steps > 0);

  if (!data || data.length === 0 || !hasValidStepData) {
    return (
      <div className="w-full rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-lg font-semibold text-slate-900">No step data available</p>
        <p className="mt-3 text-sm text-slate-500">
          Sync your smartwatch or add step data to see your daily step trend.
        </p>
      </div>
    );
  }

  const maxSteps = Math.max(...data.map((item) => item.steps), 10000);
  const chartTop = Math.max(period === 'monthly' ? 70000 : 10000, Math.ceil(maxSteps / 2000) * 2000);
  // const stepsGoal = 10000;
  // const goalValue = period === 'monthly' ? stepsGoal * 7 : stepsGoal;
  // const goalLabel = period === 'monthly' ? 'Weekly Goal 70k' : 'Goal 10k';
  // const summaryGoalLabel = period === 'monthly' ? 'Weekly Step Goal' : 'Daily Step Goal';
  // const summaryGoalValue = period === 'monthly' ? '70,000' : '10,000';
  // const summaryGoalSubtext = period === 'monthly' ? 'Target per weekly bucket' : 'Keep the streak going';

  return (
    <div className="w-full space-y-6">
      {/* {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400 mb-2">Average Daily Steps</p>
            <p className="text-4xl font-bold text-slate-900">{summary.averageSteps.toLocaleString()}</p>
            <p className="text-sm text-slate-500 mt-2">Last {data.length} days</p>
          </div>
          <div className="bg-white rounded-3xl p-5 text-slate-900 shadow-lg">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400 mb-2">{summaryGoalLabel}</p>
            <p className="text-4xl font-semibold">{summaryGoalValue}</p>
            <p className="text-sm text-slate-500 mt-2">{summaryGoalSubtext}</p>
          </div>
        </div>
      )} */}

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              {period === 'monthly' ? 'Monthly Week Buckets' : 'Daily Steps Trend'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {period === 'monthly'
                ? 'Current month displayed as weekly step buckets for a cleaner, professional chart.'
                : 'Only steps data shown for a cleaner, professional view.'}
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={data} margin={{ top: 15, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="#64748b" tick={{ fontSize: 12, fill: '#475569' }} />
            <YAxis domain={[0, chartTop]} tickLine={false} axisLine={false} stroke="#64748b" tick={{ fontSize: 12, fill: '#475569' }} />
            <Tooltip content={<CustomTooltip />} />
            {/* <ReferenceLine
              y={goalValue}
              stroke="#f97316"
              strokeDasharray="6 6"
              label={{ value: goalLabel, position: 'top', fill: '#f97316', fontSize: 12 }}
            /> */}
            <Bar dataKey="steps" fill="#2563eb" radius={[12, 12, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>

        {/* <div className="mt-4 rounded-2xl bg-slate-50 p-4 border border-slate-200 text-sm text-slate-600">
          This chart displays only daily step count for a simpler and more professional dashboard look.
        </div> */}
      </div>
    </div>
  );
};

export default HealthChart;
