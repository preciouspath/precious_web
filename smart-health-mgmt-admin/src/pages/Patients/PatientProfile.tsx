"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Phone, Mail, Calendar, MapPin, QrCode,
  Droplet, Ruler, Weight, Activity, ShieldCheck,
  ChevronLeft, ExternalLink
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { getPatientById } from "../../api/authApi";
import { motion } from "framer-motion";
import Loader from "../../components/common/Loader";
import { formatUploadUrl } from "../../utils/urlHelper";


export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: patient, isLoading, isError, isFetching } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => getPatientById(id!),
    enabled: !!id,
  });

  if (isError || (!isLoading && !patient)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen font-aeonik">
        <p className="text-gray-500 mb-4">Could not find patient record.</p>
        <button
          onClick={() => navigate(-1)}
          className="text-[#734A97] font-bold hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }


  const hp = patient?.healthProfile || {};

  return (
    <div className="min-h-screen bg-[#F8F9FD] p-4 md:p-8 font-aeonik">
      {(isLoading || isFetching) && <Loader />}
      <div className="max-w-[1600px] mx-auto space-y-8">

        {/* Top Navigation & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(-1)}
              className="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm hover:bg-gray-50 hover:scale-105 transition-all text-gray-600"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Patient Details</h1>
              {/* <p className="text-gray-400 font-bold text-sm tracking-widest uppercase mt-1">
                Ref: <span className="text-[#734A97]">#{patient?._id?.slice(-8)}</span>
              </p> */}
            </div>
          </div>

          {/* <div className="flex gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-sm shadow-sm hover:shadow-md transition-all">
              <Printer size={18} className="text-gray-400" /> Print
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#734A97] text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-200 hover:opacity-90 transition-all">
              <Download size={18} /> Export PDF
            </button>
          </div> */}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">

          {/* LEFT: Profile & Medical Info (Col Span 3) */}
          <div className="xl:col-span-3 space-y-8">

            {/* Identity Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-white p-10 relative overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row gap-10 items-start">
                <div className="relative mx-auto lg:mx-0">
                  <img
                    src={patient?.profileImage ? formatUploadUrl(patient.profileImage) : `https://ui-avatars.com/api/?name=${patient?.fullName}&background=734A97&color=fff&size=200`}
                    className="w-20 h-20 rounded-[20px] object-cover ring-8 ring-purple-50 shadow-2xl"
                    alt="Profile"
                  />
                  {patient?.status === "active" && (
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2.5 rounded-2xl border-4 border-white shadow-lg">
                      <ShieldCheck size={20} />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center lg:text-left">
                  <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 mb-4">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tighter">{patient?.fullName || "N/A"}</h2>
                    <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-xl tracking-[2px] border border-emerald-100">
                      {patient?.status}
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 text-gray-500 font-bold mb-8">
                    <span className="flex items-center gap-2 capitalize"><Activity size={16} className="text-[#734A97]" /> {patient?.gender}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                    <span>{patient?.dateOfBirth ? `${new Date().getFullYear() - new Date(patient?.dateOfBirth).getFullYear()} Years Old` : "N/A"}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-[32px] border border-gray-100">
                    <ContactItem icon={<Phone size={18} />} label="Primary Contact" value={patient?.mobileNumber} />
                    <ContactItem icon={<Mail size={18} />} label="Email Address" value={patient?.email} />
                    <ContactItem icon={<MapPin size={18} />} label="Residential Address" value={patient?.address} />
                    <ContactItem icon={<Calendar size={18} />} label="Patient Since" value={new Date(patient?.createdAt).toLocaleDateString()} />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Health Vitals Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <MetricCard icon={<Droplet className="text-rose-500" />} label="Blood Group" value={hp.bloodGroup} bg="bg-rose-50" />
              <MetricCard icon={<Ruler className="text-blue-500" />} label="Height (cm)" value={hp.height} bg="bg-blue-50" />
              <MetricCard icon={<Weight className="text-orange-500" />} label="Weight (kg)" value={hp.weight} bg="bg-orange-50" />
              <MetricCard icon={<Activity className="text-emerald-500" />} label="Last Activity" value={hp.lastVisit ? "Recent" : "N/A"} bg="bg-emerald-50" />
            </div>

            {/* Medical Conditions */}
            <div className="bg-white rounded-[40px] p-10 border border-white shadow-sm">
              <h4 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-4">
                <span className="w-3 h-8 bg-[#734A97] rounded-full" />
                Diagnosed Conditions
              </h4>
              <div className="flex flex-wrap gap-4">
                {hp.healthConditions?.trim() ? (
                  <span className="px-6 py-3 bg-gray-50 text-gray-800 rounded-2xl text-sm font-bold border border-gray-100 hover:border-purple-200 hover:bg-white transition-all cursor-default">
                    {hp.healthConditions}
                  </span>
                ) : (
                  <p className="text-gray-400 font-medium italic">No chronic records found.</p>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            {hp.emergencyContact?.name && (
              <div className="bg-white rounded-[40px] p-10 border border-white shadow-sm">
                <h4 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-4">
                  <span className="w-3 h-8 bg-[#E11D48] rounded-full" />
                  Emergency Contact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-gray-50/50 p-6 rounded-[32px] border border-gray-100">
                  <ContactItem icon={<ShieldCheck size={18} />} label="Contact Name" value={hp.emergencyContact.name} />
                  <ContactItem
                    icon={<Phone size={18} />}
                    label="Contact Phone"
                    value={
                      hp.emergencyContact.countryCode && hp.emergencyContact.phone
                        ? `${hp.emergencyContact.countryCode} ${hp.emergencyContact.phone} (${hp.emergencyContact.countryName || 'India'})`
                        : hp.emergencyContact.phone || "N/A"
                    }
                  />
                  <ContactItem icon={<Activity size={18} />} label="Relation" value={hp.emergencyContact.relation || "N/A"} />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Status & QR (Col Span 1) */}
          <div className="xl:col-span-1 space-y-8">
            <div className="bg-[#1A1A2E] rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-lg mb-8 tracking-tight">System Status</h4>
              <div className="space-y-4">
                <StatusRow label="Verification" value={patient?.emailVerified ? "Verified" : "Pending"} isActive={patient?.emailVerified} />
                <StatusRow label="Record Access" value="Full" isActive={true} />
              </div>
            </div>

            <div className="bg-white rounded-[40px] p-8 border border-white shadow-[0_10px_40px_rgba(0,0,0,0.02)] text-center">
              <div className="inline-flex p-5 bg-gray-50 rounded-[32px] border border-gray-100 mb-6">
                <QrCode size={48} className="text-gray-900" />
              </div>
              <h4 className="text-xl font-black text-gray-900 mb-2">Patient QR Code</h4>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">Digital Identification</p>

              <div className="p-6 bg-white border-2 border-dashed border-gray-100 rounded-[32px]">
                {patient?.qrCode ? (
                  <img src={patient?.qrCode} className="w-full h-auto rounded-2xl" alt="QR" />
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-300 italic">No QR Generated</div>
                )}
              </div>

              {patient?.qrUrl && (
                <div className="mt-6 px-2">
                  <a
                    href={patient.qrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm font-bold text-[#734A97] hover:text-[#5a3a78] transition-colors group"
                  >
                    <span className="truncate max-w-[200px] border-b border-transparent group-hover:border-[#734A97]">
                      {patient.qrUrl}
                    </span>
                    <ExternalLink size={14} className="flex-shrink-0" />
                  </a>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div >
  );
}

/* ---------------- Helper Components ---------------- */


const ContactItem = ({ icon, label, value }: any) => (
  <div className="flex items-center gap-5">
    <div className="p-3.5 rounded-2xl bg-white text-[#734A97] shadow-sm">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
      <p className="text-sm font-bold text-gray-800">{value || "Not Provided"}</p>
    </div>
  </div>
);

const MetricCard = ({ icon, label, value, bg }: any) => (
  <div className="bg-white p-8 rounded-[35px] border border-white shadow-sm flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-300">
    <div className={`p-4 rounded-2xl ${bg} mb-4 group-hover:scale-110 transition-transform`}>{icon}</div>
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-xl font-black text-gray-900">{value || "—"}</p>
  </div>
);

const StatusRow = ({ label, value, isActive }: any) => (
  <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
    <span className="text-sm font-bold opacity-80">{label}</span>
    <div className="flex items-center gap-3">
      <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-emerald-400' : 'text-rose-400'}`}>{value}</span>
      <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-rose-400'}`} />
    </div>
  </div>
);