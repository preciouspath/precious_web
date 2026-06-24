"use client";

import { useState, useEffect } from "react";
import { Plus, FileDown, TicketPercent, ToggleLeft, ToggleRight, Search, Tag } from "lucide-react";
import Modal from "../../components/common/Modal";
import { getCoupons, createCoupon, toggleCoupon, exportCoupons } from "../../api/couponApi";
import { toast } from "react-hot-toast";



export default function Coupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    discountPercentage: "",
    validFrom: "",
    validTo: "",
    usageLimit: ""
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await getCoupons({ search });
      setCoupons(res.data);
    } catch (error) {
      toast.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [search]);

  const handleToggle = async (id: string) => {
    try {
      await toggleCoupon(id);
      toast.success("Coupon status updated");
      fetchCoupons();
    } catch (error) {
      toast.error("Failed to update coupon status");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCoupon(formData);
      toast.success("Coupon created successfully");
      setOpenCreate(false);
      setFormData({
        code: "",
        discountPercentage: "",
        validFrom: "",
        validTo: "",
        usageLimit: ""
      });
      fetchCoupons();
    } catch (error) {
      toast.error("Failed to create coupon");
    }
  };

  const handleExport = async () => {
    try {
      await exportCoupons();
      toast.success("Coupon list exported");
    } catch (error) {
      toast.error("Failed to export coupons");
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 via-purple-50/20 to-slate-50 min-h-screen font-aeonik">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Coupons & Discounts
          </h1>
          <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-2">
            <TicketPercent size={14} className="text-purple-400" />
            Manage promotional codes and campaign offers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpenCreate(true)}
            className="flex items-center bg-gradient-to-r from-[#734A97] to-[#9146C1] text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-wide shadow-2xl shadow-purple-200 hover:shadow-purple-300 hover:scale-105 transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Coupon
          </button>
          <button
            onClick={handleExport}
            className="flex items-center bg-white border border-gray-200 text-gray-700 px-5 py-3 rounded-2xl text-sm font-bold hover:bg-gray-50 hover:border-purple-200 transition-all duration-300 shadow-sm"
          >
            <FileDown className="w-4 h-4 mr-2" /> Export CSV
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md mb-8 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#734A97] w-5 h-5 transition-all" />
        <input
          type="text"
          placeholder="Search by coupon code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3.5 w-full text-sm font-medium focus:ring-2 focus:ring-purple-200 focus:border-purple-300 outline-none transition-all shadow-sm hover:border-purple-200"
        />
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 via-purple-50/30 to-slate-50 border-b border-gray-100">
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Coupon Details</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Discount</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Validity Period</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Redemptions</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-500 font-medium">Loading coupons...</td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-500 font-medium italic">No coupons found</td>
                </tr>
              ) : coupons.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#734A97] shadow-inner">
                        <TicketPercent size={20} />
                      </div>
                      <span className="font-mono font-black text-[#734A97] text-sm tracking-wider bg-purple-50/50 px-3 py-1 rounded-lg border border-purple-100">{c.code}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-gray-800">{c.discountPercentage}%</span>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">OFF</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-1.5">
                      <p className="text-xs font-bold text-gray-700 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {new Date(c.validFrom).toLocaleDateString()}
                      </p>
                      <p className="text-[11px] text-gray-400 font-medium flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400" /> to {new Date(c.validTo).toLocaleDateString()}
                      </p>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col flex-1 max-w-[100px] gap-1">
                        <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase">
                          <span>Used</span>
                          <span>{Math.round((c.usedCount / (c.usageLimit || 1)) * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${Math.min(100, (c.usedCount / (c.usageLimit || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-black text-gray-700">{c.usedCount} / {c.usageLimit || '∞'}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleToggle(c._id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${c.active
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100"
                          : "bg-gray-50 text-gray-400 border border-gray-100 hover:bg-gray-100"
                          }`}
                      >
                        {c.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        {c.active ? "Active" : "Inactive"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Modal */}
      <Modal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        title="Create Campaign Coupon"
      >
        <form
          onSubmit={handleCreate}
          className="p-2 space-y-6"
        >
          <div className="bg-slate-900 rounded-2xl p-6 text-white flex items-center gap-5 shadow-2xl">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md">
              <Tag size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-[2px] mb-1">New Promotion</p>
              <h3 className="text-lg font-bold leading-tight">Generate Discount Codes</h3>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 block ml-1">Coupon Code</label>
              <input
                placeholder="e.g. SAVE30"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-black focus:ring-4 focus:ring-purple-100 focus:border-purple-200 outline-none transition-all placeholder:text-gray-300"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 block ml-1">Discount (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="20"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-black focus:ring-4 focus:ring-purple-100 focus:border-purple-200 outline-none transition-all"
                    required
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-black">%</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 block ml-1">Usage Limit</label>
                <input
                  type="number"
                  placeholder="500"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-black focus:ring-4 focus:ring-purple-100 focus:border-purple-200 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 block ml-1">Valid From</label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-black focus:ring-4 focus:ring-purple-100 focus:border-purple-200 outline-none transition-all text-gray-600"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 block ml-1">Valid To</label>
                <input
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-black focus:ring-4 focus:ring-purple-100 focus:border-purple-200 outline-none transition-all text-gray-600"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-[25px] font-black text-sm uppercase tracking-[2px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all mt-4"
          >
            Issue Coupon Code
          </button>
        </form>
      </Modal>
    </div>
  );
}