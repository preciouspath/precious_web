import React from 'react';
import { Layout, CreditCard, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const placements = [
  { 
    id: 'dashboard_banner', 
    title: 'Dashboard Banner', 
    description: 'Prominent banner displayed at the top of the patient dashboard carousel.', 
    icon: Layout,
    preview: 'bg-purple-100'
  },
  { 
    id: 'sponsored_card', 
    title: 'Sponsored Card', 
    description: 'Native-style card integrated directly into the patient feed or report list.', 
    icon: CreditCard,
    preview: 'bg-blue-100'
  },
];

interface StepPlacementProps {
  selected: string;
  onSelect: (id: string) => void;
}

const StepPlacement: React.FC<StepPlacementProps> = ({ selected, onSelect }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-['AeonikBold'] text-slate-900">Choose ad placement</h2>
        <p className="text-slate-500 mt-2">Decide where your ad will appear within the patient application.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {placements.map((p) => (
          <motion.div
            key={p.id}
            whileHover={{ y: -4 }}
            onClick={() => onSelect(p.id)}
            className={`cursor-pointer group relative rounded-2xl border-2 overflow-hidden transition-all duration-300 ${
              selected === p.id 
                ? 'border-[#9146C1] bg-white shadow-2xl shadow-purple-500/10' 
                : 'border-slate-100 bg-white hover:border-purple-200'
            }`}
          >
            {/* Visual Preview Placeholder */}
            <div className={`h-40 ${p.preview} flex items-center justify-center transition-all group-hover:scale-105 duration-500`}>
                <p className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Placement Preview</p>
            </div>

            <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selected === p.id ? 'bg-[#9146C1] text-white' : 'bg-slate-50 text-slate-400'}`}>
                            <p.icon size={20} />
                        </div>
                        <h3 className="text-lg font-['AeonikBold'] text-slate-900">{p.title}</h3>
                    </div>
                    {selected === p.id && (
                        <div className="w-6 h-6 bg-[#9146C1] rounded-full flex items-center justify-center text-white">
                            <Check size={14} />
                        </div>
                    )}
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{p.description}</p>
            </div>
            
            {/* Hover State Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#9146C1]/0 to-[#9146C1]/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StepPlacement;
