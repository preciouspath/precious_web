"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from 'lucide-react';
import useAuthStore from '../store/authStore';
import NotificationDropdown from './NotificationDropdown';

const Navbar: React.FC = () => {
    const location = useLocation();
    const { user } = useAuthStore();
    const baseUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

    const getBreadcrumbs = () => {
        const paths = location.pathname.split('/').filter(p => p);
        return paths.map((path, idx) => (
            <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-300 mx-2">/</span>}
                <span className={`capitalize ${idx === paths.length - 1 ? 'text-slate-900 font-["AeonikBold"]' : 'text-slate-400 font-["AeonikMedium"]'}`}>
                    {path.replace('-', ' ')}
                </span>
            </React.Fragment>
        ));
    };

    return (
        <header className="h-20 bg-white border-b border-slate-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center text-xs tracking-widest uppercase">
                <span className="text-slate-400  font-[AeonikMedium]">Business</span>
                <span className="text-slate-300 mx-2">/</span>
                {getBreadcrumbs()}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 md:gap-6">

                <div className="flex items-center gap-3 md:gap-4 pl-3 md:pl-6 border-l border-slate-100">
                    <NotificationDropdown />

                    <Link to="/profile" className="flex items-center gap-3 bg-slate-50 p-1.5 pr-4 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors">
                        <div className="w-8 h-8 rounded-xl bg-[#9146C1] flex items-center justify-center text-white shadow-lg shadow-purple-100 overflow-hidden">
                            {user?.profileImage ? (
                                <img
                                    src={`${baseUrl}${user.profileImage}`}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User size={16} />
                            )}
                        </div>

                        <div className="hidden lg:block">
                            <p className="text-[11px] font-['AeonikBold'] text-slate-900 leading-none">{user?.ownerName || 'Business Owner'}</p>
                            <p className="text-[9px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest mt-1">Business Admin</p>
                        </div>
                    </Link>
                </div>
            </div>
        </header >
    );
};

export default Navbar;
