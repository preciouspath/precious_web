"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
    History,
    CheckCircle2,
    XCircle,
    Eye,
    MousePointer2,
    BarChart3
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

import { useQuery } from '@tanstack/react-query';
import { getAdsV2 } from '../../api/authApi';
import Loader from '../../components/common/Loader';

const AdHistory: React.FC = () => {
    const [selectedAd, setSelectedAd] = React.useState<any>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const baseUrl = import.meta.env.VITE_IMAGE_URL || "http://localhost:4000/uploads/ads";

    const { data: adsData, isLoading } = useQuery({
        queryKey: ['ad-history'],
        queryFn: () => getAdsV2({ limit: 100, status: 'completed,rejected' })
    });

    const history = adsData?.data?.data || [];

    // Aggregate monthly reach for chart
    const chartData = React.useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        const last4Months: any[] = [];

        for (let i = 3; i >= 0; i--) {
            const m = (currentMonth - i + 12) % 12;
            last4Months.push({ month: months[m], reach: 0 });
        }

        history.forEach((camp: any) => {
            const date = new Date(camp.createdAt);
            const mLabel = months[date.getMonth()];
            const chartItem = last4Months.find(item => item.month === mLabel);
            if (chartItem) {
                chartItem.reach += (camp.metrics?.uniqueReach || 0);
            }
        });

        return last4Months;
    }, [history]);

    const handleViewDetails = (ad: any) => {
        setSelectedAd(ad);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedAd(null);
    };

    const lifetimeReach = history.reduce((acc: number, curr: any) => acc + (curr.metrics?.uniqueReach || 0), 0);

    return (
        <div className="max-w-[1600px] mx-auto font-['AeonikRegular']">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="headings-web-h4-headline text-slate-900">Campaign History</h1>
                    <p className="body-text-body-2 text-slate-500 mt-1">Review historical performance and past campaign outcomes</p>
                </div>
            </div>

            {/* Performance Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="headings-web-h6-headline text-slate-900">Reach Distribution</h3>
                            <p className="text-xs font-['AeonikMedium'] text-slate-400 mt-1">Campaign unique reach over recent months</p>
                        </div>
                        <BarChart3 size={24} className="text-[#9146C1]" />
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontFamily: 'AeonikBold' }} />
                                <Bar dataKey="reach" radius={[8, 8, 8, 8]} barSize={40}>
                                    {chartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 3 ? '#9146C1' : '#E2E8F0'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] flex flex-col justify-center text-center">
                    <div className="w-20 h-20 bg-purple-50 rounded-lg flex items-center justify-center text-[#9146C1] mx-auto mb-6">
                        <History size={36} />
                    </div>
                    <h3 className="headings-web-h5-headline text-slate-900 mb-2">Lifetime Reach</h3>
                    <p className="text-3xl font-['AeonikBold'] text-[#9146C1]">
                        {lifetimeReach.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest mt-2">Across {history.length} campaigns</p>
                    <button className="mt-8 py-3.5 bg-slate-900 text-white rounded-lg text-[10px] font-['AeonikBold'] uppercase tracking-widest hover:bg-slate-800 transition-all border-none cursor-pointer">
                        Download History Report
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Campaign Title</th>
                                <th className="px-6 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Performance</th>
                                <th className="px-6 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Total Spend</th>
                                <th className="px-6 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest text-center">Outcome</th>
                                <th className="px-8 py-5 text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr><td colSpan={6} className="text-center p-10"><Loader text="Loading history..." /></td></tr>
                            ) : history.length === 0 ? (
                                <tr><td colSpan={6} className="text-center p-10 text-slate-500">No ad history found.</td></tr>
                            ) : (
                                history.map((ad: any) => (
                                    <motion.tr
                                        key={ad._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-slate-50/50 transition-colors group text-[13px]"
                                    >
                                        <td className="px-8 py-5">
                                            <p className="font-['AeonikBold'] text-slate-900">{ad.name}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                <span className="flex items-center gap-1.5 text-xs text-slate-400 font-['AeonikMedium']"><Eye size={12} /> {ad.metrics?.impressions || 0} Imp.</span>
                                                <span className="flex items-center gap-1.5 text-xs text-slate-400 font-['AeonikMedium']"><MousePointer2 size={12} /> {ad.metrics?.clicks || 0} Clicks</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 font-['AeonikBold'] text-slate-900">${(ad.spentAmount || 0).toFixed(2)}</td>
                                        <td className="px-6 py-5 font-['AeonikMedium'] text-slate-400">
                                            {new Date(ad.startDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex justify-center text-[10px]">
                                                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-['AeonikBold'] uppercase tracking-wider ${ad.status === 'completed' || ad.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                                                    ad.status === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'
                                                    }`}>
                                                    {ad.status === 'completed' || ad.status === 'active' ? <CheckCircle2 size={12} /> : ad.status === 'rejected' ? <XCircle size={12} /> : null}
                                                    {ad.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => handleViewDetails(ad)}
                                                className="text-[10px] font-['AeonikBold'] text-[#9146C1] uppercase tracking-widest hover:underline bg-transparent border-none cursor-pointer"
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Modal */}
            {isModalOpen && selectedAd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={closeModal}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-slate-100 px-8 py-6 flex items-center justify-between z-10">
                            <div>
                                <h2 className="headings-web-h5-headline text-slate-900">{selectedAd.name}</h2>
                                <p className="text-xs text-slate-400 font-['AeonikMedium'] mt-1">Campaign Details</p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-50 transition-colors border-none cursor-pointer bg-transparent"
                            >
                                <XCircle size={24} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 space-y-8">
                            {/* Banner Image */}
                            {selectedAd.creatives?.[0]?.mediaUrl && (
                                <div className="rounded-lg overflow-hidden border border-slate-100">
                                    <img
                                        src={selectedAd.creatives[0].mediaUrl.startsWith('http') ? selectedAd.creatives[0].mediaUrl : `${baseUrl}${selectedAd.creatives[0].mediaUrl}`}
                                        alt={selectedAd.name}
                                        className="w-full h-64 object-cover"
                                    />
                                </div>
                            )}

                            {/* Description */}
                            <div>
                                <h3 className="text-sm font-['AeonikBold'] text-slate-900 mb-2">Description</h3>
                                <p className="text-sm text-slate-600 font-['AeonikRegular'] leading-relaxed">{selectedAd.creatives?.[0]?.description || 'No description provided'}</p>
                            </div>

                            {/* Performance Metrics */}
                            <div>
                                <h3 className="text-sm font-['AeonikBold'] text-slate-900 mb-4">Performance Metrics</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-slate-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Eye size={16} className="text-[#9146C1]" />
                                            <span className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Unique Reach</span>
                                        </div>
                                        <p className="text-xl font-['AeonikBold'] text-slate-900">{(selectedAd.metrics?.uniqueReach || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MousePointer2 size={16} className="text-[#9146C1]" />
                                            <span className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Clicks</span>
                                        </div>
                                        <p className="text-xl font-['AeonikBold'] text-slate-900">{(selectedAd.metrics?.clicks || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Eye size={16} className="text-[#9146C1]" />
                                            <span className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Impressions</span>
                                        </div>
                                        <p className="text-xl font-['AeonikBold'] text-slate-900">{(selectedAd.metrics?.impressions || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <BarChart3 size={16} className="text-[#9146C1]" />
                                            <span className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">CTR</span>
                                        </div>
                                        <p className="text-xl font-['AeonikBold'] text-slate-900">
                                            {selectedAd.metrics?.impressions > 0 ? ((selectedAd.metrics.clicks / selectedAd.metrics.impressions) * 100).toFixed(2) : '0.00'}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Budget Information */}
                            <div>
                                <h3 className="text-sm font-['AeonikBold'] text-slate-900 mb-4">Budget Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-purple-50 rounded-lg p-4">
                                        <span className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Allocated Budget</span>
                                        <p className="text-2xl font-['AeonikBold'] text-[#9146C1] mt-2">${(selectedAd.totalBudget || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-4">
                                        <span className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Total Spent</span>
                                        <p className="text-2xl font-['AeonikBold'] text-slate-900 mt-2">${(selectedAd.spentAmount || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="bg-emerald-50 rounded-lg p-4">
                                        <span className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Remaining Budget</span>
                                        <p className="text-2xl font-['AeonikBold'] text-emerald-700 mt-2">${(selectedAd.remainingBudget || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Campaign Timeline */}
                            <div>
                                <h3 className="text-sm font-['AeonikBold'] text-slate-900 mb-4">Campaign Timeline</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 rounded-lg p-4">
                                        <span className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Start Date</span>
                                        <p className="text-sm font-['AeonikBold'] text-slate-900 mt-2">
                                            {new Date(selectedAd.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-4">
                                        <span className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">End Date</span>
                                        <p className="text-sm font-['AeonikBold'] text-slate-900 mt-2">
                                            {selectedAd.endDate ? new Date(selectedAd.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Status & Outcome */}
                            <div>
                                <h3 className="text-sm font-['AeonikBold'] text-slate-900 mb-4">Status & Outcome</h3>
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`flex items-center gap-2 px-4 py-2 rounded-lg font-['AeonikBold'] text-xs uppercase tracking-wider ${selectedAd.status === 'completed' || selectedAd.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                                            selectedAd.status === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'
                                            }`}>
                                            {selectedAd.status === 'completed' || selectedAd.status === 'active' ? <CheckCircle2 size={16} /> : selectedAd.status === 'rejected' ? <XCircle size={16} /> : null}
                                            {selectedAd.status}
                                        </span>
                                    </div>
                                    {selectedAd.status === 'rejected' && selectedAd.rejectionReason && (
                                        <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-lg">
                                            <p className="text-xs font-['AeonikBold'] text-rose-900 mb-1">Rejection Reason:</p>
                                            <p className="text-sm text-rose-700 font-['AeonikRegular']">{selectedAd.rejectionReason}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-100 px-8 py-4 flex justify-end">
                            <button
                                onClick={closeModal}
                                className="px-6 py-3 bg-slate-900 text-white rounded-lg text-xs font-['AeonikBold'] uppercase tracking-widest hover:bg-slate-800 transition-all border-none cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AdHistory;
