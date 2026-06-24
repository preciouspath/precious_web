"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Megaphone,
    Eye,
    MousePointer2,
    TrendingUp,
    Pause,
    Play,
    Trash2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdsV2, updateAdStatus } from '../../api/authApi';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import ConfirmationModal from '../../components/ConfirmationModal';

const ActiveAds: React.FC = () => {
    const [page, setPage] = useState(1);
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        adId: string | null;
        action: 'pause' | 'resume' | 'delete' | null;
        title: React.ReactNode;
        icon: React.ReactNode;
        confirmText: string;
    }>({
        isOpen: false,
        adId: null,
        action: null,
        title: '',
        icon: null,
        confirmText: ''
    });

    const queryClient = useQueryClient();

    const { data: adsData, isLoading } = useQuery({
        queryKey: ['active-ads', page],
        queryFn: () => getAdsV2({ status: 'active,approved,paused', page, limit: 10 })
    });

    const campaigns = adsData?.data?.data || [];
    const meta = adsData?.data?.meta || {};

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => updateAdStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['active-ads'] });
            toast.success('Ad status updated successfully');
            closeModal();
        },
        onError: () => {
            toast.error('Failed to update ad status');
            closeModal();
        }
    });

    const handleAction = (id: string, action: 'pause' | 'resume' | 'delete') => {
        let config = {
            isOpen: true,
            adId: id,
            action: action,
            title: '',
            icon: null as React.ReactNode,
            confirmText: 'Confirm'
        };

        if (action === 'pause') {
            config.title = "Are you sure you want to\npause this ad?";
            config.icon = <Pause size={32} />;
            config.confirmText = "Pause Ad";
        } else if (action === 'resume') {
            config.title = "Are you sure you want to\nresume this ad?";
            config.icon = <Play size={32} />;
            config.confirmText = "Resume Ad";
        } else if (action === 'delete') {
            config.title = "Are you sure you want to\nstop this ad?";
            config.icon = <Trash2 size={32} />;
            config.confirmText = "Stop Ad";
        }

        setModalConfig(config);
    };

    const confirmAction = () => {
        if (!modalConfig.adId || !modalConfig.action) return;

        const { adId, action } = modalConfig;

        if (action === 'pause') {
            updateStatusMutation.mutate({ id: adId, status: 'paused' });
        } else if (action === 'resume') {
            updateStatusMutation.mutate({ id: adId, status: 'active' });
        } else if (action === 'delete') {
            updateStatusMutation.mutate({ id: adId, status: 'completed' });
        }
    };

    const closeModal = () => {
        setModalConfig({ ...modalConfig, isOpen: false });
    };

    // Calculate dynamic stats
    const totalReach = campaigns.reduce((acc: number, curr: any) => acc + (curr.metrics?.uniqueReach || 0), 0);
    const totalSpend = campaigns.reduce((acc: number, curr: any) => acc + (curr.spentAmount || 0), 0);
    const totalClicks = campaigns.reduce((acc: number, curr: any) => acc + (curr.metrics?.clicks || 0), 0);
    const totalImpressions = campaigns.reduce((acc: number, curr: any) => acc + (curr.metrics?.impressions || 0), 0);
    const avgClickRate = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";

    return (
        <div className="max-w-[1600px] mx-auto font-['AeonikRegular']">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="headings-web-h4-headline text-slate-900">Active Campaigns</h1>
                    <p className="body-text-body-2 text-slate-500 mt-1">Manage and monitor your live advertisement campaigns</p>
                </div>
                <a href="/ads/create" className="btn-medical !w-auto">Create New Campaign</a>
            </div>

            {/* Overview Stats (Dynamic) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    { label: "Unique Reach", value: totalReach.toLocaleString(), icon: Eye, color: "text-[#9146C1]", bg: "bg-purple-50" },
                    { label: "CTR (Avg)", value: `${avgClickRate}%`, icon: MousePointer2, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Total Spend", value: `$${totalSpend.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] flex items-center gap-4">
                        <div className={`p-4 rounded-lg ${stat.bg} ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <h3 className="headings-web-h5-headline text-slate-900">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Campaigns List */}
            <div className="space-y-6">
                {isLoading ? <Loader text="Loading campaigns..." /> : campaigns.length === 0 ? <p className="text-center text-slate-500 py-10">No active campaigns found.</p> : (
                    <>
                        {campaigns.map((ad: any, idx: number) => {
                            const creative = ad.creatives?.[0];
                            const budgetConsumedPercent = ad.budgetConsumedPercent ?? (
                                ad.totalBudget > 0 ? Math.min(100, Math.round(((ad.spentAmount || 0) / ad.totalBudget) * 100)) : 0
                            );
                            return (
                                <motion.div
                                    key={ad._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white p-6 md:p-8 rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] hover:shadow-md transition-all group"
                                >
                                    <div className="flex flex-col lg:flex-row gap-8 items-center text-center lg:text-left">
                                        <div className="w-20 h-20 rounded-lg bg-purple-50 flex items-center justify-center text-[#9146C1] shadow-inner shrink-0 overflow-hidden relative">
                                            {creative?.mediaUrl ? (
                                                <img
                                                    src={creative.mediaUrl.startsWith('http') ? creative.mediaUrl : `${import.meta.env.VITE_IMAGE_URL}${creative.mediaUrl}`}
                                                    alt={ad.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Megaphone size={32} />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col gap-2 mb-2">
                                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                                                    <h3 className="headings-web-h6-headline text-slate-900 truncate max-w-md" title={ad.name}>{ad.name}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-['AeonikBold'] uppercase tracking-widest ${(ad.status === 'active' || ad.status === 'approved') ? 'bg-emerald-50 text-emerald-600' :
                                                        ad.status === 'paused' ? 'bg-amber-50 text-amber-600' :
                                                            'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {ad.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500 truncate max-w-xl">{creative?.description || 'No description'}</p>
                                            </div>
                                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm font-['AeonikMedium'] text-slate-400 mt-3">
                                                <span className="flex items-center gap-1.5"><Eye size={16} /> {ad.metrics?.impressions || 0} Imp.</span>
                                                <span className="flex items-center gap-1.5"><MousePointer2 size={16} /> {ad.metrics?.clicks || 0} Clicks</span>
                                                <span className="flex items-center gap-1.5 font-['AeonikBold'] text-slate-900">${(ad.spentAmount || 0).toFixed(2)} / ${(ad.totalBudget || 0).toFixed(2)}</span>
                                                <span className="flex items-center gap-1.5 font-['AeonikMedium'] text-slate-500">${((ad.totalBudget || 0) - (ad.spentAmount || 0)).toFixed(2)} Left</span>
                                            </div>
                                        </div>

                                        <div className="w-full lg:w-48 space-y-3 shrink-0">
                                            <div className="flex justify-between text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest px-1">
                                                <span>Consumed</span>
                                                <span>{budgetConsumedPercent}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${budgetConsumedPercent}%` }}
                                                    className="h-full bg-[#9146C1] rounded-full"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-3 shrink-0">
                                            {/* <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-[#9146C1] hover:bg-purple-50 rounded-lg transition-all border-none cursor-pointer" title="View Details">
                                                <BarChart3 size={20} />
                                            </button> */}
                                            {(ad.status === 'active' || ad.status === 'approved') ? (
                                                <button
                                                    onClick={() => handleAction(ad._id, 'pause')}
                                                    className="p-2.5 bg-slate-50 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all border-none cursor-pointer"
                                                    title="Pause Campaign"
                                                >
                                                    <Pause size={20} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleAction(ad._id, 'resume')}
                                                    className="p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border-none cursor-pointer"
                                                    title="Resume Campaign"
                                                >
                                                    <Play size={20} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleAction(ad._id, 'delete')}
                                                className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all border-none cursor-pointer"
                                                title="Stop Campaign"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}

                        {/* Pagination */}
                        {meta.totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-8">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="text-sm font-['AeonikMedium'] text-slate-600">
                                    Page {page} of {meta.totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                    disabled={page === meta.totalPages}
                                    className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={closeModal}
                onConfirm={confirmAction}
                title={modalConfig.title}
                icon={modalConfig.icon}
                confirmText={modalConfig.confirmText}
            />
        </div>
    );
};

export default ActiveAds;
