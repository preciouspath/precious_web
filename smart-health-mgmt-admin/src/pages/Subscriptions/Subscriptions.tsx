"use client";

import { useState, useEffect } from "react";
import { FileDown, Search, CreditCard, UserCog, Calendar, ShieldCheck, RefreshCcw, ChevronRight, Pencil } from "lucide-react";
import Modal from "../../components/common/Modal";
import { getSubscriptions, updateSubscription, resendConfirmation, createSubscription, exportSubscriptions } from "../../api/subscriptionApi";
import { getPatients } from "../../api/authApi";
import { toast } from "react-toastify";
import Pagination from "../../components/common/Pagination";

export default function Subscriptions() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [newSub, setNewSub] = useState({ planType: 'Premium', paymentStatus: 'Paid', autoRenew: false, days: '' });
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeSubscriberIds, setActiveSubscriberIds] = useState<Set<string>>(new Set());
  const [confirmResendId, setConfirmResendId] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await getSubscriptions({ search, page, limit });
      setRows(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (error) {
      toast.error("Failed to fetch subscriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubscriptions();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, page]);

  useEffect(() => {
    if (openAddModal) {
      fetchAllPatients();
      fetchActiveSubscriptions();
    }
  }, [openAddModal]);

  useEffect(() => {
    if (newSub.planType === 'Free') {
      setNewSub(prev => ({
        ...prev,
        paymentStatus: 'Paid',
        autoRenew: false
      }));
    }
  }, [newSub.planType]);

  const fetchActiveSubscriptions = async () => {
    try {
      // Fetch all active subscriptions to filter out users who already have a plan
      const res = await getSubscriptions({ status: 'Active', limit: 10000 });
      if (res.data && Array.isArray(res.data)) {
        const ids = new Set(res.data.map((sub: any) => sub.userId?._id).filter(Boolean));
        setActiveSubscriberIds(ids as Set<string>);
      }
    } catch (error) {
      console.error("Failed to fetch active subscriptions for filtering", error);
    }
  };

  const fetchAllPatients = async () => {
    try {
      setIsUsersLoading(true);
      const res = await getPatients({ page: 1, limit: 100, search: "" });
      setUsers(res.data);
    } catch (error) {
      toast.error("Failed to load patients");
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleUpdate = async (id: string, data: any) => {
    try {
      setIsUpdating(true);
      await updateSubscription(id, data);
      toast.success("Subscription updated successfully");
      fetchSubscriptions();
      setSelected(null);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update subscription");
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmResend = async () => {
    if (!confirmResendId) return;
    try {
      await resendConfirmation(confirmResendId);
      toast.success("Confirmation email resent");
      setConfirmResendId(null);
    } catch (error) {
      toast.error("Failed to resend confirmation");
    }
  };

  const handleAddSub = async () => {
    if (!selectedUser) {
      // toast.error("Please select a patient target account");
      toast.error("Please select a patient");
      return;
    }
    if (!newSub.days || parseInt(newSub.days) <= 0) {
      toast.error("Please enter a valid Plan Duration (Days)");
      return;
    }
    try {
      await createSubscription({ userId: selectedUser._id, ...newSub });
      toast.success("Subscription added successfully");
      setOpenAddModal(false);
      setSelectedUser(null);
      fetchSubscriptions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add subscription");
    }
  };

  const filteredUsers = users.filter(u =>
    (u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())) &&
    !activeSubscriberIds.has(u._id)
  );

  const handleExport = async () => {
    const toastId = toast.loading("Preparing CSV...");
    try {
      await exportSubscriptions();
      toast.update(toastId, { render: "CSV Exported successfully", type: "success", isLoading: false, autoClose: 3000 });
    } catch (error) {
      toast.update(toastId, { render: "Failed to export subscriptions", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 via-purple-50/20 to-slate-50 min-h-screen font-aeonik">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Subscription Management
          </h1>
          <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-2">
            <CreditCard size={14} className="text-purple-400" />
            Monitor user plans, recurring payments, and billing cycles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpenAddModal(true)}
            className="flex items-center bg-gradient-to-r from-[#734A97] to-[#9146C1] text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-wide shadow-2xl shadow-purple-200 hover:shadow-purple-300 hover:scale-105 transition-all duration-300"
          >
            + Add Subscription
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
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="bg-white border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3.5 w-full text-sm font-medium focus:ring-2 focus:ring-purple-200 focus:border-purple-300 outline-none transition-all shadow-sm hover:border-purple-200"
        />
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 via-purple-50/30 to-slate-50 border-b border-gray-100">
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Subscriber</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Plan Details</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Expiry</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Billing</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-500 font-medium tracking-wide">Loading subscriptions...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-500 font-medium italic">No subscriptions found</td>
                </tr>
              ) : rows.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#734A97] shadow-inner">
                        <UserCog size={20} />
                      </div>
                      <div>
                        <p className="font-black text-gray-800 text-sm tracking-tight">{r.userId?.fullName || 'N/A'}</p>
                        <p className="text-[11px] text-gray-400 font-medium">{r.userId?.email || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-1.5 text-center sm:text-left">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm border ${r.planType === "Premium" ? "bg-purple-100 text-[#734A97] border-purple-200" : "bg-gray-50 text-gray-500 border-gray-200"
                          }`}>
                          {r.planType} Plan
                        </span>
                        <div className={`w-1.5 h-1.5 rounded-full ${r.status === "Active" ? "bg-emerald-400" : "bg-rose-400"} animate-pulse`} />
                      </div>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.1em] ml-1">Member Since: {r.startDate ? new Date(r.startDate).toLocaleDateString() : '-'}</p>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 border border-slate-100">
                        <Calendar size={14} />
                      </div>
                      <span className={`text-sm font-bold tracking-tight ${r.expiryDate ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                        {r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : 'Never Expires'}
                      </span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md w-fit border ${r.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-500 border-amber-100"}`}>
                        {r.paymentStatus}
                      </span>
                      <div className={`flex items-center gap-2 px-2 py-0.5 rounded-md w-fit ${r.autoRenew ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-gray-50 text-gray-400 border border-transparent'}`}>
                        <RefreshCcw size={10} className={r.autoRenew ? 'animate-spin-slow' : ''} />
                        <span className="text-[9px] font-black uppercase tracking-tight">Auto: {r.autoRenew ? "Enabled" : "Off"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={() => setSelected(r)}
                        className="p-2.5 text-gray-400 hover:text-[#734A97] hover:bg-purple-50 rounded-xl transition-all border-none cursor-pointer"
                        title="View & Edit"
                      >
                        <Pencil size={18} />
                      </button>
                      {r.paymentStatus !== "Paid" && r.planType !== "Free" && (
                        <button
                          onClick={() => setConfirmResendId(r._id)}
                          className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border-none cursor-pointer"
                          title="Resend Invoice"
                        >
                          <RefreshCcw size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-8 flex justify-center">
        <Pagination 
          page={page} 
          totalPages={totalPages} 
          onPageChange={setPage} 
        />
      </div>

      {/* Add Subscription Modal */}
      <Modal open={openAddModal} onClose={() => setOpenAddModal(false)} title="Enroll New Subscriber">
        <div className="p-2 space-y-6">
          <div className="bg-gradient-to-br from-[#734A97] to-[#5a3a78] rounded-3xl p-6 text-white flex items-center gap-5 shadow-xl shadow-purple-200/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
              <CreditCard size={100} />
            </div>
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md border border-white/10 shadow-inner relative z-10">
              <CreditCard size={28} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-purple-200 uppercase tracking-[2px] mb-1">New Enrollment</p>
              <h3 className="text-xl font-bold leading-tight tracking-tight">Setup Subscriptions</h3>
            </div>
          </div>

          <div className="space-y-4">
            {/* Refined Patient Selection (Searchable Dropdown) */}
            <div className="relative">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block ml-1">Target Account</label>
              <div
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className={`flex items-center justify-between w-full bg-white border-2 border-gray-100 rounded-2xl px-5 py-3.5 cursor-pointer transition-all ${showUserDropdown ? 'ring-4 ring-purple-100 border-[#734A97]/40 shadow-lg' : 'hover:border-purple-200'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl transition-colors ${selectedUser ? "bg-purple-100 text-[#734A97]" : "bg-white text-gray-300"}`}>
                    <UserCog size={20} />
                  </div>
                  {selectedUser ? (
                    <div>
                      <p className="text-[14px] font-black text-gray-800 leading-none tracking-tight">{selectedUser.fullName}</p>
                      <p className="text-[11px] text-gray-400 mt-1 font-medium">{selectedUser.email}</p>
                    </div>
                  ) : (
                    <span className="text-[14px] text-gray-400 font-bold tracking-tight">Search for a patient...</span>
                  )}
                </div>
                <ChevronRight size={20} className={`text-gray-300 transition-transform duration-300 ${showUserDropdown ? 'rotate-90 text-[#734A97]' : ''}`} />
              </div>

              {showUserDropdown && (
                <div className="absolute top-[105%] left-0 right-0 bg-white border border-gray-100 rounded-[30px] shadow-[0_30px_60px_rgba(0,0,0,0.12)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300 backdrop-blur-md">
                  <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#734A97] transition-colors" size={16} />
                      <input
                        type="text"
                        placeholder="Type name or email address..."
                        autoFocus
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full bg-white border-2 border-transparent rounded-xl pl-12 pr-4 py-3 text-sm font-bold focus:border-purple-200 focus:ring-0 outline-none transition-all shadow-inner"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="max-h-[250px] overflow-y-auto scrollbar-hide py-2 px-2">
                    {isUsersLoading ? (
                      <div className="p-10 text-center">
                        <div className="w-8 h-8 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Querying Records...</p>
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="p-10 text-center">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-100">
                          <Search size={24} className="text-gray-200" />
                        </div>
                        <p className="text-[13px] text-gray-400 font-bold tracking-tight">No match found for "{userSearch}"</p>
                      </div>
                    ) : filteredUsers.map(u => (
                      <div
                        key={u._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(u);
                          setShowUserDropdown(false);
                          setUserSearch("");
                        }}
                        className={`px-4 py-3.5 mx-1 rounded-2xl hover:bg-purple-50 flex items-center justify-between cursor-pointer transition-all group ${selectedUser?._id === u._id ? 'bg-purple-100/30' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-colors ${selectedUser?._id === u._id ? 'bg-[#734A97] text-white shadow-lg shadow-purple-200' : 'bg-gray-50 text-gray-400 group-hover:bg-purple-200 group-hover:text-[#734A97]'}`}>
                            {u.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-gray-800 group-hover:text-[#734A97] tracking-tight">{u.fullName}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">{u.email}</p>
                          </div>
                        </div>
                        {selectedUser?._id === u._id && <ShieldCheck size={18} className="text-[#734A97]" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Plan Tier</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-[#734A97] transition-colors">
                    <ShieldCheck size={18} />
                  </div>
                  <select
                    value={newSub.planType}
                    onChange={(e) => setNewSub({ ...newSub, planType: e.target.value })}
                    className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-12 pr-10 py-4 text-[14px] font-bold text-gray-700 outline-none focus:ring-4 focus:ring-purple-100 focus:border-[#734A97]/40 transition-all appearance-none cursor-pointer"
                  >
                    <option value="Free">Basic Access (Free)</option>
                    <option value="Premium">Full Premium Tier</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300 group-hover:text-[#734A97] transition-colors">
                    <ChevronRight size={18} className="rotate-90" />
                  </div>
                </div>
              </div>

              {newSub.planType !== 'Free' ? (
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Billing Status</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-[#734A97] transition-colors">
                      <CreditCard size={18} />
                    </div>
                    <select
                      value={newSub.paymentStatus}
                      onChange={(e) => setNewSub({ ...newSub, paymentStatus: e.target.value })}
                      className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-12 pr-10 py-4 text-[14px] font-bold text-gray-700 outline-none focus:ring-4 focus:ring-purple-100 focus:border-[#734A97]/40 transition-all appearance-none cursor-pointer"
                    >
                      <option value="Paid">Mark as Paid</option>
                      <option value="Pending">Payment Pending</option>
                      <option value="Unpaid">Unpaid / Arrears</option>
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300 group-hover:text-[#734A97] transition-colors">
                      <ChevronRight size={18} className="rotate-90" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 opacity-50 cursor-not-allowed">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Billing Status</label>
                  <div className="w-full bg-gray-100/50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-[14px] font-bold text-gray-400">
                    Not Applicable
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Plan Duration (Days)</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-[#734A97] transition-colors">
                    <Calendar size={18} />
                  </div>
                  <input
                    type="number"
                    value={newSub.days}
                    onChange={(e) => setNewSub({ ...newSub, days: e.target.value })}
                    placeholder="Enter days (e.g. 30)"
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl text-[14px] font-bold text-gray-700 outline-none focus:ring-4 focus:ring-purple-100 focus:border-[#734A97]/40 transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>

            {newSub.planType !== 'Free' && (
              <div
                onClick={() => setNewSub({ ...newSub, autoRenew: !newSub.autoRenew })}
                className={`flex items-center justify-between p-6 rounded-[24px] border-2 cursor-pointer transition-all duration-300 group ${newSub.autoRenew ? 'bg-purple-50/50 border-purple-200 shadow-xl shadow-purple-100/50' : 'bg-white border-gray-100 hover:border-purple-200 shadow-sm'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${newSub.autoRenew ? 'bg-[#734A97] text-white rotate-[360deg] shadow-lg shadow-purple-200' : 'bg-white border-2 border-gray-200 text-gray-300 group-hover:border-purple-200'}`}>
                    <RefreshCcw size={20} className={newSub.autoRenew ? 'animate-spin-slow' : ''} />
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[15px] font-bold tracking-tight ${newSub.autoRenew ? 'text-gray-900' : 'text-gray-500'}`}>Automatic Renewal</span>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Recurring charge upon expiration</p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-all duration-500 ${newSub.autoRenew ? 'bg-[#734A97]' : 'bg-gray-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-all duration-500 transform ${newSub.autoRenew ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleAddSub}
            className="w-full py-5 bg-gradient-to-r from-[#734A97] to-[#5a3a78] text-white rounded-[30px] font-black text-sm uppercase tracking-[3px] shadow-xl shadow-purple-200/50 hover:shadow-2xl hover:shadow-purple-300 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-4 group mt-2"
          >
            Issue Subscription Plan
            <CreditCard size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Manage Active Plan">
        {selected && (
          <div className="p-2 space-y-6">
            <div className="flex items-center gap-5 p-5 bg-gradient-to-br from-purple-50 to-white border-2 border-purple-100 rounded-3xl relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 p-3 opacity-5 text-[#734A97]">
                <UserCog size={80} />
              </div>
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#734A97] shadow-lg shadow-purple-100/50 border border-purple-50 relative z-10 font-black text-xl">
                {selected.userId?.fullName?.charAt(0) || '?'}
              </div>
              <div className="relative z-10">
                <h3 className="font-black text-lg text-[#734A97] leading-tight tracking-tight">{selected.userId?.fullName || 'N/A'}</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{selected.userId?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white border-2 border-slate-50 rounded-2xl shadow-sm">
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1.5">Selected Plan</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${selected.planType === 'Premium' ? 'bg-purple-500' : 'bg-gray-400'}`} />
                  <p className="font-black text-[15px] text-gray-800 tracking-tight">{selected.planType}</p>
                </div>
              </div>
              <div className="p-4 bg-white border-2 border-slate-50 rounded-2xl shadow-sm">
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1.5">Billing Status</p>
                <p className={`font-black text-[15px] tracking-tight ${selected.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-500'}`}>{selected.paymentStatus}</p>
              </div>
              <div className="p-4 bg-white border-2 border-slate-50 rounded-2xl shadow-sm">
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1.5">Auto-Renew</p>
                <div className="flex items-center gap-2">
                  {selected.autoRenew ? <RefreshCcw size={14} className="text-indigo-500 animate-spin-slow" /> : <RefreshCcw size={14} className="text-gray-300" />}
                  <p className="font-black text-[15px] text-gray-800 tracking-tight">{selected.autoRenew ? "Enabled" : "Disabled"}</p>
                </div>
              </div>
              <div className="p-4 bg-white border-2 border-slate-50 rounded-2xl shadow-sm">
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1.5">Expired On</p>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-300" />
                  <p className="font-black text-[15px] text-gray-800 tracking-tight">{selected.expiryDate ? new Date(selected.expiryDate).toLocaleDateString() : 'Lifetime'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="p-4 bg-white border-2 border-slate-50 rounded-2xl shadow-sm">
                <label className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1.5 block">Extend / Set Expiry (Days)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Days"
                    className="flex-1 px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-purple-100 focus:border-[#734A97]/40 transition-all shadow-inner"
                    onChange={(e) => (selected.days = e.target.value)}
                  />
                  <button
                    onClick={() => handleUpdate(selected._id, { days: selected.days })}
                    className="px-4 py-2 bg-[#734A97] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all"
                  >
                    Set
                  </button>
                </div>
              </div>
              {selected.planType !== 'Premium' && selected.status !== 'Cancelled' && (
                <button
                  disabled={isUpdating}
                  onClick={() => handleUpdate(selected._id, { planType: 'Premium', status: 'Active' })}
                  className="w-full flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-[25px] font-black text-sm uppercase tracking-[2px] shadow-2xl shadow-purple-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                  {isUpdating ? "Syncing..." : <><CreditCard size={20} /> Upgrade to Full Premium</>}
                </button>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selected.planType !== 'Free' && selected.status !== 'Cancelled' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => handleUpdate(selected._id, { planType: 'Free', status: 'Active' })}
                    className="py-4 border-2 border-slate-100 rounded-2xl font-black text-gray-500 hover:bg-slate-50 hover:border-slate-200 transition-all text-[11px] uppercase tracking-widest disabled:opacity-50">
                    {isUpdating ? "Wait..." : "Downgrade Plan"}
                  </button>
                )}

                {selected.status !== 'Cancelled' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => handleUpdate(selected._id, { status: 'Cancelled' })}
                    className={`py-4 bg-rose-50 text-rose-600 rounded-2xl font-black border-2 border-rose-100 hover:bg-rose-100 transition-all text-[11px] uppercase tracking-widest disabled:opacity-50 ${selected.planType === 'Free' ? 'col-span-2' : ''}`}>
                    {isUpdating ? "Wait..." : "Revoke Access"}
                  </button>
                )}

                {selected.status === 'Cancelled' && (
                  <div className="col-span-2 p-6 bg-rose-50 border-2 border-rose-100 rounded-[30px] text-center shadow-lg shadow-rose-100/50">
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck size={28} />
                    </div>
                    <p className="text-sm font-black text-rose-700 tracking-tight">Access Revoked / Expired Plan</p>
                    <button
                      disabled={isUpdating}
                      onClick={() => handleUpdate(selected._id, { status: 'Active' })}
                      className="mt-4 px-8 py-3 bg-white text-rose-600 border-2 border-rose-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">
                      {isUpdating ? "Syncing..." : "Reactivate Membership"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal for Resend */}
      <Modal open={!!confirmResendId} onClose={() => setConfirmResendId(null)} title="Resend Confirmation?">
        <div className="p-6 text-center space-y-6">
          <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-emerald-100">
            <RefreshCcw size={32} className="text-emerald-500" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 mb-2">Resend Payment Confirmation</h3>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
              This triggers a new email receipt to the user. Use this if they haven't received the original.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => setConfirmResendId(null)}
              className="py-4 border-2 border-slate-100 rounded-2xl font-black text-gray-500 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              onClick={confirmResend}
              className="py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-200 hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest"
            >
              Send Email
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}