"use client";

import {
  Search, Eye, Flag, Hash, Calendar, Loader2,
  ChevronLeft, ChevronRight, FileText, CheckCircle, Languages,
  User, QrCode
} from "lucide-react";
import Modal from "../../components/common/Modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQrOcrMonitoringLogs, toggleFlagApi, translateOcrText, getPatients } from "../../api/authApi";
import { useState } from "react";
import { toast } from "react-toastify";

export default function QrOcrMonitoring() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"logs" | "qrcodes">("logs");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [qrModalUser, setQrModalUser] = useState<any | null>(null);

  // Upload state
  // const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // const [isUploading, setIsUploading] = useState(false);
  // const [uploadProgress, setUploadProgress] = useState("");
  // console.log(isUploading, uploadProgress)
  // Translation state
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState("hi");
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Logs Query
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ["qr-ocr-monitoring", search, page, limit],
    queryFn: () => getQrOcrMonitoringLogs({ search, page, limit }),
    enabled: activeTab === "logs",
  });

  // QR Codes Query (Fetching patients to see their QRs)
  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: ["admin-patients", search, page, limit],
    queryFn: () => getPatients({ page, limit, search }),
    enabled: activeTab === "qrcodes",
  });

  const isLoading = activeTab === "logs" ? logsLoading : patientsLoading;

  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleFlagApi(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["qr-ocr-monitoring"] });
      toast.success(res.message);
      if (selected && selected._id === res.data._id) {
        setSelected({ ...selected, flagged: res.data.isFlagged });
      }
    },
    onError: () => {
      toast.error("Failed to update flag status");
    }
  });

  const rows = activeTab === "logs" ? (logsData?.data || []) : (patientsData?.data || []);
  const meta = activeTab === "logs" ? (logsData?.meta || { total: 0, page: 1, totalPages: 1 }) : (patientsData?.meta || { total: 0, page: 1, totalPages: 1 });

  const toggleFlag = (id: string) => {
    toggleMutation.mutate(id);
  };

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  // Upload mutation
  // const uploadMutation = useMutation({
  //   mutationFn: (file: File) => uploadOcrDocument(file),
  //   onSuccess: (res) => {
  //     queryClient.invalidateQueries({ queryKey: ["qr-ocr-monitoring"] });
  //     toast.success(res.message || "Document uploaded and processed successfully!");
  //     setSelectedFile(null);
  //     setIsUploading(false);
  //     setUploadProgress("");
  //     // Auto-open the new entry
  //     if (res.data) {
  //       setTimeout(() => {
  //         const newEntry = {
  //           _id: res.data._id,
  //           scanningId: `OCR-${res.data._id.toString().slice(-4).toUpperCase()}`,
  //           user: res.data.patientId?.fullName || "OCR Test Patient",
  //           userId: res.data.patientId?._id,
  //           type: "Prescription OCR",
  //           text: res.data.ocrText || "No text extracted",
  //           date: res.data.createdAt,
  //           flagged: res.data.isFlagged || false,
  //           extractedData: res.data.extractedData,
  //           fileUrl: res.data.fileUrl
  //         };
  //         setSelected(newEntry);
  //       }, 500);
  //     }
  //   },
  //   onError: (error: any) => {
  //     toast.error(error.response?.data?.message || "Upload failed");
  //     setIsUploading(false);
  //     setUploadProgress("");
  //   }
  // });

  // Translation mutation
  const translateMutation = useMutation({
    mutationFn: ({ text, targetLanguage }: { text: string; targetLanguage: string }) =>
      translateOcrText(text, targetLanguage),
    onSuccess: (res) => {
      setTranslatedText(res.translatedText);
      setDetectedLanguage(res.detectedLanguage);
      setIsTranslating(false);
      toast.success("Translation completed!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Translation failed");
      setIsTranslating(false);
    }
  });

  // const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files && e.target.files[0]) {
  //     setSelectedFile(e.target.files[0]);
  //   }
  // };

  // const handleUpload = () => {
  //   if (!selectedFile) return;
  //   setIsUploading(true);
  //   setUploadProgress("Uploading and processing OCR...");
  //   uploadMutation.mutate(selectedFile);
  // };

  const handleTranslate = () => {
    if (!selected?.text) return;
    setIsTranslating(true);
    translateMutation.mutate({ text: selected.text, targetLanguage });
  };

  // Helper to parse the markdown-like AI text into sections
  const parseOcrText = (text: string) => {
    if (!text) return [];

    const sections: { title: string; content: string }[] = [];
    // Split by markdown headers (### **X. Title**)
    const parts = text.split(/###\s+\*\*(\d+\.\s+[^:]+)\*\*/g);

    if (parts.length <= 1) {
      // Fallback if no specific headers found
      return [{ title: "Extracted Content", content: text }];
    }

    for (let i = 1; i < parts.length; i += 2) {
      const title = parts[i].trim();
      const content = parts[i + 1]?.trim() || "";
      if (title && content) {
        sections.push({ title, content });
      }
    }

    return sections;
  };

  return (
    <div className="p-8 bg-white min-h-screen font-aeonik">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">QR & OCR Monitoring</h1>
          <p className="text-sm text-gray-500">Review AI-extracted data and manage flagged detections</p>
        </div>
      </div>

      {/* Search Bar & Tabs */}
      <div className={`flex flex-col md:flex-row md:items-center gap-6 mb-8 ${activeTab === 'logs' ? 'justify-end' : 'justify-between'}`}>
        {activeTab !== 'logs' && (
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search patients..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-gray-50 border-none rounded-xl pl-11 pr-4 py-3 w-full text-sm focus:ring-2 focus:ring-purple-100 outline-none transition-all"
            />
          </div>
        )}

        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab("logs"); setPage(1); }}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "logs" ? "bg-white text-[#734A97] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            OCR Logs
          </button>
          <button
            onClick={() => { setActiveTab("qrcodes"); setPage(1); }}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "qrcodes" ? "bg-white text-[#734A97] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Patient QR Codes
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Scanning ID</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">User Details</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Extraction Type</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Extracted Content</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                      <p className="text-sm text-gray-400">Loading {activeTab === 'logs' ? 'monitoring logs' : 'patient data'}...</p>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-400 text-sm">
                    No results found.
                  </td>
                </tr>
              ) : activeTab === "logs" ? (
                rows.map((r: any) => (
                  <tr key={r._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-500 group-hover:bg-purple-50 group-hover:text-[#734A97] transition-all">
                          <Hash size={14} />
                        </div>
                        <span className="font-bold text-gray-700 text-sm">{r.scanningId || `OCR-${r._id.toString().slice(-4).toUpperCase()}`}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="font-bold text-gray-800 text-sm">{r.user}</p>
                      <p className="text-xs text-gray-400 flex items-center mt-1">
                        <Calendar size={12} className="mr-1" /> {new Date(r.date).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${r.type.includes("OCR") ? "bg-purple-50 text-[#734A97]" : "bg-blue-50 text-blue-600"
                        }`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="p-5">
                      <p className="text-sm text-gray-600 truncate max-w-[200px] italic">
                        "{r.text}"
                      </p>
                    </td>
                    <td className="p-5">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => setSelected(r)}
                          className="p-2 text-gray-400 hover:text-[#734A97] hover:bg-purple-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => toggleFlag(r._id)}
                          disabled={toggleMutation.isPending}
                          className={`p-2 rounded-lg transition-all ${r.flagged ? "text-rose-500 bg-rose-50" : "text-gray-400 hover:text-amber-500 hover:bg-amber-50"
                            } ${toggleMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={r.flagged ? "Unflag" : "Flag Suspicious"}
                        >
                          <Flag size={18} fill={r.flagged ? "currentColor" : "none"} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                rows.map((p: any) => (
                  <tr key={p._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-500 group-hover:bg-purple-50 group-hover:text-[#734A97] transition-all">
                          <User size={14} />
                        </div>
                        <span className="font-bold text-gray-700 text-sm">PAT-{p._id.toString().slice(-4).toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="font-bold text-gray-800 text-sm">{p.fullName}</p>
                      <p className="text-xs text-gray-400 mt-1">{p.email}</p>
                    </td>
                    <td className="p-5">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600">
                        {p.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-5">
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">
                        {p.mobileNumber || 'No phone'}
                      </p>
                    </td>
                    <td className="p-5 text-center">
                      <button
                        onClick={() => setQrModalUser(p)}
                        className="px-4 py-2 bg-purple-50 text-[#734A97] rounded-lg text-xs font-bold hover:bg-purple-100 transition-all flex items-center justify-center gap-2 mx-auto"
                      >
                        <QrCode size={14} />
                        View QR
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {!isLoading && rows.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-700">{((meta.page - 1) * limit) + 1}</span> to{" "}
            <span className="font-semibold text-gray-700">
              {Math.min(meta.page * limit, meta.total)}
            </span>{" "}
            of <span className="font-semibold text-gray-700">{meta.total}</span> results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${page === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                .filter(p => {
                  // Show first page, last page, current page, and 1 page on each side
                  return p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1;
                })
                .map((p, idx, arr) => {
                  // Add ellipsis if there's a gap
                  const prevPage = arr[idx - 1];
                  const showEllipsis = prevPage && p - prevPage > 1;
                  return (
                    <div key={p} className="flex items-center gap-1">
                      {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-10 h-10 rounded-lg font-medium transition-all ${p === page
                          ? "bg-[#734A97] text-white shadow-md"
                          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                      >
                        {p}
                      </button>
                    </div>
                  );
                })}
            </div>
            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${page >= meta.totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal - Improved UI for Review Extraction */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`Review Extraction: ${selected?.scanningId || (selected?._id ? `OCR-${selected._id.toString().slice(-4).toUpperCase()}` : '')}`}
      >
        {selected && (
          <div className="p-2 -mt-4 space-y-6 max-w-2xl mx-auto">
            {/* Header Identity Section */}
            <div className="relative overflow-hidden p-5 bg-gradient-to-br from-[#734A97] to-[#5d3a79] rounded-2xl shadow-lg border border-purple-200/20">
              <div className="relative z-10 flex items-center gap-5">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-inner">
                  {selected.type.includes("OCR") ? <FileText size={28} /> : <CheckCircle size={28} />}
                </div>
                <div>
                  <h3 className="font-aeonik font-bold text-xl text-white tracking-tight">{selected.user}</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="px-3 py-0.5 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-full border border-white/10">
                      {selected.type}
                    </span>
                    <span className={`px-3 py-0.5 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider rounded-full border ${selected.flagged
                      ? "bg-rose-500/20 text-rose-200 border-rose-500/20"
                      : "bg-emerald-500/20 text-emerald-200 border-emerald-500/20"
                      }`}>
                      {selected.flagged ? "Flagged" : "Verified"}
                    </span>
                  </div>
                </div>
              </div>
              {/* Background Accent */}
              <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-500"></div>
            </div>

            <div className="space-y-6">
              {/* Prescription Image Display */}
              {selected.fileUrl && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-[2px]">Original Document</h4>
                  </div>
                  <div className="relative group overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-gray-50 aspect-video md:aspect-auto max-h-[300px] flex items-center justify-center">
                    <img
                      src={`${import.meta.env.VITE_IMAGE_URL}${selected.fileUrl}`}
                      alt="Prescription"
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Prescription+Image+Not+Found";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none"></div>
                    <a
                      href={`${import.meta.env.VITE_IMAGE_URL}${selected.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-4 right-4 p-2.5 bg-white/90 backdrop-blur-md rounded-xl text-gray-700 shadow-lg border border-white opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 hover:bg-white"
                      title="Open in new tab"
                    >
                      <Eye size={18} />
                    </a>
                  </div>
                </div>
              )}

              {/* Structured AI Data (If available) */}
              {selected.extractedData && Object.keys(selected.extractedData).length > 0 ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-[2px]">Structured Analysis</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selected.extractedData.diagnosis && (
                      <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl group hover:shadow-md transition-all duration-300">
                        <p className="text-[10px] text-rose-400 font-bold uppercase tracking-[1.5px] mb-2 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span> Diagnosis
                        </p>
                        <p className="text-sm font-bold text-gray-800 leading-snug">{selected.extractedData.diagnosis}</p>
                      </div>
                    )}

                    {selected.extractedData.medications && selected.extractedData.medications.length > 0 && (
                      <div className="p-4 bg-[#734A97]/5 border border-[#734A97]/10 rounded-2xl md:col-span-2 group hover:shadow-md transition-all duration-300">
                        <p className="text-[10px] text-[#734A97] font-bold uppercase tracking-[1.5px] mb-3 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-[#734A97] rounded-full"></span> Medications & Dosages
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selected.extractedData.medications.map((m: string, idx: number) => (
                            <div key={idx} className="bg-white/60 p-2.5 rounded-xl border border-purple-100/50 flex items-start gap-2.5 shadow-sm group-hover:bg-white transition-colors duration-300">
                              <span className="flex-shrink-0 w-5 h-5 bg-purple-100 text-[#734A97] rounded-lg flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                              <span className="text-[13px] font-medium text-gray-700 leading-tight">{m}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selected.extractedData.labResults && (
                      <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl md:col-span-2 group hover:shadow-md transition-all duration-300">
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[1.5px] mb-2 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span> Lab Results / Observations
                        </p>
                        <p className="text-[13px] font-medium text-gray-700 leading-relaxed italic border-l-2 border-blue-200 pl-3">
                          {selected.extractedData.labResults}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Auto-Parsed AI Content (Dynamic Sections) */
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-[2px]">AI Transcription Report</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    {parseOcrText(selected.text).map((section, idx) => (
                      <div key={idx} className="relative group">
                        <div className="absolute inset-x-0 bottom-0 top-0 bg-gray-50/50 rounded-2xl border border-gray-100 -z-10 group-hover:bg-white group-hover:shadow-lg group-hover:border-purple-100 transition-all duration-300"></div>
                        <div className="p-5">
                          <div className="flex items-center gap-3 mb-3">
                            <h5 className="text-xs font-black text-purple-800 uppercase tracking-widest bg-purple-100/50 px-3 py-1.5 rounded-lg border border-purple-200/30">
                              {section.title}
                            </h5>
                            <div className="h-px bg-gradient-to-r from-purple-100 to-transparent flex-1"></div>
                          </div>
                          <div className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line prose-sm font-medium">
                            {section.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 p-4 rounded-3xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-3 bg-gray-50 border-r border-gray-100 flex items-center justify-center text-gray-400">
                      <Languages size={14} />
                    </div>
                    <select
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      className="px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="th">Thai</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="ar">Arabic</option>
                      <option value="ja">Japanese</option>
                    </select>
                  </div>

                  <button
                    onClick={handleTranslate}
                    disabled={isTranslating || !selected.text}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#734A97] text-white rounded-xl text-xs font-bold hover:bg-[#5d3a79] disabled:opacity-50 transition-all shadow-md shadow-purple-100"
                  >
                    {isTranslating ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <Languages size={14} />
                    )}
                    <span>{isTranslating ? "Processing..." : "Translate Report"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-white/60 border border-gray-100 rounded-xl text-[11px]">
                  <Calendar size={12} className="text-gray-400" />
                  <span className="text-gray-400 font-bold uppercase tracking-widest">{new Date(selected.date).toLocaleDateString()}</span>
                  <span className="text-gray-200">|</span>
                  <span className="text-gray-600 font-bold">{new Date(selected.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Translated Result Section (Floating Style) */}
              {translatedText && (
                <div className="animate-in zoom-in-95 fade-in duration-500">
                  <div className="bg-blue-600 p-6 rounded-[2rem] text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Languages size={20} className="text-blue-200 shadow-sm" />
                          <h6 className="text-[11px] font-black uppercase tracking-[2.5px] text-blue-100">Translation result</h6>
                        </div>
                        {detectedLanguage && (
                          <span className="px-2.5 py-1 bg-white/20 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10">
                            {detectedLanguage} → {targetLanguage}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-aeonik font-medium leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                        {translatedText}
                      </div>
                    </div>
                    {/* Decorative Elements */}
                    <div className="absolute top-[-50px] left-[-30px] w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[-20px] right-[-20px] w-32 h-32 bg-blue-400/20 rounded-full blur-2xl"></div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => toggleFlag(selected._id)}
                  disabled={toggleMutation.isPending}
                  className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2.5 border-2 shadow-sm ${selected.flagged
                    ? "bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200"
                    : "bg-white text-amber-600 border-amber-100 hover:bg-amber-50 hover:border-amber-200"
                    } ${toggleMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Flag size={18} fill={selected.flagged ? "currentColor" : "none"} />
                  {selected.flagged ? "Restore / Unflag" : "Mark as Suspicious"}
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="flex-[0.6] py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* QR Code Modal */}
      <Modal
        open={!!qrModalUser}
        onClose={() => setQrModalUser(null)}
        title="Patient Registration QR Code"
      >
        {qrModalUser && (
          <div className="flex flex-col items-center p-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">{qrModalUser.fullName}</h3>
              <p className="text-gray-500 text-sm">{qrModalUser.email}</p>
            </div>

            <div className="p-6 bg-white border-2 border-dashed border-purple-200 rounded-3xl mb-8">
              {qrModalUser.qrCode ? (
                <img
                  src={qrModalUser.qrCode}
                  alt="Patient QR Code"
                  className="w-64 h-64 object-contain"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-gray-50 rounded-2xl text-gray-400 italic text-sm text-center p-4">
                  QR Code not generated yet. It will be generated when the patient logs in or is viewed.
                </div>
              )}
            </div>

            <div className="w-full space-y-3">
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-[10px] text-[#734A97] font-bold uppercase tracking-widest mb-1">Upload URL</p>
                <p className="text-xs text-gray-600 font-mono break-all">{qrModalUser.qrUrl || 'No URL generated'}</p>
              </div>
              <button
                onClick={() => setQrModalUser(null)}
                className="w-full py-4 bg-[#734A97] text-white rounded-xl font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}