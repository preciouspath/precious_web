"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
    Megaphone,
    Clock,
    ArrowUpRight,
    Eye,
    DollarSign,
    CheckCircle2,
    Plus
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';

import { useQuery } from '@tanstack/react-query';
import { getAdStats, getAdsV2 } from '../api/authApi';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
    const { data: statsData, isLoading: isStatsLoading } = useQuery({
        queryKey: ['ad-stats'],
        queryFn: getAdStats,
        select: (res) => res.data.data
    });

    const { data: adsData, isLoading: isAdsLoading } = useQuery({
        queryKey: ['active-ads-dashboard'],
        queryFn: () => getAdsV2({ status: 'active,approved', sort: '-reach', limit: 3 }),
        select: (res) => res.data?.data || []
    });

    const statsObj = statsData || {};
    const activeAds = adsData || [];

    // Generate chart data for the last 7 days
    const generateChartData = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const data = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayName = days[date.getDay()];

            // For now, use placeholder data since we don't have daily stats
            // In a real scenario, you'd fetch daily stats from the backend
            data.push({
                name: dayName,
                spend: Math.floor(Math.random() * 3000) + 1000,
                reach: Math.floor(Math.random() * 5000) + 2000
            });
        }

        return data;
    };

    const data = generateChartData();

    const stats = [
        { label: "Total Ads Created", value: statsObj.totalAds || 0, icon: Megaphone, color: "bg-purple-50 text-[#9146C1]", trend: "+0%" },
        { label: "Ads Approved", value: (statsObj.activeAds || 0) + (statsObj.approvedAds || 0), icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600", trend: "+0%" },
        { label: "Reach Achieved", value: (statsObj.reach || 0).toLocaleString(), icon: Eye, color: "bg-amber-50 text-amber-600", trend: "+0%" },
        { label: "Total Spent", value: `₹${(statsObj.spentAmount || 0).toLocaleString()}`, icon: DollarSign, color: "bg-rose-50 text-rose-600", trend: "+0%" },
    ];

    return (
        <div className="max-w-[1600px] mx-auto font-['AeonikRegular']">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="headings-web-h4-headline text-slate-900">Business Dashboard</h1>
                    <p className="body-text-body-2 text-slate-500 mt-1">Monitor your performance and ad campaigns</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/ads/history" className="px-6 py-2.5 bg-white border border-slate-200 rounded-lg text-[12px] font-['AeonikMedium'] text-slate-600 hover:bg-slate-50 transition-all shadow-sm cursor-pointer no-underline flex items-center">
                        View All Campaigns
                    </Link>
                    <Link to="/ads/create" className="btn-medical no-underline flex items-center">
                        <Plus size={18} className="mr-2" /> Create New Ad
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {isStatsLoading ? (
                    [1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white p-6 rounded-lg border border-slate-100 h-32 animate-pulse">
                            <div className="h-10 w-10 bg-slate-100 rounded-lg mb-4"></div>
                            <div className="h-6 bg-slate-100 w-1/2 mb-2"></div>
                            <div className="h-4 bg-slate-50 w-3/4"></div>
                        </div>
                    ))
                ) : (
                    stats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-6 rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] hover:shadow-md transition-all group cursor-default"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-lg ${stat.color} transition-transform group-hover:scale-110`}>
                                    <stat.icon size={24} />
                                </div>
                                <span className={`text-[12px] font-['AeonikMedium'] flex items-center gap-1 text-emerald-500`}>
                                    <ArrowUpRight size={14} />
                                    {stat.trend}
                                </span>
                            </div>
                            <h3 className="headings-web-h5-headline text-slate-900 mb-1">{stat.value}</h3>
                            <p className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="headings-web-h6-headline text-slate-900">Reach achieved</h3>
                            <p className="text-xs font-['AeonikMedium'] text-slate-400 mt-1">Campaign performance over the last 7 days</p>
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#9146C1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#9146C1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        fontFamily: 'AeonikBold'
                                    }}
                                />
                                <Area type="monotone" dataKey="reach" stroke="#9146C1" strokeWidth={3} fillOpacity={1} fill="url(#colorReach)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="headings-web-h6-headline text-slate-900">Amount Spent</h3>
                            <p className="text-xs font-['AeonikMedium'] text-slate-400 mt-1">Cost distribution by day</p>
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} hide />
                                <YAxis axisLine={false} tickLine={false} hide />
                                <Tooltip
                                    cursor={{ fill: '#F8FAFC' }}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        fontFamily: 'AeonikBold'
                                    }}
                                />
                                <Bar dataKey="spend" radius={[8, 8, 8, 8]} barSize={32}>
                                    {data.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 6 ? '#9146C1' : '#E2E8F0'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="headings-web-h6-headline text-slate-900">Top Performing Ads</h3>
                        <Link to="/ads/active" className="text-[12px] font-['AeonikBold'] text-[#9146C1] hover:underline no-underline">View All</Link>
                    </div>
                    <div className="space-y-4">
                        {isAdsLoading ? (
                            [1, 2, 3].map((i) => (
                                <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-lg"></div>
                            ))
                        ) : activeAds.length === 0 ? (
                            <div className="text-center py-10">
                                <Megaphone className="mx-auto text-slate-200 mb-2" size={40} />
                                <p className="text-slate-400 text-sm">No active ads to display</p>
                            </div>
                        ) : (
                            activeAds.map((ad: any) => {
                                const creative = ad.creatives?.[0] || {};
                                return (
                                    <div key={ad._id} className="flex items-center gap-4 p-4 rounded-lg bg-slate-50/50 border border-slate-50 group transition-all hover:bg-white hover:shadow-md">
                                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-[#9146C1] overflow-hidden">
                                            {creative.mediaUrl ? (
                                                <img
                                                    src={creative.mediaUrl.startsWith('http') ? creative.mediaUrl : `${import.meta.env.VITE_IMAGE_URL}${creative.mediaUrl}`}
                                                    alt="ad"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Megaphone size={20} />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-['AeonikBold'] text-slate-900 line-clamp-1">{ad.name}</h4>
                                            <p className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest mt-1">
                                                Status: <span className="text-emerald-500">{ad.status}</span> • Reach: {ad.metrics?.uniqueReach || 0}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-['AeonikBold'] text-slate-900">₹{(ad.totalBudget || 0).toLocaleString()}</p>
                                            <p className="text-[10px] text-slate-400 uppercase font-['AeonikBold'] mt-1">Budget</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)]">
                    <h3 className="headings-web-h6-headline text-slate-900 mb-6">Recent Activity</h3>
                    <div className="space-y-6">
                        {activeAds.slice(0, 3).map((ad: any, idx: number) => (
                            <div key={ad._id} className="flex gap-4 relative">
                                {idx !== activeAds.slice(0, 3).length - 1 && <div className="absolute left-[23px] top-10 bottom-0 w-0.5 bg-slate-100" />}
                                <div className="z-10 w-12 h-12 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center p-2">
                                    <div className="w-full h-full rounded-full bg-purple-50 flex items-center justify-center text-[#9146C1]">
                                        <CheckCircle2 size={16} />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-['AeonikBold'] text-slate-800">Ad Active</p>
                                    <p className="text-xs font-['AeonikMedium'] text-slate-400 mt-1">Your '{ad.name}' campaign is currently performing well.</p>
                                    <p className="text-[10px] font-['AeonikBold'] text-[#9146C1] uppercase tracking-widest mt-2">{new Date(ad.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                        {activeAds.length === 0 && (
                            <div className="text-center py-10">
                                <Clock className="mx-auto text-slate-200 mb-2" size={40} />
                                <p className="text-slate-400 text-sm">No recent activity</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
