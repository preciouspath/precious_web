import React, { useRef } from 'react';
import { Image as ImageIcon, Type, Link as LinkIcon, Upload, MousePointer2 } from 'lucide-react';

interface StepCreativeProps {
  data: {
    creativeType: 'image' | 'video';
    headline: string;
    description: string;
    ctaType: string;
    ctaLink: string;
    imageFile: File | null;
    imageUrl: string;
  };
  updateData: (fields: any) => void;
}

const ctaOptions = [
  { id: 'learn_more', label: 'Learn More' },
  { id: 'book_now', label: 'Book Now' },
  { id: 'contact_us', label: 'Contact Us' },
  { id: 'visit_website', label: 'Visit Website' },
  { id: 'get_offer', label: 'Get Offer' },
  { id: 'sign_up', label: 'Sign Up' },
];

const StepCreative: React.FC<StepCreativeProps> = ({ data, updateData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateData({ imageFile: file, imageUrl: url });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-['AeonikBold'] text-slate-900">Design your creative</h2>
        <p className="text-slate-500 mt-2">Upload your media and craft the message your audience will see.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Editor Side */}
        <div className="space-y-8">
          {/* Media Type - Image Only */}
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
            <div
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-['AeonikBold'] uppercase tracking-widest bg-white text-slate-900 shadow-sm"
            >
              <ImageIcon size={16} /> Image
            </div>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-[#9146C1] hover:bg-purple-50/30 transition-all overflow-hidden"
          >
            {data.imageUrl ? (
              <div className="w-full h-full relative">
                {data.creativeType === 'image' ? (
                  <img src={data.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <video src={data.imageUrl} className="w-full h-full object-cover" controls />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <p className="text-white text-xs font-['AeonikBold'] uppercase tracking-widest flex items-center gap-2">
                    <Upload size={16} /> Change Media
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload size={24} className="text-[#9146C1]" />
                </div>
                <p className="text-sm font-['AeonikBold'] text-slate-900">Upload {data.creativeType}</p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG, or MP4 up to 20MB</p>
              </>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={data.creativeType === 'image' ? 'image/*' : 'video/*'}
              className="hidden"
            />
          </div>

          {/* Text Content */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-['AeonikBold'] text-slate-700 uppercase tracking-widest">
                <Type size={14} /> Headline
              </label>
              <input
                type="text"
                placeholder="Ex: Free Health Checkup this Sunday!"
                value={data.headline}
                onChange={(e) => updateData({ headline: e.target.value })}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-purple-100 focus:border-[#9146C1] outline-none transition-all text-sm font-['AeonikMedium']"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-['AeonikBold'] text-slate-700 uppercase tracking-widest">
                <Type size={14} /> Description
              </label>
              <textarea
                placeholder="Describe your offer or services in detail..."
                value={data.description}
                onChange={(e) => updateData({ description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-purple-100 focus:border-[#9146C1] outline-none transition-all text-sm font-['AeonikMedium'] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Preview Side */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <label className="text-xs font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Live Preview</label>
            <div className="flex items-center gap-2 text-[10px] font-['AeonikBold'] text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Mobile View
            </div>
          </div>

          {/* Mobile Device Frame Mockup */}
          <div className="relative mx-auto w-72 h-[500px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-800 rounded-b-2xl z-20" />

            <div className="h-full bg-white overflow-hidden flex flex-col">
              <div className="p-4 flex items-center justify-between border-b border-slate-50">
                <div className="w-8 h-8 bg-slate-100 rounded-full" />
                <div className="flex-1 ml-3 space-y-1">
                  <div className="w-20 h-2 bg-slate-100 rounded" />
                  <div className="w-12 h-1.5 bg-slate-50 rounded" />
                </div>
              </div>

              <div className="flex-1 bg-slate-50 p-4">
                <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-widest font-['AeonikBold']">Sponsored</p>

                {/* THE AD CARD PREVIEW */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="h-32 bg-slate-100">
                    {data.imageUrl && <img src={data.imageUrl} className="w-full h-full object-cover" />}
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="text-sm font-['AeonikBold'] text-slate-900 truncate">{data.headline || 'Your Headline Here'}</h4>
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{data.description || 'Your description will appear here as the secondary text for the ad.'}</p>
                    <div className="pt-2">
                      <div className="w-full py-2 bg-[#9146C1] text-white text-[10px] font-['AeonikBold'] uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5">
                        <MousePointer2 size={12} /> {ctaOptions.find(o => o.id === data.ctaType)?.label || 'Learn More'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA & Link Editor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-['AeonikBold'] text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <MousePointer2 size={14} /> CTA Button
              </label>
              <select
                value={data.ctaType}
                onChange={(e) => updateData({ ctaType: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-['AeonikMedium'] appearance-none cursor-pointer"
              >
                {ctaOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-['AeonikBold'] text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <LinkIcon size={14} /> Link URL
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={data.ctaLink}
                onChange={(e) => updateData({ ctaLink: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-['AeonikMedium']"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepCreative;
