"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Clock,
    Calendar,
    DollarSign,
    MapPin,
    CreditCard,
    CheckCircle2,
    X
} from 'lucide-react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdsV2 } from '../../api/authApi';
import Loader from '../../components/common/Loader';
import StepPayment from './CreateCampaign/StepPayment';

const PendingAds: React.FC = () => {
    const queryClient = useQueryClient();
    const [payingCampaign, setPayingCampaign] = useState<{ id: string, budget: number } | null>(null);

    const { data: adsData, isLoading } = useQuery({
        queryKey: ['pending-ads-v2'],
        queryFn: () => getAdsV2({ status: 'pending,draft' })
    });

    const pendingAds = adsData?.data?.data || [];

    return (
        <div className="max-w-[1600px] mx-auto font-['AeonikRegular'] relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="headings-web-h4-headline text-slate-900">Ads Pending Review</h1>
                    <p className="body-text-body-2 text-slate-500 mt-1">Review and authorize submitted advertisement requests</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-[#9146C1] rounded-lg text-[10px] font-['AeonikBold'] uppercase tracking-widest border border-purple-100">
                    <Clock size={16} /> {pendingAds.length} Pending Requests
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Campaign Name</th>
                                <th className="px-6 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Objective</th>
                                <th className="px-6 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Budget</th>
                                <th className="px-6 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Payment</th>
                                <th className="px-6 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Duration</th>
                                <th className="px-6 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Location</th>
                                <th className="px-6 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Submitted</th>
                                <th className="px-8 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr><td colSpan={8} className="text-center p-10"><Loader text="Loading pending ads..." /></td></tr>
                            ) : pendingAds.length === 0 ? (
                                <tr><td colSpan={8} className="text-center p-10 text-slate-500">No pending ads found.</td></tr>
                            ) : (
                                pendingAds && pendingAds?.map((ad: any) => {
                                    const locations = ad.adSets?.[0]?.targeting?.locations || [];
                                    const isPaid = ad.paymentStatus === 'paid';
                                    const isDraft = ad.status === 'draft';
                                    return (
                                        <motion.tr
                                            key={ad._id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-slate-50/50 transition-colors group text-[13px]"
                                        >
                                            <td className="px-8 py-5">
                                                <div>
                                                    <p className="font-['AeonikBold'] text-slate-900">{ad.name}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">ID: {ad._id.slice(-8)}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                                                    {ad.objective?.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-1.5 font-['AeonikBold'] text-slate-900">
                                                    <DollarSign size={14} className="text-[#9146C1]" />
                                                    ${ad.totalBudget?.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                {isPaid ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-['AeonikBold'] uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                        <CheckCircle2 size={12} /> Paid
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-col items-start gap-2">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-['AeonikBold'] uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100">
                                                            <CreditCard size={12} /> {isDraft ? 'Awaiting Payment' : 'Unpaid'}
                                                        </span>
                                                        {isDraft && (
                                                            <button 
                                                                onClick={() => setPayingCampaign({ id: ad._id, budget: ad.totalBudget })}
                                                                className="text-[10px] font-['AeonikBold'] uppercase tracking-widest text-white bg-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all shadow-md active:scale-95"
                                                            >
                                                                Pay Now
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-slate-600">
                                                <div className="flex items-center gap-1.5 font-['AeonikMedium']">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    {new Date(ad.startDate).toLocaleDateString()} - {new Date(ad.endDate).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-slate-600">
                                                <div className="flex items-center gap-1.5 font-['AeonikMedium']">
                                                    <MapPin size={14} className="text-slate-400" />
                                                    {locations.length > 0 ? (locations.length > 2 ? `${locations.slice(0, 2).map((l: any) => l.label).join(', ')} +${locations.length - 2}` : locations.map((l: any) => l.label).join(', ')) : 'All Locations'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 font-['AeonikMedium'] text-slate-400">
                                                {new Date(ad.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isDraft ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                            Draft
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                            <Clock size={12} className="mr-1" /> Pending Approval
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal */}
            {payingCampaign && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button 
                            onClick={() => setPayingCampaign(null)}
                            className="absolute top-6 right-6 w-10 h-10 bg-slate-50 hover:bg-slate-100 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:rotate-90 transition-all z-10 active:scale-95 border border-slate-100"
                        >
                            <X size={20} />
                        </button>
                        <div className="p-8 md:p-12">
                            <StepPayment 
                                campaignId={payingCampaign.id}
                                totalBudget={payingCampaign.budget}
                                onPaymentSuccess={() => {
                                    setPayingCampaign(null);
                                    queryClient.invalidateQueries({ queryKey: ['pending-ads-v2'] });
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingAds;
