import React from 'react';
import { Target, Users, MessageSquare, MousePointer2, Heart, Megaphone } from 'lucide-react';
import { motion } from 'framer-motion';

const objectives = [
  { id: 'reach', title: 'Reach', description: 'Show your ad to the maximum number of people', icon: Target, color: 'bg-blue-50 text-blue-600' },
  { id: 'traffic', title: 'Traffic', description: 'Send people to a destination, like your website', icon: MousePointer2, color: 'bg-emerald-50 text-emerald-600' },
  { id: 'messages', title: 'Messages', description: 'Get more people to message your business', icon: MessageSquare, color: 'bg-purple-50 text-purple-600' },
  { id: 'leads', title: 'Leads', description: 'Collect leads for your business or brand', icon: Users, color: 'bg-orange-50 text-orange-600' },
  { id: 'engagement', title: 'Engagement', description: 'Get more page likes, event responses or post reacts', icon: Heart, color: 'bg-rose-50 text-rose-600' },
  { id: 'brand_awareness', title: 'Brand Awareness', description: 'Increase awareness for your brand', icon: Megaphone, color: 'bg-indigo-50 text-indigo-600' },
];

interface StepObjectiveProps {
  selected: string;
  onSelect: (id: string) => void;
}

const StepObjective: React.FC<StepObjectiveProps> = ({ selected, onSelect }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-['AeonikBold'] text-slate-900">What is your campaign objective?</h2>
        <p className="text-slate-500 mt-2">Choose the goal that best describes what you want people to do when they see your ad.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {objectives.map((obj) => (
          <motion.div
            key={obj.id}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(obj.id)}
            className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-200 ${
              selected === obj.id 
                ? 'border-[#9146C1] bg-purple-50/30 ring-4 ring-purple-50' 
                : 'border-slate-100 bg-white hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5'
            }`}
          >
            <div className={`w-12 h-12 ${obj.color} rounded-xl flex items-center justify-center mb-4`}>
              <obj.icon size={24} />
            </div>
            <h3 className="text-lg font-['AeonikBold'] text-slate-900 mb-1">{obj.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{obj.description}</p>
            
            {selected === obj.id && (
              <motion.div 
                layoutId="active-indicator"
                className="mt-4 flex items-center text-[#9146C1] text-xs font-['AeonikBold'] uppercase tracking-widest"
              >
                Selected Objective
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StepObjective;
