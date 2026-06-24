"use client";

import { useState } from "react";
import { Search, Check, X, Image as MapPin, FileText, CreditCard, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAds, updateAdStatus } from "../../api/authApi";
import { toast } from "react-toastify";
import Modal from "../../components/common/Modal";

export default function PendingAds() {
  const [search, setSearch] = useState("");
  const [openReject, setOpenReject] = useState(false);
  const [openApprove, setOpenApprove] = useState(false);
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const { data: adsData, isLoading } = useQuery({
    queryKey: ["pending-ads", search],
    queryFn: () => getAds({ status: "pending", search, page: 1, limit: 100 } as any),
  });

  const ads = adsData?.data || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      updateAdStatus(id, status, reason),
    onSuccess: () => {
      toast.success("Ad status updated!");
      setOpenReject(false);
      setOpenApprove(false);
      setReason("");
      setSelectedAd(null);
      queryClient.invalidateQueries({ queryKey: ["pending-ads"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update status");
    },
  });

  const handleApprove = (ad: any) => {
    setSelectedAd(ad);
    setOpenApprove(true);
  };

  const confirmApprove = () => {
    if (!selectedAd) return;
    updateStatusMutation.mutate({ id: selectedAd._id, status: "approved" });
  };

  const handleReject = () => {
    if (!selectedAd) return;
    updateStatusMutation.mutate({ id: selectedAd._id, status: "rejected", reason });
  };

  return (
    <div className="p-8 bg-white min-h-screen font-aeonik">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pending Campaign Approvals</h1>
          <p className="text-sm text-gray-500">Review and verify campaign content before going live</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search campaigns by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-50 border-none rounded-xl pl-11 pr-4 py-3 w-full text-sm focus:ring-2 focus:ring-purple-100 outline-none transition-all"
        />
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Campaign Details</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Objective</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Creative Preview</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Budget & Target</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Payment</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Duration</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center p-10">Loading...</td></tr>
              ) : ads.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-10 text-gray-400 italic">No pending campaigns found</td></tr>
              ) : (
                ads.map((ad: any) => {
                  const creative = ad.creatives?.[0] || ad.adSets?.[0]?.creatives?.[0]; 
                  const targeting = ad.adSets?.[0]?.targeting || {};
                  const locations = targeting.locations || [];
                  const ageRange = targeting.ageRange || { min: 18, max: 65 };
                  const genders = targeting.genders || ['all'];

                  return (
                    <tr key={ad._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-5">
                        <div className="flex flex-col">
                          <p className="font-bold text-gray-800 text-sm leading-tight">{ad.name}</p>
                          <p className="text-[10px] text-[#9146C1] font-bold uppercase tracking-widest mt-1 flex items-center bg-purple-50 w-fit px-2 py-0.5 rounded">
                            <FileText size={10} className="mr-1" /> {ad.ownerId?.businessName || "Unknown Owner"}
                          </p>
                          <p className="text-[9px] text-gray-400 mt-1">{ad.ownerId?.email}</p>
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-gray-100 text-gray-600 rounded-md border border-gray-200">
                          {ad.objective?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="relative w-24 h-14 rounded-lg overflow-hidden border border-gray-100 group-hover:border-purple-200 transition-all bg-gray-50 flex items-center justify-center">
                          {creative?.mediaUrl ? (
                            creative.mediaUrl.endsWith('.mp4') ? (
                              <video src={creative.mediaUrl.startsWith('http') ? creative.mediaUrl : `${import.meta.env.VITE_IMAGE_URL}${creative.mediaUrl}`} className="w-full h-full object-cover" />
                            ) : (
                              <img
                                src={creative.mediaUrl.startsWith('http') ? creative.mediaUrl : `${import.meta.env.VITE_IMAGE_URL}${creative.mediaUrl}`}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            )
                          ) : (
                            <FileText size={16} className="text-gray-300" />
                          )}
                        </div>
                        <p className="text-[9px] text-gray-400 mt-1 text-center font-medium">{creative?.type || 'image'}</p>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-bold text-gray-700">${ad.totalBudget?.toLocaleString()}</p>
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center">
                              <MapPin size={10} className="mr-1" /> {locations.length > 0 ? (locations.length > 2 ? `${locations.slice(0, 2).map((l:any) => l.label).join(', ')} +${locations.length - 2}` : locations.map((l:any) => l.label).join(', ')) : 'All Locations'}
                            </p>
                            <p className="text-[9px] text-gray-400 flex items-center gap-2">
                              <span>Age: {ageRange.min}-{ageRange.max}</span>
                              <span className="capitalize">Gender: {genders.join(', ')}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        {ad.paymentStatus === 'paid' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <CheckCircle size={12} /> Paid {ad.paidAmount ? `$${ad.paidAmount}` : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100">
                            <CreditCard size={12} /> Unpaid
                          </span>
                        )}
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col gap-1">
                          <p className="text-[11px] font-bold text-gray-600">Start: {new Date(ad.startDate).toLocaleDateString()}</p>
                          <p className="text-[11px] font-bold text-gray-600">End: {new Date(ad.endDate).toLocaleDateString()}</p>
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => handleApprove(ad)}
                            className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Approve"
                          >
                            <Check size={20} />
                          </button>
                          <button
                            onClick={() => { setSelectedAd(ad); setOpenReject(true); }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            title="Reject"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve Confirmation Modal */}
      <Modal open={openApprove} onClose={() => setOpenApprove(false)} title="Confirm Approval">
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Approve Campaign?</h3>
            {selectedAd && (
              <p className="text-sm text-gray-500 mt-2">
                Are you sure you want to approve <span className="font-bold text-gray-800">"{selectedAd.name}"</span>? This will make the campaign live.
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setOpenApprove(false)}
              className="flex-1 py-3 border border-gray-100 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={confirmApprove}
              disabled={updateStatusMutation.isPending}
              className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 disabled:opacity-50 transition-all"
            >
              {updateStatusMutation.isPending ? "Approving..." : "Yes, Approve"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal open={openReject} onClose={() => setOpenReject(false)} title="Reject Ad Campaign">
        <div className="space-y-4">
          {selectedAd && (
            <p className="text-sm text-gray-500 mt-1">Rejecting: <span className="font-bold">{selectedAd.name}</span></p>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-700 font-bold text-xs uppercase tracking-wider">Reason for Rejection</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Content violates policy, low quality image, etc."
              className="border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-[#734A97] transition-all min-h-[120px] text-sm resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setOpenReject(false)}
              className="flex-1 py-3 border border-gray-100 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={!reason.trim() || updateStatusMutation.isPending}
              className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-100 disabled:opacity-50 transition-all"
            >
              {updateStatusMutation.isPending ? "Rejecting..." : "Reject Ad"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Pagination Placeholder */}
      <div className="mt-8 flex justify-center">
        <p className="text-xs text-gray-400 italic font-medium uppercase tracking-widest">{adsData?.meta?.total ? `Showing ${ads.length} of ${adsData.meta.total}` : "End of pending list"}</p>
      </div>
    </div>
  );
}