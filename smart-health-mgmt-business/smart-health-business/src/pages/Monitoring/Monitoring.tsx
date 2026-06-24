"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    ShieldCheck,
    Server,
    Database,
    CheckCircle2,
    Zap
} from 'lucide-react';

const Monitoring: React.FC = () => {
    const systems = [
        { name: "API Gateways", status: "Operational", uptime: "99.99%", latency: "45ms", icon: Zap, color: "text-emerald-500" },
        { name: "Database Cluster", status: "Operational", uptime: "99.98%", latency: "12ms", icon: Database, color: "text-blue-500" },
        { name: "Ad Delivery System", status: "Operational", uptime: "99.95%", latency: "85ms", icon: Server, color: "text-purple-500" },
        { name: "Auth Service", status: "Maintenance", uptime: "99.99%", latency: "120ms", icon: ShieldCheck, color: "text-amber-500" },
    ];

    return (
        <div className="max-w-[1600px] mx-auto font-['AeonikRegular']">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="headings-web-h4-headline text-slate-900">Infrastructure Health</h1>
                    <p className="body-text-body-2 text-slate-500 mt-1">Live monitoring of system services and performance</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-['AeonikBold'] uppercase tracking-widest border border-emerald-100">
                    <CheckCircle2 size={16} /> All Systems Operational
                </div>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {systems.map((sys, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-6 rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)]"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className={`p-3 rounded-lg bg-slate-50 ${sys.color}`}>
                                <sys.icon size={24} />
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest mb-1">Uptime</p>
                                <p className="text-sm font-['AeonikBold'] text-slate-900">{sys.uptime}</p>
                            </div>
                        </div>
                        <h3 className="text-sm font-['AeonikBold'] text-slate-900 mb-1">{sys.name}</h3>
                        <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-['AeonikBold'] uppercase tracking-wider ${sys.status === 'Operational' ? 'text-emerald-500' : 'text-amber-500'
                                }`}>{sys.status}</span>
                            <span className="text-[10px] font-['AeonikBold'] text-slate-400">{sys.latency}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Real-time Logs */}
                <div className="bg-slate-900 rounded-lg p-8 shadow-xl shadow-slate-900/10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Activity className="text-[#9146C1]" size={20} />
                            <h3 className="headings-web-h6-headline text-white">Live Performance Feed</h3>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-['AeonikBold'] text-white/60 uppercase tracking-widest">Live Updates</span>
                        </div>
                    </div>
                    <div className="space-y-4 font-mono text-[11px]">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-white/30 whitespace-nowrap">[{new Date().toLocaleTimeString()}]</span>
                                <span className="text-emerald-400">[SUCCESS]</span>
                                <span className="text-white/70">Integrity check completed for node-0{i}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Assets */}
                <div className="bg-white rounded-lg p-8 border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)]">
                    <h3 className="headings-web-h6-headline text-slate-900 mb-6 font-['AeonikBold']">Service Health</h3>
                    <div className="space-y-6">
                        {[
                            { label: "Memory Usage", value: 64, color: "bg-[#9146C1]" },
                            { label: "CPU Load", value: 42, color: "bg-indigo-500" },
                            { label: "Storage Capacity", value: 78, color: "bg-amber-500" },
                            { label: "Network Bandwidth", value: 55, color: "bg-emerald-500" },
                        ].map((metric, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-xs font-['AeonikBold'] text-slate-600">{metric.label}</span>
                                    <span className="text-xs font-['AeonikBold'] text-slate-900">{metric.value}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${metric.value}%` }}
                                        transition={{ duration: 1, delay: idx * 0.2 }}
                                        className={`h-full ${metric.color} rounded-full`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Monitoring;
