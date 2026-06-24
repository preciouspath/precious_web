"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
    Search,
    Filter,
    MoreHorizontal,
    Plus,
    ExternalLink,
    User,
    Briefcase
} from 'lucide-react';

const BusinessProfiles: React.FC = () => {
    const profiles = [
        { id: 1, name: "City Hospital", owner: "Dr. Robert Smith", status: "Active", type: "Premium", since: "12 Oct 2023" },
        { id: 2, name: "Dental Care Plus", owner: "Dr. Emma Wilson", status: "Active", type: "Standard", since: "05 Nov 2023" },
        { id: 3, name: "Sunrise Clinic", owner: "Dr. James Bond", status: "Pending", type: "Standard", since: "20 Dec 2023" },
        { id: 4, name: "Metro Health", owner: "Dr. Sarah Lee", status: "Inactive", type: "Free", since: "15 Jan 2024" },
    ];

    return (
        <div className="max-w-[1600px] mx-auto font-['AeonikRegular']">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="headings-web-h4-headline text-slate-900">Business Profiles</h1>
                    <p className="body-text-body-2 text-slate-500 mt-1">Manage all registered businesses and their account types</p>
                </div>
                <button className="btn-medical flex items-center gap-2">
                    <Plus size={16} /> Add Profile
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#9146C1] transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Business Name or Owner..."
                        className="form-control !pl-14 h-11"
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-['AeonikBold'] text-slate-600 hover:bg-slate-100 transition-all border-none cursor-pointer">
                        <Filter size={16} /> Filters
                    </button>
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-['AeonikBold'] text-slate-600 hover:bg-slate-100 transition-all border-none cursor-pointer">
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Business Name</th>
                                <th className="px-6 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Owner Name</th>
                                <th className="px-6 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Since</th>
                                <th className="px-6 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Account Type</th>
                                <th className="px-6 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {profiles.map((profile) => (
                                <motion.tr
                                    key={profile.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-slate-50/50 transition-colors group text-[13px]"
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-[#9146C1]">
                                                <Briefcase size={20} />
                                            </div>
                                            <span className="font-['AeonikBold'] text-slate-900">{profile.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-slate-600">
                                        <div className="flex items-center gap-2 font-['AeonikMedium']">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                <User size={12} className="text-slate-400" />
                                            </div>
                                            {profile.owner}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 font-['AeonikMedium'] text-slate-400">{profile.since}</td>
                                    <td className="px-6 py-5">
                                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-['AeonikBold'] uppercase tracking-wider ${profile.type === 'Premium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
                                            }`}>
                                            {profile.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex justify-center text-[10px]">
                                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-['AeonikBold'] uppercase tracking-wider ${profile.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                                                profile.status === 'Pending' ? 'bg-purple-50 text-[#9146C1]' : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${profile.status === 'Active' ? 'bg-emerald-500' :
                                                    profile.status === 'Pending' ? 'bg-[#9146C1]' : 'bg-rose-500'
                                                    }`} />
                                                {profile.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2 text-slate-400 hover:text-[#9146C1] hover:bg-purple-50 rounded-lg transition-all border-none bg-transparent cursor-pointer">
                                                <ExternalLink size={18} />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all border-none bg-transparent cursor-pointer">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BusinessProfiles;
