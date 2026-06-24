"use client";

import { useState } from "react";
import { CSVLink } from "react-csv";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { FileDown, Search, Eye, Calendar, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAds } from "../../api/authApi";
import Modal from "../../components/common/Modal";

const BRAND_PURPLE_MAIN = "#734A97";

export default function AdHistory() {
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Completed,Rejected");

  const { data: adsData, isLoading } = useQuery({
    queryKey: ["all-ads", search, statusFilter],
    queryFn: () => getAds({ search, status: statusFilter, page: 1, limit: 100 } as any),
  });

  const ads = adsData?.data || [];



  const csvData = ads.map((ad: any) => ({
    Title: ad.title,
    Owner: ad.ownerId?.ownerName,
    Business: ad.ownerId?.businessName,
    Start: new Date(ad.startDate).toLocaleDateString(),
    End: new Date(ad.endDate).toLocaleDateString(),
    Budget: ad.budget,
    Spent: ad.spentAmount,
    Reach: ad.reach,
    Status: ad.status
  }));


  const getChartData = (ad: any) => {
    if (!ad) return [];
    const points = 5;
    const data = [];
    const reachStep = (ad.reach || 0) / points;
    const budgetStep = (ad.spentAmount || 0) / points;

    for (let i = 0; i < points; i++) {
      data.push({
        date: `Week ${i + 1}`,
        reach: Math.round(reachStep * (i + 1)),
        budget: Math.round(budgetStep * (i + 1))
      });
    }
    return data;
  };

  const chartData = selected ? getChartData(selected) : [];

  return (
    <div className="p-8 bg-white min-h-screen font-aeonik">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ad History & Reports</h1>
          <p className="text-sm text-gray-500">Track campaign performance and financial data</p>
        </div>
        <div className="flex items-center gap-3">
          <CSVLink
            data={csvData}
            filename="ad_history.csv"
            className="flex items-center bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
          >
            <FileDown className="w-4 h-4 mr-2" /> Export CSV
          </CSVLink>
          {/* <button
            onClick={handlePdfExport}
            className="flex items-center text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-100 hover:opacity-90 transition-all"
            style={{ backgroundColor: BRAND_PURPLE_MAIN }}
          >
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </button> */}
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-50 border-none rounded-xl pl-11 pr-4 py-3 w-full text-sm focus:ring-2 focus:ring-purple-100 outline-none transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm text-gray-600 focus:ring-2 focus:ring-purple-100 outline-none transition-all min-w-[150px]"
        >
          <option value="Completed,Rejected">Past Campaigns (Default)</option>
          <option value="">All Campaigns</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="Rejected">Rejected</option>
          <option value="Pending">Pending</option>
          <option value="Paused">Paused</option>
          <option value="Stopped">Stopped</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table Container */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-fit">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Campaign</th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Duration</th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Budget</th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center p-10">Loading...</td></tr>
                ) : ads.length === 0 ? (
                  <tr><td colSpan={5} className="text-center p-10">No history found</td></tr>
                ) : (
                  ads.map((r: any) => (
                    <tr key={r._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-5">
                        <p className="font-bold text-gray-800 text-sm">{r.title}</p>
                        <p className="text-xs text-gray-400">{r.ownerId?.businessName || "Unknown"}</p>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center text-xs text-gray-600 gap-1 font-medium">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(r.startDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-5">
                        <p className="text-sm font-bold text-gray-700">₹{r.budget}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">
                          Reach: {(r.reach || 0).toLocaleString()}
                        </p>
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider ${r.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                          }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex justify-center">
                          <button
                            onClick={() => setSelected(r)}
                            className="p-2 text-gray-400 hover:text-[#734A97] hover:bg-purple-50 rounded-lg transition-all"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-purple-50 text-[#734A97] rounded-lg">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-bold text-gray-800">Performance</h3>
          </div>

          {selected ? (
            <div className="space-y-6">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Line type="monotone" dataKey="reach" stroke={BRAND_PURPLE_MAIN} strokeWidth={3} dot={{ r: 4, fill: BRAND_PURPLE_MAIN }} />
                    <Line type="monotone" dataKey="budget" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="pt-4 border-t border-gray-50 text-center">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Currently Viewing</p>
                <p className="text-sm font-bold text-gray-700 mt-1">{selected.title}</p>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                <TrendingUp size={24} />
              </div>
              <p className="text-sm text-gray-400 font-medium">Select a campaign row to<br />view visual analytics</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Campaign Details">
        <div className="p-2 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Owner</label>
              <p className="text-gray-800 font-bold">{selected?.ownerId?.businessName || selected?.ownerId?.ownerName}</p>
            </div>
            <div>
              <label className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Status</label>
              <p className="text-emerald-600 font-bold">{selected?.status}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <label className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Total Budget</label>
              <p className="text-xl font-bold text-gray-800">₹{selected?.budget}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <label className="text-[#734A97] font-bold text-[10px] uppercase tracking-wider">Amount Spent</label>
              <p className="text-xl font-bold text-[#734A97]">₹{selected?.spentAmount || 0}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium italic">Clicks</span>
              <span className="font-bold text-gray-800">{(selected?.clicks || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium italic">Reach</span>
              <span className="font-bold text-gray-800">{(selected?.reach || 0).toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={() => setSelected(null)}
            className="w-full bg-[#734A97] text-white py-4 rounded-xl font-bold shadow-lg shadow-purple-100 mt-4"
          >
            Close Report
          </button>
        </div>
      </Modal>
    </div>
  );
}