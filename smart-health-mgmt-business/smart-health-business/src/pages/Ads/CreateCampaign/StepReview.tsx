import React from 'react';
import { Target, Users, MapPin, DollarSign, Calendar, Zap, Layout, CheckCircle2, CreditCard } from 'lucide-react';

interface StepReviewProps {
  data: any;
}

const StepReview: React.FC<StepReviewProps> = ({ data }) => {
  const totalBudget = data.dailyBudget * data.duration;

  const sections = [
    {
      title: 'Campaign Goal',
      icon: Target,
      items: [
        { label: 'Objective', value: data.objective.replace('_', ' '), icon: Target },
        { label: 'Placement', value: data.placement.replace('_', ' '), icon: Layout },
      ]
    },
    {
      title: 'Audience Targeting',
      icon: Users,
      items: [
        { label: 'Locations', value: data.locations.map((l: any) => l.label).join(', ') || 'All Locations', icon: MapPin },
        { label: 'Age Range', value: `${data.ageRange.min} - ${data.ageRange.max} years`, icon: Users },
        { label: 'Genders', value: data.genders.join(', '), icon: Users },
        { label: 'Interests', value: data.interests.join(', ') || 'General Audience', icon: CheckCircle2 },
      ]
    },
    {
      title: 'Budget & Schedule',
      icon: DollarSign,
      items: [
        { label: 'Daily Budget', value: `$${data.dailyBudget}`, icon: DollarSign },
        { label: 'Total Duration', value: `${data.duration} Days`, icon: Calendar },
        { label: 'Total Investment', value: `$${totalBudget}`, icon: Zap },
        { label: 'Billing Model', value: data.billingModel.toUpperCase(), icon: Zap },
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-['AeonikBold'] text-slate-900">Review & Proceed to Payment</h2>
        <p className="text-slate-500 mt-2">Check your campaign details. You'll complete payment on the next step.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detail Sections */}
        <div className="lg:col-span-2 space-y-6">
          {sections.map((section, idx) => (
            <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-['AeonikBold'] text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <section.icon size={14} /> {section.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-10">
                {section.items.map((item, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">{item.label}</p>
                    <p className="text-sm font-['AeonikBold'] text-slate-900 capitalize">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Ad Preview Summary */}
        <div className="space-y-6">
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <h3 className="text-xs font-['AeonikBold'] text-slate-400 uppercase tracking-widest mb-4">Ad Creative Preview</h3>
                <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-slate-100">
                    <div className="h-40 bg-slate-100">
                        {data.imageUrl && <img src={data.imageUrl} className="w-full h-full object-cover" />}
                    </div>
                    <div className="p-4 space-y-2">
                        <h4 className="text-sm font-['AeonikBold'] text-slate-900">{data.headline}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{data.description}</p>
                        <div className="pt-2">
                            <div className="w-full py-2.5 bg-[#9146C1] text-white text-[10px] font-['AeonikBold'] uppercase tracking-widest rounded-lg flex items-center justify-center">
                                {data.ctaType.replace('_', ' ')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#9146C1] rounded-2xl p-6 text-white">
                <p className="text-[10px] font-['AeonikBold'] text-purple-200 uppercase tracking-widest mb-1">Total to Pay</p>
                <h4 className="text-3xl font-['AeonikBold']">${totalBudget.toLocaleString()}</h4>
                <p className="text-xs text-purple-200 mt-4 leading-relaxed">
                    Click "Proceed to Payment" to enter your card details and submit the campaign for review.
                </p>
            </div>

            {/* Payment notice */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-3">
              <CreditCard size={18} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-['AeonikBold'] text-blue-800">Stripe Secure Payment</p>
                <p className="text-[11px] text-blue-600 mt-1 leading-relaxed">
                  You'll be asked to enter your card details on the next step. Payment is processed securely via Stripe.
                </p>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StepReview;
