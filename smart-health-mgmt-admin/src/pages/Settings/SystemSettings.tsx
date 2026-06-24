import { useState, useEffect, useRef } from "react";
import { Globe, Mail, Phone, Info, Save, Facebook, Twitter, Instagram, Upload, Camera, Loader2, X, Calendar, ShieldCheck, CreditCard } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { getSettings, updateSetting, uploadSettingImage } from "../../api/settingsApi";

const ImagePicker = ({ label, value, onChange, preview, onClear }: any) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const baseUrl = import.meta.env.VITE_IMAGE_URL || "http://localhost:4000";
  const displayUrl = preview || (value ? (value.startsWith('http') ? value : `${baseUrl}${value}`) : null);

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{label}</label>
      <div
        className={`relative group h-40 rounded-2xl border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center cursor-pointer ${displayUrl ? 'border-purple-200' : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
          }`}
        onClick={() => fileInputRef.current?.click()}
      >
        {displayUrl ? (
          <>
            <img src={displayUrl} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white">
                <Camera size={20} />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="p-2 bg-rose-500/80 backdrop-blur-md rounded-xl text-white hover:bg-rose-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </>
        ) : (
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Upload size={24} />
            </div>
            <p className="text-xs font-bold text-gray-500">Click to upload image</p>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-medium">JPG, PNG up to 5MB</p>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onChange(file);
          }}
        />
      </div>
    </div>
  );
};

export default function SystemSettings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: getSettings,
  });

  const [formValues, setFormValues] = useState<any>({
    facebook_url: "",
    twitter_url: "",
    pinterest_url: "",
    instagram_url: "",
    support_email: "",
    support_phone: "",
    default_free_subscription_days: "",
    free_plan_ocr_monthly_limit: "",
    about_us_intro_text: "",
    about_us_doctor_image: "",
    about_us_vision_text: "",
    about_us_vision_image: "",
    about_us_team_description: "",
    about_us_member1_name: "",
    about_us_member1_role: "",
    about_us_member1_image: "",
    about_us_member2_name: "",
    about_us_member2_role: "",
    about_us_member2_image: "",
    about_us_member3_name: "",
    about_us_member3_role: "",
    about_us_member3_image: "",
    premium_plan_monthly_price: "",
    ads_global_enabled: "true",
    ads_base_cpm: "10",
    ads_base_cpc: "0.5",
    ads_auto_approve: "false",
  });

  const [pendingFiles, setPendingFiles] = useState<any>({});
  const [previews, setPreviews] = useState<any>({});
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (settings && Array.isArray(settings)) {
      const values: any = { ...formValues };
      settings.forEach((s: any) => {
        if (values.hasOwnProperty(s.key)) {
          values[s.key] = s.value;
        }
      });
      setFormValues(values);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: updateSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update setting");
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (name: string, file: File) => {
    setPendingFiles((prev: any) => ({ ...prev, [name]: file }));
    const previewUrl = URL.createObjectURL(file);
    setPreviews((prev: any) => ({ ...prev, [name]: previewUrl }));
  };

  const clearFile = (name: string) => {
    setPendingFiles((prev: any) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    if (previews[name]) {
      URL.revokeObjectURL(previews[name]);
      setPreviews((prev: any) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    setFormValues((prev: any) => ({ ...prev, [name]: "" }));
  };

  const saveSection = async (keys: string[]) => {
    setIsUploading(true);
    let updatedCount = 0;

    try {
      const finalFormValues = { ...formValues };

      // Step 1: Handle image uploads
      for (const key of keys) {
        if (pendingFiles[key]) {
          const uploadedUrl = await uploadSettingImage(pendingFiles[key]);
          finalFormValues[key] = uploadedUrl;
          // Clear successful upload from pending
          const nextPending = { ...pendingFiles };
          delete nextPending[key];
          setPendingFiles(nextPending);
        }
      }

      // Step 2: Save to database
      const promises = keys.map(async (key) => {
        const value = finalFormValues[key];
        if (value && value.trim() !== "") {
          updatedCount++;
          return mutation.mutateAsync({ key, value });
        }
        return Promise.resolve();
      });

      await Promise.all(promises);

      if (updatedCount > 0) {
        toast.success("Section updated successfully");
      } else {
        toast.info("No changes to save");
      }
    } catch (err: any) {
      console.error("Save Error:", err);
      toast.error(err.response?.data?.message || "Failed to save section");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto font-aeonik">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
            <p className="text-gray-500 text-sm">Manage dynamic content for parent application</p>
          </div>
          <div className="px-4 py-2 bg-purple-50 text-[#734A97] rounded-xl text-[10px] font-black uppercase tracking-widest border border-purple-100">
            Live Configuration
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">

          {/* Social Links Section */}
          <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-blue-100/50"></div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-500 shadow-sm shadow-blue-100">
                  <Globe size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Social Media Links</h3>
                  <p className="text-xs text-gray-400 font-medium">Configure footer social icons</p>
                </div>
              </div>
              <button
                onClick={() => saveSection(['facebook_url', 'twitter_url', 'pinterest_url', 'instagram_url'])}
                disabled={mutation.isPending || isUploading}
                className="flex items-center gap-2 bg-[#734A97] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-purple-200 transition-all disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Save Social Links
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: "facebook_url", label: "Facebook URL", icon: <Facebook size={18} /> },
                { name: "twitter_url", label: "Twitter (X) URL", icon: <Twitter size={18} /> },
                { name: "pinterest_url", label: "Pinterest URL", icon: <Globe size={18} /> },
                { name: "instagram_url", label: "Instagram URL", icon: <Instagram size={18} /> },
              ].map((field) => (
                <div key={field.name} className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{field.label}</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-[#734A97] transition-colors">
                      {field.icon}
                    </div>
                    <input
                      name={field.name}
                      value={formValues[field.name]}
                      onChange={handleInputChange}
                      placeholder={`Enter ${field.label}`}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-purple-100 focus:bg-white outline-none transition-all font-medium text-sm text-gray-700"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-emerald-100/50"></div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-500 shadow-sm shadow-emerald-100">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Contact Information</h3>
                  <p className="text-xs text-gray-400 font-medium">Manage support reach-out details</p>
                </div>
              </div>
              <button
                onClick={() => saveSection(['support_email', 'support_phone', 'default_free_subscription_days', 'free_plan_ocr_monthly_limit', 'premium_plan_monthly_price'])}
                disabled={mutation.isPending || isUploading}
                className="flex items-center gap-2 bg-[#734A97] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-purple-200 transition-all disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Save Contact Info
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Support Email</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-[#734A97] transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    name="support_email"
                    value={formValues.support_email}
                    onChange={handleInputChange}
                    placeholder="support@example.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-purple-100 focus:bg-white outline-none transition-all font-medium text-sm text-gray-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Support Phone</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-[#734A97] transition-colors">
                    <Phone size={18} />
                  </div>
                  <input
                    name="support_phone"
                    value={formValues.support_phone}
                    onChange={handleInputChange}
                    placeholder="+1 234 567 890"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-purple-100 focus:bg-white outline-none transition-all font-medium text-sm text-gray-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Free Subscription Days</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-[#734A97] transition-colors">
                    <Calendar size={18} />
                  </div>
                  <input
                    name="default_free_subscription_days"
                    type="number"
                    value={formValues.default_free_subscription_days}
                    onChange={handleInputChange}
                    placeholder="30"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-purple-100 focus:bg-white outline-none transition-all font-medium text-sm text-gray-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Free Plan OCR Limit (Monthly)</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-[#734A97] transition-colors">
                    <ShieldCheck size={18} />
                  </div>
                  <input
                    name="free_plan_ocr_monthly_limit"
                    type="number"
                    value={formValues.free_plan_ocr_monthly_limit}
                    onChange={handleInputChange}
                    placeholder="20"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-purple-100 focus:bg-white outline-none transition-all font-medium text-sm text-gray-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Premium Plan Price ($)</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-[#734A97] transition-colors">
                    <CreditCard size={18} />
                  </div>
                  <input
                    name="premium_plan_monthly_price"
                    type="number"
                    value={formValues.premium_plan_monthly_price}
                    onChange={handleInputChange}
                    placeholder="10"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-purple-100 focus:bg-white outline-none transition-all font-medium text-sm text-gray-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Advertising Configuration Section */}
          <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50/50 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-purple-100/50"></div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-50 rounded-2xl text-[#734A97] shadow-sm shadow-purple-100">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Advertising Configuration</h3>
                  <p className="text-xs text-gray-400 font-medium">Global ad platform behavior and rates</p>
                </div>
              </div>
              <button
                onClick={() => saveSection(['ads_global_enabled', 'ads_base_cpm', 'ads_base_cpc', 'ads_auto_approve'])}
                disabled={mutation.isPending || isUploading}
                className="flex items-center gap-2 bg-[#734A97] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-purple-200 transition-all disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Save Ad Config
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Global Ad Delivery</label>
                <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                   <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${formValues.ads_global_enabled === 'true' || formValues.ads_global_enabled === true ? 'bg-emerald-500' : 'bg-gray-300'}`}
                        onClick={() => setFormValues((p:any) => ({...p, ads_global_enabled: p.ads_global_enabled === 'true' || p.ads_global_enabled === true ? 'false' : 'true'}))}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formValues.ads_global_enabled === 'true' || formValues.ads_global_enabled === true ? 'translate-x-4' : 'translate-x-0'}`} />
                   </div>
                   <span className="text-sm font-bold text-gray-600">{formValues.ads_global_enabled === 'true' || formValues.ads_global_enabled === true ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Auto-Approve Business Ads</label>
                <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                   <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${formValues.ads_auto_approve === 'true' || formValues.ads_auto_approve === true ? 'bg-emerald-500' : 'bg-gray-300'}`}
                        onClick={() => setFormValues((p:any) => ({...p, ads_auto_approve: p.ads_auto_approve === 'true' || p.ads_auto_approve === true ? 'false' : 'true'}))}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formValues.ads_auto_approve === 'true' || formValues.ads_auto_approve === true ? 'translate-x-4' : 'translate-x-0'}`} />
                   </div>
                   <span className="text-sm font-bold text-gray-600">{formValues.ads_auto_approve === 'true' || formValues.ads_auto_approve === true ? 'Auto-Approve' : 'Manual Review'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Base CPM Rate ($ / 1,000 views)</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-[#734A97] transition-colors">
                    <Globe size={18} />
                  </div>
                  <input
                    name="ads_base_cpm"
                    type="number"
                    step="0.01"
                    value={formValues.ads_base_cpm}
                    onChange={handleInputChange}
                    placeholder="10.00"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-purple-100 focus:bg-white outline-none transition-all font-medium text-sm text-gray-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Base CPC Rate ($ / click)</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-[#734A97] transition-colors">
                    <CreditCard size={18} />
                  </div>
                  <input
                    name="ads_base_cpc"
                    type="number"
                    step="0.01"
                    value={formValues.ads_base_cpc}
                    onChange={handleInputChange}
                    placeholder="0.50"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-purple-100 focus:bg-white outline-none transition-all font-medium text-sm text-gray-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* About Us Page Sections */}
          <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50/50 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-purple-100/50"></div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-50 rounded-2xl text-[#734A97] shadow-sm shadow-purple-100">
                  <Info size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">About Us Page Content</h3>
                  <p className="text-xs text-gray-400 font-medium">Control the storytelling on about us page</p>
                </div>
              </div>
              <button
                onClick={() => saveSection([
                  'about_us_intro_text', 'about_us_doctor_image',
                  'about_us_vision_text', 'about_us_vision_image',
                  'about_us_team_description',
                  'about_us_member1_name', 'about_us_member1_role', 'about_us_member1_image',
                  'about_us_member2_name', 'about_us_member2_role', 'about_us_member2_image',
                  'about_us_member3_name', 'about_us_member3_role', 'about_us_member3_image'
                ])}
                disabled={mutation.isPending || isUploading}
                className="flex items-center gap-2 bg-[#734A97] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-purple-200 transition-all disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Save About Us
              </button>
            </div>

            <div className="space-y-8">
              {/* Intro Sub-section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
                <div className="md:col-span-2 flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-6 bg-[#734A97] rounded-full"></div>
                  <h4 className="font-black text-[10px] text-gray-400 uppercase tracking-[2px]">Intro Hero Section</h4>
                </div>
                <div className="space-y-2 md:col-span-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Intro Description</label>
                  <textarea
                    name="about_us_intro_text"
                    value={formValues.about_us_intro_text}
                    onChange={handleInputChange}
                    rows={8}
                    className="w-full p-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-purple-100 outline-none transition-all font-medium text-[13px] text-gray-700 resize-none shadow-sm"
                  />
                </div>
                <div className="md:col-span-1">
                  <ImagePicker
                    label="Hero Image"
                    name="about_us_doctor_image"
                    value={formValues.about_us_doctor_image}
                    preview={previews.about_us_doctor_image}
                    onChange={(file: File) => handleFileChange('about_us_doctor_image', file)}
                    onClear={() => clearFile('about_us_doctor_image')}
                  />
                </div>
              </div>

              {/* Vision Sub-section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
                <div className="md:col-span-2 flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-6 bg-[#734A97] rounded-full"></div>
                  <h4 className="font-black text-[10px] text-gray-400 uppercase tracking-[2px]">Our Vision Section</h4>
                </div>
                <div className="space-y-2 md:col-span-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Vision Statement (Use \n for paragraphs)</label>
                  <textarea
                    name="about_us_vision_text"
                    value={formValues.about_us_vision_text}
                    onChange={handleInputChange}
                    rows={8}
                    className="w-full p-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-purple-100 outline-none transition-all font-medium text-[13px] text-gray-700 resize-none shadow-sm"
                  />
                </div>
                <div className="md:col-span-1">
                  <ImagePicker
                    label="Vision Side Image"
                    name="about_us_vision_image"
                    value={formValues.about_us_vision_image}
                    preview={previews.about_us_vision_image}
                    onChange={(file: File) => handleFileChange('about_us_vision_image', file)}
                    onClear={() => clearFile('about_us_vision_image')}
                  />
                </div>
              </div>

              {/* Team Sub-section */}
              <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1.5 h-6 bg-[#734A97] rounded-full"></div>
                  <h4 className="font-black text-[10px] text-gray-400 uppercase tracking-[2px]">Team Management</h4>
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Section Intro Text</label>
                    <input name="about_us_team_description" value={formValues.about_us_team_description} onChange={handleInputChange} className="w-full px-4 py-3.5 bg-white border border-gray-100 rounded-xl outline-none font-medium text-[13px] text-gray-700 shadow-sm" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(num => (
                      <div key={num} className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-center px-1">
                          <span className="inline-block px-3 py-1 bg-purple-50 text-[#734A97] rounded-lg text-[9px] font-black uppercase tracking-widest border border-purple-100">Member {num}</span>
                        </div>

                        <div className="flex flex-col gap-4">
                          <div className="h-48">
                            <ImagePicker
                              label=""
                              name={`about_us_member${num}_image`}
                              value={formValues[`about_us_member${num}_image`]}
                              preview={previews[`about_us_member${num}_image`]}
                              onChange={(file: File) => handleFileChange(`about_us_member${num}_image`, file)}
                              onClear={() => clearFile(`about_us_member${num}_image`)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <input placeholder="Full Name" name={`about_us_member${num}_name`} value={formValues[`about_us_member${num}_name`]} onChange={handleInputChange} className="w-full px-4 py-2 text-xs font-bold text-gray-800 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-100 outline-none transition-all" />
                            <input placeholder="Job Title / Role" name={`about_us_member${num}_role`} value={formValues[`about_us_member${num}_role`]} onChange={handleInputChange} className="w-full px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-100 outline-none transition-all" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
