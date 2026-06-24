import React from 'react';
import { DollarSign, Calendar, Zap, Info } from 'lucide-react';

interface StepBudgetProps {
  data: {
    dailyBudget: number;
    duration: number;
    billingModel: 'cpm' | 'cpc';
    startDate: string;
  };
  updateData: (fields: any) => void;
}

const StepBudget: React.FC<StepBudgetProps> = ({ data, updateData }) => {
  const totalBudget = data.dailyBudget * data.duration;

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-['AeonikBold'] text-slate-900">Budget & Schedule</h2>
        <p className="text-slate-500 mt-2">Control how much you spend and when your ads will run.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Budget Settings */}
        <div className="lg:col-span-2 space-y-10">
          {/* Daily Budget */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-['AeonikBold'] text-slate-700 uppercase tracking-wider">
                <DollarSign size={18} className="text-[#9146C1]" /> Daily Budget
              </label>
              <div className="px-4 py-2 bg-purple-50 rounded-lg">
                <span className="text-xl font-['AeonikBold'] text-[#9146C1]">${data.dailyBudget}</span>
                <span className="text-xs text-purple-400 font-['AeonikMedium'] ml-1">/ day</span>
              </div>
            </div>
            <input
              type="range"
              min="5"
              max="500"
              step="5"
              value={data.dailyBudget}
              onChange={(e) => updateData({ dailyBudget: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#9146C1]"
            />
            <div className="flex justify-between text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">
              <span>Min: $5</span>
              <span>Recommended: $50</span>
              <span>Max: $500</span>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-['AeonikBold'] text-slate-700 uppercase tracking-wider">
                <Calendar size={18} className="text-[#9146C1]" /> Duration
              </label>
              <div className="px-4 py-2 bg-blue-50 rounded-lg">
                <span className="text-xl font-['AeonikBold'] text-blue-600">{data.duration}</span>
                <span className="text-xs text-blue-400 font-['AeonikMedium'] ml-1">days</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="90"
              step="1"
              value={data.duration}
              onChange={(e) => updateData({ duration: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">
              <span>1 Day</span>
              <span>30 Days (Standard)</span>
              <span>90 Days</span>
            </div>
          </div>

          {/* Billing Model */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-['AeonikBold'] text-slate-700 uppercase tracking-wider">
              <Zap size={18} className="text-[#9146C1]" /> Billing Model
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => updateData({ billingModel: 'cpm' })}
                className={`flex-1 p-6 rounded-2xl border-2 text-left transition-all ${data.billingModel === 'cpm'
                    ? 'border-[#9146C1] bg-purple-50/30'
                    : 'border-slate-100 hover:border-purple-200'
                  }`}
              >
                <h4 className="font-['AeonikBold'] text-slate-900">CPM (Impressions)</h4>
                <p className="text-xs text-slate-500 mt-1">Pay for every 1,000 people who see your ad. Best for brand awareness.</p>
              </button>
              <button
                onClick={() => updateData({ billingModel: 'cpc' })}
                className={`flex-1 p-6 rounded-2xl border-2 text-left transition-all ${data.billingModel === 'cpc'
                    ? 'border-[#9146C1] bg-purple-50/30'
                    : 'border-slate-100 hover:border-purple-200'
                  }`}
              >
                <h4 className="font-['AeonikBold'] text-slate-900">CPC (Clicks)</h4>
                <p className="text-xs text-slate-500 mt-1">Pay only when someone clicks on your ad. Best for website traffic.</p>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white h-fit sticky top-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <DollarSign size={20} className="text-white" />
            </div>
            <h3 className="text-lg font-['AeonikBold']">Order Summary</h3>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
              <span className="text-slate-400">Daily Spend</span>
              <span className="font-['AeonikBold']">${data.dailyBudget.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
              <span className="text-slate-400">Running for</span>
              <span className="font-['AeonikBold']">{data.duration} Days</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-400">Total Budget</span>
              <div className="text-right">
                <span className="text-3xl font-['AeonikBold'] block">${totalBudget.toLocaleString()}</span>
                <span className="text-[10px] font-['AeonikBold'] text-purple-400 uppercase tracking-widest mt-1">USD</span>
              </div>
            </div>
          </div>

          <div className="mt-10 p-4 bg-white/5 rounded-2xl flex gap-3">
            <Info size={18} className="text-purple-400 shrink-0" />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Your budget will be distributed evenly over the duration of the campaign. You can pause at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepBudget;
