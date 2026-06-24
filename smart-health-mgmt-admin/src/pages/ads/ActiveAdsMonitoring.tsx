"use client";

import { useState } from "react";
import {
  PauseCircle,
  StopCircle,
  PlayCircle,
  Calendar,
  Search,
  CreditCard,
  CheckCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAds, updateAdStatus, createAd, getBusinessOwners } from "../../api/authApi";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";
import Modal from "../../components/common/Modal";

const BRAND_PURPLE_MAIN = "#734A97";

export default function ActiveAdsMonitoring() {
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState<{ open: boolean; action?: string; id?: string }>({ open: false });
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: adsData, isLoading } = useQuery({
    queryKey: ["active-ads", search],
    queryFn: () => getAds({ status: "active,approved,paused", search, page: 1, limit: 100 } as any),
  });

  const { data: businessesData } = useQuery({
    queryKey: ["businesses-simple"],
    queryFn: () => getBusinessOwners({ page: 1, limit: 1000 }), // increased limit for dropdown
    enabled: openCreate, // only fetch when modal opens
  });

  const businesses = (businessesData as any)?.data || [];
  const ads = adsData?.data || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAdStatus(id, status),
    onSuccess: () => {
      toast.success("Ad status updated!");
      closeConfirm();
      queryClient.invalidateQueries({ queryKey: ["active-ads"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update status");
    },
  });

  const createAdMutation = useMutation({
    mutationFn: createAd,
    onSuccess: () => {
      toast.success("Campaign created successfully!");
      setOpenCreate(false);
      formik.resetForm();
      setSelectedImage(null);
      setImagePreview("");
      queryClient.invalidateQueries({ queryKey: ["active-ads"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create campaign");
    }
  });

  const openConfirm = (id: string, action: "pause" | "stop" | "resume") => setConfirm({ open: true, action, id });
  const closeConfirm = () => setConfirm({ open: false });

  const onConfirm = () => {
    if (!confirm.id || !confirm.action) return;
    let status = "Active";
    if (confirm.action === "pause") status = "Paused";
    if (confirm.action === "stop") status = "Completed"; // Map 'stop' to 'Completed' for history or specialized status if exist
    // 'resume' defaults to Active

    updateStatusMutation.mutate({ id: confirm.id, status });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const formik = useFormik({
    initialValues: {
      ownerId: "",
      title: "",
      description: "",
      targetLocation: "",
      budget: "",
      startDate: "",
      endDate: ""
    },
    validationSchema: Yup.object({
      ownerId: Yup.string().required("Business Owner is required"),
      title: Yup.string().required("Title is required"),
      description: Yup.string().required("Description is required"),
      targetLocation: Yup.string().required("Target Location is required"),
      budget: Yup.number().required("Budget is required").positive("Must be positive"),
      startDate: Yup.date().required("Start Date is required"),
      endDate: Yup.date().required("End Date is required").min(Yup.ref('startDate'), "End date can't be before start date")
    }),
    onSubmit: (values) => {
      // Validate that image is selected
      if (!selectedImage) {
        toast.error("Please select an image for the ad banner");
        return;
      }

      // Create FormData to send multipart/form-data
      const formData = new FormData();
      formData.append("ownerId", values.ownerId);
      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("targetLocation", values.targetLocation);
      formData.append("budget", values.budget);
      formData.append("startDate", values.startDate);
      formData.append("endDate", values.endDate);
      formData.append("image", selectedImage);

      createAdMutation.mutate(formData as any);
    }
  });

  return (
    <div className="p-8 bg-white min-h-screen font-aeonik">
      {/* Header */}
      <div className="flex flex-col md:flex-row md::items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Active Ad Campaigns</h1>
          <p className="text-sm text-gray-500">Monitor performance, reach, and real-time controls</p>
        </div>
        {/* <button
          onClick={() => setOpenCreate(true)}
          className="flex items-center text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-100 hover:opacity-90 transition-all"
          style={{ backgroundColor: BRAND_PURPLE_MAIN }}
        >
          <Plus className="w-4 h-4 mr-2" /> Create Campaign
        </button> */}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search by campaign title..."
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
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Campaign Info</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Reach Progress</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Budget Usage</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Payment</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center p-10">Loading...</td></tr>
              ) : ads.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-10">No active ads found</td></tr>
              ) : (
                ads.map((ad: any) => {
                  // V2 Fields
                  const totalBudget = ad.totalBudget || ad.budget || 5000;
                  const name = ad.name || ad.title || "Unnamed Campaign";
                  const reachPct = Math.min(100, Math.round(((ad.metrics?.uniqueReach || 0) / 10000) * 100));
                  const budgetPct = Math.min(100, Math.round(((ad.spentAmount || 0) / totalBudget) * 100));
                  const startDate = new Date(ad.startDate).toLocaleDateString();
                  const endDate = new Date(ad.endDate).toLocaleDateString();

                  return (
                    <tr key={ad._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-5">
                        <p className="font-bold text-gray-800 text-sm">{name}</p>
                        <p className="text-xs text-gray-400 flex items-center mt-1">
                          <Calendar size={12} className="mr-1" /> {startDate} — {endDate}
                        </p>
                        <p className="text-[10px] text-[#9146C1] font-bold uppercase mt-1 bg-purple-50 w-fit px-2 py-0.5 rounded">
                          {ad.ownerId?.businessName || "Unknown"}
                        </p>
                      </td>
                      <td className="p-5 min-w-[180px]">
                        <div className="flex flex-col gap-1.5">
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${reachPct}%`, backgroundColor: BRAND_PURPLE_MAIN }}
                            />
                          </div>
                          <p className="text-[11px] font-bold text-gray-600">
                            {(ad.metrics?.uniqueReach || 0).toLocaleString()} <span className="text-gray-400 font-medium">/ 10,000</span>
                          </p>
                        </div>
                      </td>
                      <td className="p-5 min-w-[180px]">
                        <div className="flex flex-col gap-1.5">
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${budgetPct}%` }}
                            />
                          </div>
                          <p className="text-[11px] font-bold text-gray-600">
                            ${(ad.spentAmount || 0).toLocaleString()} <span className="text-gray-400 font-medium">/ ${totalBudget.toLocaleString()}</span>
                          </p>
                        </div>
                      </td>
                      <td className="p-5">
                        {ad.paymentStatus === 'paid' ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                              <CheckCircle size={12} /> Paid
                            </span>
                            {ad.stripePaymentIntentId && (
                              <p className="text-[9px] text-gray-400 mt-1 font-mono">PI: ...{ad.stripePaymentIntentId.slice(-8)}</p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100">
                            <CreditCard size={12} /> Unpaid
                          </span>
                        )}
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider ${(ad.status === "active" || ad.status === "approved") ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                          }`}>
                          {ad.status}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex justify-center items-center gap-2">
                          {(ad.status === "active" || ad.status === "approved") ? (
                            <>
                              <button
                                onClick={() => openConfirm(ad._id, "pause")}
                                className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                title="Pause Campaign"
                              >
                                <PauseCircle size={20} />
                              </button>
                              <button
                                onClick={() => openConfirm(ad._id, "stop")}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                title="Stop Campaign"
                              >
                                <StopCircle size={20} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => openConfirm(ad._id, "resume")}
                              className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Resume Campaign"
                            >
                              <PlayCircle size={20} />
                            </button>
                          )}
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

      {/* Confirmation Modal */}
      <Modal
        open={confirm.open}
        onClose={closeConfirm}
      >
        <div className="p-8 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${confirm.action === "pause" ? "bg-amber-50 text-amber-500" :
            confirm.action === "resume" ? "bg-emerald-50 text-emerald-500" :
              "bg-rose-50 text-rose-500"
            }`}>
            {confirm.action === "pause" ? <PauseCircle size={32} /> : confirm.action === "resume" ? <PlayCircle size={32} /> : <StopCircle size={32} />}
          </div>

          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {confirm.action === "pause" ? "Pause Campaign?" : confirm.action === "resume" ? "Resume Campaign?" : "Stop Campaign?"}
          </h3>

          <p className="text-gray-500 text-sm mb-8 px-4">
            {confirm.action === "pause"
              ? "Pausing will temporarily stop delivery. You can resume it anytime from the dashboard."
              : confirm.action === "resume"
                ? "Resuming will make this campaign active and visible to users immediately."
                : "Stopping this ad will permanently end delivery and archive the stats. This cannot be undone."}
          </p>

          <div className="flex gap-3">
            <button
              onClick={closeConfirm}
              className="flex-1 py-3 border border-gray-100 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg transition-all ${confirm.action === "pause" ? "bg-amber-500 shadow-amber-100" :
                confirm.action === "resume" ? "bg-emerald-500 shadow-emerald-100" :
                  "bg-rose-500 shadow-rose-100"
                }`}
            >
              {updateStatusMutation.isPending ? "Updating..." : "Confirm"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Ad Modal */}
      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Create New Campaign">
        <form onSubmit={formik.handleSubmit} className="p-2 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Business Owner</label>
            <select
              name="ownerId"
              value={formik.values.ownerId}
              onChange={formik.handleChange}
              className="w-full bg-gray-50 border p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 outline-none"
            >
              <option value="">Select Business</option>
              {businesses.map((b: any) => (
                <option key={b._id} value={b._id}>{b.businessName} ({b.ownerName})</option>
              ))}
            </select>
            {formik.touched.ownerId && formik.errors.ownerId && <p className="text-red-500 text-[10px] mt-1">{formik.errors.ownerId}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Campaign Title</label>
              <input
                type="text"
                name="title"
                placeholder="e.g. Winter Sale"
                value={formik.values.title}
                onChange={formik.handleChange}
                className="w-full bg-gray-50 border p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 outline-none"
              />
              {formik.touched.title && formik.errors.title && <p className="text-red-500 text-[10px] mt-1">{formik.errors.title}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Total Budget ($)</label>
              <input
                type="number"
                name="budget"
                placeholder="e.g. 5000"
                value={formik.values.budget}
                onChange={formik.handleChange}
                className="w-full bg-gray-50 border p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 outline-none"
              />
              {formik.touched.budget && formik.errors.budget && <p className="text-red-500 text-[10px] mt-1">{formik.errors.budget}</p>}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
            <textarea
              name="description"
              placeholder="Describe the campaign..."
              value={formik.values.description}
              onChange={formik.handleChange}
              className="w-full bg-gray-50 border p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 outline-none h-20 resize-none"
            />
            {formik.touched.description && formik.errors.description && <p className="text-red-500 text-[10px] mt-1">{formik.errors.description}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Target Location</label>
            <input
              type="text"
              name="targetLocation"
              placeholder="e.g. Mumbai, Pune"
              value={formik.values.targetLocation}
              onChange={formik.handleChange}
              className="w-full bg-gray-50 border p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 outline-none"
            />
            {formik.touched.targetLocation && formik.errors.targetLocation && <p className="text-red-500 text-[10px] mt-1">{formik.errors.targetLocation}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Banner Image</label>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="file"
                  id="ad-image-upload"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="ad-image-upload"
                  className="flex items-center justify-center w-full bg-gray-50 border-2 border-dashed border-gray-200 p-4 rounded-xl hover:bg-gray-100 hover:border-purple-200 transition-all cursor-pointer"
                >
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-bold text-purple-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG up to 5MB</p>
                  </div>
                </label>
              </div>

              {selectedImage && (
                <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 p-3 rounded-xl">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{selectedImage.name}</p>
                    <p className="text-xs text-gray-500">{(selectedImage.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview("");
                    }}
                    className="flex-shrink-0 text-red-500 hover:text-red-600 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              )}

              {imagePreview && (
                <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">Preview</div>
                </div>
              )}
            </div>
            {!selectedImage && <p className="text-red-500 text-[10px] mt-1">Image is required</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formik.values.startDate}
                onChange={formik.handleChange}
                className="w-full bg-gray-50 border p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 outline-none"
              />
              {formik.touched.startDate && formik.errors.startDate && <p className="text-red-500 text-[10px] mt-1">{formik.errors.startDate}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">End Date</label>
              <input
                type="date"
                name="endDate"
                value={formik.values.endDate}
                onChange={formik.handleChange}
                className="w-full bg-gray-50 border p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 outline-none"
              />
              {formik.touched.endDate && formik.errors.endDate && <p className="text-red-500 text-[10px] mt-1">{formik.errors.endDate}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={createAdMutation.isPending}
            className="w-full bg-[#734A97] text-white py-4 rounded-xl font-bold shadow-lg shadow-purple-100 mt-4 disabled:opacity-50"
          >
            {createAdMutation.isPending ? "Creating Campaign..." : "Launch Campaign"}
          </button>
        </form>
      </Modal>

      <div className="mt-8 flex justify-center">
        <p className="text-xs text-gray-400 italic font-medium uppercase tracking-widest">Real-time data synchronization active</p>
      </div>
    </div>
  );
}