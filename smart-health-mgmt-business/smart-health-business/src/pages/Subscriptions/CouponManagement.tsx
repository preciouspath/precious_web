"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
    Ticket,
    Plus,
    Trash2,
    Copy,
    Calendar,
    Download
} from 'lucide-react';

const CouponManagement: React.FC = () => {
    const coupons = [
        { id: 1, code: "WELCOME50", discount: "50% OFF", type: "Percentage", validity: "31 Mar 2024", used: 145, limit: 500, status: "Active" },
        { id: 2, code: "HEALTHY20", discount: "20% OFF", type: "Percentage", validity: "28 Feb 2024", used: 82, limit: 200, status: "Active" },
        { id: 3, code: "NEWYEAR30", discount: "$30 OFF", type: "Fixed", validity: "15 Jan 2024", used: 200, limit: 200, status: "Expired" },
    ];

    return (
        <div className="max-w-[1600px] mx-auto font-['AeonikRegular']">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="headings-web-h4-headline text-slate-900">Coupon Codes</h1>
                    <p className="body-text-body-2 text-slate-500 mt-1">Generate and manage promotional codes for businesses</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-6 py-3 bg-white border border-slate-100 rounded-lg text-[10px] font-['AeonikBold'] uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-[0px_1px_3px_rgba(0,0,0,0.1)] border-none cursor-pointer flex items-center gap-2">
                        <Download size={16} /> Export
                    </button>
                    <button className="btn-medical flex items-center gap-2">
                        <Plus size={16} /> Create Coupon
                    </button>
                </div>
            </div>

            {/* Coupons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map((coupon, idx) => (
                    <motion.div
                        key={coupon.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] overflow-hidden group"
                    >
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-4 bg-purple-50 text-[#9146C1] rounded-lg">
                                    <Ticket size={24} />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-['AeonikBold'] uppercase tracking-widest ${coupon.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'
                                    }`}>{coupon.status}</span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest mb-1">Coupon Code</p>
                                    <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-lg border border-dashed border-slate-200">
                                        <span className="font-mono font-bold text-slate-900 tracking-wider transition-colors">{coupon.code}</span>
                                        <button className="text-slate-400 hover:text-[#9146C1] transition-all border-none bg-transparent cursor-pointer"><Copy size={16} /></button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest mb-1">Discount</p>
                                        <p className="text-lg font-['AeonikBold'] text-slate-900">{coupon.discount}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest mb-1">Valid Until</p>
                                        <p className="text-sm font-['AeonikMedium'] text-slate-600 flex items-center gap-1.5"><Calendar size={14} /> {coupon.validity}</p>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest mb-2">
                                        <span>Usage Limit</span>
                                        <span>{coupon.used} / {coupon.limit}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#9146C1] rounded-full transition-all"
                                            style={{ width: `${(coupon.used / coupon.limit) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-8 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="text-[10px] font-['AeonikBold'] text-slate-400 hover:text-slate-600 uppercase tracking-widest border-none bg-transparent cursor-pointer">Edit</button>
                            <button className="text-[10px] font-['AeonikBold'] text-rose-500 hover:underline uppercase tracking-widest border-none bg-transparent cursor-pointer flex items-center gap-1.5">
                                <Trash2 size={12} /> Delete
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default CouponManagement;
