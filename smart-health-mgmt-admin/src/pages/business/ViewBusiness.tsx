"use client";

import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  ShieldCheck,
  Globe,
  Lock,
  Download
} from "lucide-react";
import { motion } from "framer-motion";
import { getBusinessOwnerById } from "../../api/authApi";
import { formatUploadUrl } from "../../utils/urlHelper";

export default function ViewBusiness() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: business, isLoading, isError } = useQuery({
    queryKey: ["business", id],
    queryFn: () => getBusinessOwnerById(id!),
    enabled: !!id,
  });

  if (isLoading) return <BusinessSkeleton />;

  if (isError || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center font-aeonik">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Business record not found.</p>
          <button onClick={() => navigate(-1)} className="text-[#734A97] font-bold underline">Return to List</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FD] p-4 md:p-8 font-aeonik">
      <div className="max-w-[1600px] mx-auto space-y-8">

        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(-1)}
              className="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm hover:bg-gray-50 transition-all text-gray-600"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Business Profile</h1>
              {/* <p className="text-gray-400 font-bold text-sm tracking-widest uppercase mt-1">
                License: <span className="text-[#734A97]">{business.businessLicense || "N/A"}</span>
              </p> */}
            </div>
          </div>

          {/* <div className="flex gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-all">
              <Printer size={18} className="text-gray-400" /> Print
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#734A97] text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-200 hover:opacity-90 transition-all">
              <Download size={18} /> Export Profile
            </button>
          </div> */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT: Business Core Info */}
          <div className="lg:col-span-2 space-y-6">

            {/* Main Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-white p-10 relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row gap-8 items-start">
                <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-[#734A97] to-[#A17DC3] flex items-center justify-center flex-shrink-0 shadow-xl shadow-purple-100">
                  <Building2 size={48} className="text-white" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tighter">{business.businessName}</h2>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${business.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                      {business.status || "Pending"}
                    </span>
                  </div>
                  <p className="text-gray-500 font-bold flex items-center gap-2 mb-8">
                    <Globe size={16} className="text-[#734A97]" />
                    Corporate Entity
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10 bg-gray-50/50 p-8 rounded-[32px] border border-gray-100">
                    <InfoBlock icon={<User size={18} />} label="Owner Name" value={business.ownerName} />
                    <InfoBlock icon={<Mail size={18} />} label="Business Email" value={business.email} />
                    <InfoBlock icon={<Phone size={18} />} label="Contact Number" value={business.mobile} />
                    <InfoBlock icon={<MapPin size={18} />} label="HQ Address" value={business.businessAddress} />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Document / License Section */}
            <div className="bg-white rounded-[40px] p-10 border border-white shadow-sm">
              <h4 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-4">
                <span className="w-3 h-8 bg-[#734A97] rounded-full" />
                Registration Documents
              </h4>
              <div className="border border-gray-100 rounded-3xl p-6 bg-gray-50/30 flex flex-col md:flex-row items-center gap-8 group hover:border-purple-200 transition-all">
                <div className="w-32 h-44 bg-white rounded-2xl border border-gray-100 flex-shrink-0 overflow-hidden shadow-sm flex items-center justify-center group-hover:shadow-md transition-all">
                  {business.businessLicense?.toLowerCase().endsWith('.pdf') ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={48} className="text-[#734A97]" />
                      <span className="text-xs font-black text-[#734A97]">PDF DOCUMENT</span>
                    </div>
                  ) : (
                    <img 
                      src={formatUploadUrl(business.businessLicense)} 
                      alt="License" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/120x160?text=License";
                      }}
                    />
                  )}
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h5 className="font-black text-gray-900 text-lg tracking-tight mb-2">Business License Document</h5>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-[2px] mb-6">Official Registration Artifact</p>
                  
                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
                    <a 
                      href={formatUploadUrl(business.businessLicense)} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="px-8 py-3 bg-[#734A97] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-purple-100"
                    >
                      <FileText size={16} /> View Full Document
                    </a>
                    <a 
                      href={formatUploadUrl(business.businessLicense)} 
                      download 
                      className="px-8 py-3 bg-white border border-gray-200 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2"
                    >
                      <Download size={16} /> Download
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Security & QR */}
          <div className="space-y-8">
            {/* Account Security Card */}
            <div className="bg-[#1A1A2E] rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16" />
              <h4 className="font-bold text-lg mb-8 tracking-tight flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-400" />
                Security & Verification
              </h4>
              <div className="space-y-4">
                <StatusItem label="KYC Verification" active={business.status === 'active'} />
                <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <Lock size={18} className="text-gray-400" />
                    <span className="text-sm font-bold opacity-80">Credentials</span>
                  </div>
                  <span className="text-[10px] font-black uppercase bg-white/10 px-2 py-1 rounded tracking-tighter text-gray-300">Encrypted</span>
                </div>
              </div>
            </div>

            {/* Business Contact Summary */}
            <div className="bg-white rounded-[40px] p-10 border border-white shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
              <h4 className="text-lg font-black text-gray-900 mb-6 text-center">Digital Footprint</h4>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4 border border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#734A97]">
                    <Globe size={18} />
                  </div>
                  <span className="text-sm font-bold text-gray-600 truncate">{business.email}</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4 border border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-500">
                    <Phone size={18} />
                  </div>
                  <span className="text-sm font-bold text-gray-600">{business.mobile}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ---------------- Helper Components ---------------- */

const BusinessSkeleton = () => (
  <div className="min-h-screen bg-[#F8F9FD] p-8 animate-pulse font-aeonik">
    <div className="max-w-[1400px] mx-auto space-y-8">
      <div className="h-20 bg-gray-200 rounded-3xl w-1/3" />
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 h-[500px] bg-gray-200 rounded-[40px]" />
        <div className="col-span-1 h-[500px] bg-gray-200 rounded-[40px]" />
      </div>
    </div>
  </div>
);

const InfoBlock = ({ icon, label, value }: any) => (
  <div className="flex items-start gap-4">
    <div className="p-3 rounded-2xl bg-white text-[#734A97] shadow-sm border border-gray-100">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
      <p className="text-sm font-bold text-gray-800 break-words">{value || "N/A"}</p>
    </div>
  </div>
);

const StatusItem = ({ label, active }: { label: string, active: boolean }) => (
  <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
    <span className="text-sm font-bold opacity-80">{label}</span>
    <div className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-amber-400 shadow-[0_0_10px_#fbbf24]'}`} />
  </div>
);