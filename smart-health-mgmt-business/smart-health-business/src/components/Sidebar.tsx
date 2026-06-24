"use client";

import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Megaphone,
    Search,
    History,
    Activity,
    LogOut,
    ChevronDown,
    Menu,
    X,
    Settings,
    Ticket
} from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../store/authStore';

import ConfirmationModal from './ConfirmationModal';

const Sidebar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuthStore();

    const menuItems = [
        {
            title: "Dashboard",
            icon: LayoutDashboard,
            path: "/dashboard"
        },
        {
            title: "Ads",
            icon: Megaphone,
            submenu: [
                { title: "Active Ads", path: "/ads/active", icon: Activity },
                { title: "Pending Review", path: "/ads/pending", icon: Search },
                { title: "Past Campaigns", path: "/ads/history", icon: History }
            ]
        },
        {
            title: "Profile Settings",
            icon: Settings,
            path: "/profile"
        },
        {
            title: "Notifications",
            icon: Activity,
            path: "/notifications"
        },
        {
            title: "Security",
            icon: Settings,
            path: "/security"
        },
        {
            title: "Help & Support",
            icon: Ticket,
            path: "/help-support"
        }
    ];

    const handleLogout = async () => {
        if (window.confirm("Are you sure you want to log out?")) {
            await logout();
            toast.success("Logged out successfully");
            navigate('/login');
        }
    };

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-[#9146C1] text-white rounded-2xl shadow-xl border-none cursor-pointer"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <motion.aside
                initial={false}
                animate={{ width: isOpen ? 280 : 0, x: isOpen ? 0 : -280 }}
                className="fixed lg:relative z-40 h-screen bg-white border-r border-slate-100 flex flex-col overflow-hidden"
            >
                {/* Logo */}
                <div className="p-8 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--theme-color-primary-shade-600)] rounded-xl flex items-center justify-center p-2">
                            <img src="/images/logo-icon.svg" alt="logo" className="w-full h-full" />
                        </div>
                        <div className="overflow-hidden">
                            <h2 className="font-['AeonikBold'] text-slate-900 tracking-tight whitespace-nowrap">Business Panel</h2>
                            <p className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest whitespace-nowrap">Management Console</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 overflow-y-auto scrollbar-hide py-4 space-y-2">
                    {menuItems.map((item, idx) => (
                        <div key={idx}>
                            {item.submenu ? (
                                <div>
                                    <button
                                        onClick={() => setActiveSubmenu(activeSubmenu === item.title ? null : item.title)}
                                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border-none bg-transparent cursor-pointer ${location.pathname.includes(item.title.toLowerCase())
                                            ? 'text-[#9146C1]' : 'text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon size={20} />
                                            <span className="font-['AeonikBold'] text-sm tracking-tight">{item.title}</span>
                                        </div>
                                        <ChevronDown size={16} className={`transition-transform ${activeSubmenu === item.title ? 'rotate-180' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {activeSubmenu === item.title && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden bg-slate-50/50 rounded-2xl mt-1 space-y-1"
                                            >
                                                {item.submenu.map((sub, sIdx) => (
                                                    <NavLink
                                                        key={sIdx}
                                                        to={sub.path}
                                                        className={({ isActive }) =>
                                                            `flex items-center gap-3 p-3.5 pl-12 rounded-xl transition-all no-underline ${isActive ? 'text-[#9146C1] bg-purple-50' : 'text-slate-400 hover:text-slate-600'
                                                            }`
                                                        }
                                                    >
                                                        <sub.icon size={16} />
                                                        <span className="font-['AeonikBold'] text-[13px]">{sub.title}</span>
                                                    </NavLink>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <NavLink
                                    to={item.path!}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 p-3.5 rounded-2xl transition-all no-underline ${isActive ? 'bg-purple-50 text-[#9146C1]' : 'text-slate-500 hover:bg-slate-50'
                                        }`
                                    }
                                >
                                    <item.icon size={20} />
                                    <span className="font-['AeonikBold'] text-sm tracking-tight">{item.title}</span>
                                </NavLink>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="p-4 mt-auto">
                    <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        className="w-full flex items-center gap-3 p-4 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all border-none bg-transparent cursor-pointer"
                    >
                        <LogOut size={20} />
                        <span className="font-['AeonikBold'] text-sm tracking-tight">Logout</span>
                    </button>
                </div>
            </motion.aside>

            {/* Backdrop */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="lg:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30"
                />
            )}

            <ConfirmationModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={handleLogout}
                title="Are you sure want to log out"
                icon={<LogOut size={32} />}
                confirmText="Yes"
                cancelText="No"
            />
        </>
    );
};

export default Sidebar;
