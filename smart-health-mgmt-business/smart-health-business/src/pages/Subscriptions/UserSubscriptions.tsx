"use client";

import React from 'react';
import {
    Search,
    Filter,
    MoreHorizontal,
    ExternalLink,
    User,
    Calendar,
    ArrowUpRight
} from 'lucide-react';

const UserSubscriptions: React.FC = () => {
    const subscriptions = [
        { id: 1, user: "City Hospital", tier: "Premium", status: "Active", date: "12 Oct 2023", amount: "$199/mo" },
        { id: 2, user: "Dental Care Plus", tier: "Standard", status: "Active", date: "05 Nov 2023", amount: "$99/mo" },
        { id: 3, user: "Sunrise Clinic", tier: "Standard", status: "Expired", date: "20 Dec 2023", amount: "$99/mo" },
        { id: 4, user: "Metro Health", tier: "Free", status: "Active", date: "15 Jan 2024", amount: "$0/mo" },
    ];

    return (
        <div className="max-w-[1600px] mx-auto font-['AeonikRegular']">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="headings-web-h4-headline text-slate-900">Subscription Plans</h1>
                    <p className="body-text-body-2 text-slate-500 mt-1">Manage user access tiers and billing cycles</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    { label: "Active Revenue", value: "$12,450", trend: "+8.2%", color: "text-[#9146C1]" },
                    { label: "Total Subscribers", value: "1,248", trend: "+12.5%", color: "text-indigo-600" },
                    { label: "Churn Rate", value: "2.1%", trend: "-0.5%", color: "text-rose-600" },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)]">
                        <p className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <div className="flex items-end justify-between">
                            <h3 className="headings-web-h5-headline text-slate-900">{stat.value}</h3>
                            <span className={`text-[10px] font-['AeonikBold'] flex items-center gap-1 ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                                <ArrowUpRight size={14} className={stat.trend.startsWith('-') ? 'rotate-90' : ''} />
                                {stat.trend}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <div className="relative w-72 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#9146C1] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search subscribers..."
                            className="form-control pl-12 h-11"
                        />
                    </div>
                    <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-all border-none cursor-pointer">
                        <Filter size={20} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Subscriber</th>
                                <th className="px-6 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Access Tier</th>
                                <th className="px-6 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Protocol Date</th>
                                <th className="px-6 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Monthly Amount</th>
                                <th className="px-6 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {subscriptions.map((sub) => (
                                <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors text-[13px]">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                                <User size={16} />
                                            </div>
                                            <span className="font-['AeonikBold'] text-slate-900">{sub.user}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-['AeonikBold'] uppercase tracking-wider ${sub.tier === 'Premium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
                                            }`}>{sub.tier}</span>
                                    </td>
                                    <td className="px-6 py-5 font-['AeonikMedium'] text-slate-400">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} />
                                            {sub.date}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 font-['AeonikBold'] text-slate-900">{sub.amount}</td>
                                    <td className="px-6 py-5">
                                        <div className="flex justify-center text-[10px]">
                                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-['AeonikBold'] uppercase tracking-wider ${sub.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${sub.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                {sub.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 text-slate-400">
                                            <button className="p-2 hover:text-[#9146C1] transition-all border-none bg-transparent cursor-pointer"><ExternalLink size={18} /></button>
                                            <button className="p-2 hover:text-slate-600 transition-all border-none bg-transparent cursor-pointer"><MoreHorizontal size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserSubscriptions;
