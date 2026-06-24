import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import ConfirmationModal from './ConfirmationModal';
import useAuthStore from '../store/authStore';
import axiosClient from '../api/axiosClient';
import { deleteAccountApi } from '../api/authApi';

const DashboardHeader: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, setUser, unreadCount, refreshUnreadCount, setUnreadCount } = useAuthStore();
    const queryClient = useQueryClient();
    const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
    const [showLogoutModal, setShowLogoutModal] = React.useState(false);
    const [showDeleteModal, setShowDeleteModal] = React.useState(false);

    useEffect(() => {
        refreshUnreadCount();

        // Poll every minute to keep unread count updated
        const interval = setInterval(refreshUnreadCount, 60000);

        return () => clearInterval(interval);
    }, [location.pathname]); // Refetch on navigation

    // ... (rest of the file until return)

    // Device sync state
    const [syncStatus, setSyncStatus] = useState<'synced' | 'not-synced' | 'syncing'>('not-synced');

    // Update sync status when user profile changes
    useEffect(() => {
        if (user?.healthProfile?.smartwatch?.connected) {
            setSyncStatus('synced');
        } else {
            setSyncStatus('not-synced');
        }
    }, [user?.healthProfile?.smartwatch?.connected]);

    // Handle device sync
    const handleDeviceSync = async () => {
        if (syncStatus === 'syncing') return;

        // If no device connected, redirect to management page
        if (!user?.healthProfile?.smartwatch?.connected) {
            toast.info("Please connect a smartwatch first.");
            navigate('/smartwatch-management');
            return;
        }

        setSyncStatus('syncing');

        // Simulate sync process and persist to backend
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Persist the sync timestamp to the backend
            const updatedSmartwatch = {
                ...user.healthProfile.smartwatch,
                lastSync: new Date()
            };

            const response = await axiosClient.post("/update-profile", {
                smartwatch: updatedSmartwatch
            });

            if (response.data?.success) {
                setUser(response.data.data);
                setSyncStatus('synced');
                toast.success("Device data synced correctly!");
            }
        } catch (error) {
            console.error('Sync failed:', error);
            setSyncStatus('not-synced');
            toast.error("Failed to sync device. Please try again.");
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            queryClient.clear(); // Clear all cached data on logout
            setShowLogoutModal(false);
            navigate('/login');
        } catch (error) {
            console.error("Logout error:", error);
            // Even if API fails, clear local state and navigate
            queryClient.clear();
            setShowLogoutModal(false);
            navigate('/login');
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const res = await deleteAccountApi();
            if (res.success) {
                toast.success('Account deleted successfully');
                await logout();
                queryClient.clear();
                setShowDeleteModal(false);
                navigate('/login');
            } else {
                toast.error(res.message || 'Failed to delete account');
            }
        } catch (error: any) {
            console.error("Delete account error:", error);
            toast.error(error.response?.data?.message || 'An error occurred while deleting your account');
        }
    };

    const toggleDrawer = () => {
        setIsDrawerOpen(!isDrawerOpen);
    };

    const navLinks = [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Doctor', path: '/doctor' },
        { label: 'Reports', path: '/reports' },
        { label: 'Insurance', path: '/insurance' },
    ];

    return (
        <>
            <header className="bg-white shadow-sm sticky top-0 z-[1000] py-3">
                <div className="container">
                    <div className="flex items-center justify-between gap-8">
                        {/* Logo */}
                        <Link to="/dashboard" className="flex items-center gap-2">
                            <img src="/images/logo.svg" alt="Logo" className="h-8" />
                        </Link>

                        {/* Navigation */}
                        <nav className="hidden lg:flex items-center flex-1 gap-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`text-base headings-web-h6-headline text-slate-700 hover:text-[#9146C1] transition-colors duration-300 no-underline whitespace-nowrap ${location.pathname === link.path
                                        ? 'text-[#9146C1]'
                                        : 'text-slate-600 hover:text-[#9146C1]'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        {/* User Actions */}
                        <div className="flex items-center gap-6">
                            {/* Notification Icon */}
                            <Link to="/notification-list" className="relative p-2 text-slate-500 hover:text-[#9146C1] transition-colors" onClick={() => setUnreadCount(0)}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                </svg>
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white font-['AeonikBold']">{unreadCount}</span>
                                )}
                            </Link>

                            {/* Device Sync Indicator */}
                            <button
                                onClick={handleDeviceSync}
                                disabled={syncStatus === 'syncing'}
                                className={`relative p-2 transition-all duration-300 cursor-pointer disabled:cursor-wait hidden lg:block ${syncStatus === 'synced'
                                    ? 'text-emerald-500 hover:text-emerald-600'
                                    : syncStatus === 'syncing'
                                        ? 'text-amber-500'
                                        : 'text-rose-500 hover:text-rose-600'
                                    }`}
                                title={
                                    syncStatus === 'synced'
                                        ? 'Device synced'
                                        : syncStatus === 'syncing'
                                            ? 'Syncing device...'
                                            : 'Device not synced - Click to sync'
                                }
                            >
                                {/* Smartwatch Icon */}
                                <svg
                                    width="22"
                                    height="22"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={syncStatus === 'syncing' ? 'animate-pulse' : ''}
                                >
                                    <rect x="9" y="4" width="6" height="16" rx="1"></rect>
                                    <path d="M9 9h6"></path>
                                    <path d="M9 15h6"></path>
                                    <path d="M9 20h6"></path>
                                    <path d="M9 4h6"></path>
                                </svg>
                                {/* Status Dot */}
                                <span className={`absolute top-1 right-1 w-2 h-2 rounded-full border border-white ${syncStatus === 'synced'
                                    ? 'bg-emerald-500'
                                    : syncStatus === 'syncing'
                                        ? 'bg-amber-500 animate-pulse'
                                        : 'bg-rose-500'
                                    }`}></span>
                            </button>

                            {/* Account Dropdown */}
                            <div className="relative group hidden lg:block">
                                <button className="flex items-center gap-2 py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors bg-white shadow-sm">
                                    <div className="w-7 h-7 bg-[#9146C1] rounded-full flex items-center justify-center text-white">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                    </div>
                                    <span className="text-[14px] font-['AeonikMedium'] text-slate-700">My Account</span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>

                                {/* Detailed Dropdown Menu */}
                                <div className="absolute right-0 top-full mt-2 w-[240px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[1001] overflow-hidden">
                                    <div className="py-2">
                                        {/* My Profile */}
                                        <Link to="/profile" className="flex items-center gap-3 px-5 py-3 text-[15px] font-['AeonikMedium'] text-[#9146C1] hover:bg-purple-50 transition-colors">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="12" cy="7" r="4"></circle>
                                            </svg>
                                            My Profile
                                        </Link>

                                        {/* Change Password */}
                                        {user?.email && (
                                            <Link to="/change-password" className="w-full flex items-center gap-3 px-5 py-3 text-[15px] font-['AeonikMedium'] text-slate-600 hover:bg-slate-50 transition-colors no-underline">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                </svg>
                                                Change Password
                                            </Link>
                                        )}

                                        {/* Subscription */}
                                        <Link to="/subscription" className="w-full flex items-center gap-3 px-5 py-3 text-[15px] font-['AeonikMedium'] text-slate-600 hover:bg-slate-50 transition-colors no-underline">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="2" y="5" width="20" height="14" rx="2" />
                                                <line x1="2" y1="10" x2="22" y2="10" />
                                            </svg>
                                            Subscription
                                        </Link>

                                        {/* Notifications Settings */}
                                        <Link to="/notifications" className="w-full flex items-center gap-3 px-5 py-3 text-[15px] font-['AeonikMedium'] text-slate-600 hover:bg-slate-50 transition-colors no-underline">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                            </svg>
                                            Notifications Settings
                                        </Link>

                                        {/* Help & Support */}
                                        <Link to="/help-support" className="w-full flex items-center gap-3 px-5 py-3 text-[15px] font-['AeonikMedium'] text-slate-600 hover:bg-slate-50 transition-colors no-underline">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                            </svg>
                                            Help & Support
                                        </Link>

                                        {/* Delete Account */}
                                        <button
                                            onClick={() => setShowDeleteModal(true)}
                                            className="w-full flex items-center gap-3 px-5 py-3 text-[15px] font-['AeonikMedium'] text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                            Delete Account
                                        </button>

                                        <hr className="my-1 border-slate-100" />

                                        {/* Logout */}
                                        <button
                                            onClick={() => setShowLogoutModal(true)}
                                            className="w-full flex items-center gap-3 px-5 py-3 text-[15px] font-['AeonikMedium'] text-slate-700 hover:bg-slate-50 hover:text-[#9146C1] transition-colors"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                                <polyline points="16 17 21 12 16 7"></polyline>
                                                <line x1="21" y1="12" x2="9" y2="12"></line>
                                            </svg>
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Menu Toggle */}
                            <button
                                className="lg:hidden bg-transparent border-none text-3xl text-[#9146C1] cursor-pointer p-1 leading-none"
                                onClick={toggleDrawer}
                            >
                                ☰
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Drawer Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 transition-all duration-300 z-[1998] ${isDrawerOpen ? "opacity-100 visible" : "opacity-0 invisible"
                    }`}
                onClick={toggleDrawer}
            ></div>

            {/* Mobile Drawer */}
            <div
                className={`fixed top-0 w-72 max-w-[85%] h-screen bg-white shadow-xl transition-all duration-300 z-[1999] flex flex-col overflow-y-auto ${isDrawerOpen ? "right-0" : "-right-full"
                    }`}
            >
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200">
                    <div className="flex items-center gap-2.5">
                        <img src="/images/logo.svg" alt="Logo" />
                    </div>
                    <button
                        className="bg-transparent border-none text-2xl text-slate-700 cursor-pointer p-1 leading-none"
                        onClick={toggleDrawer}
                    >
                        ✕
                    </button>
                </div>

                {/* Drawer Navigation */}
                <nav className="flex-1 py-5">
                    <ul className="list-none m-0 p-0">
                        {navLinks.map((link) => (
                            <li key={link.path} className="border-b border-slate-100">
                                <Link
                                    to={link.path}
                                    className={`block py-4 px-5 text-base font-['AeonikMedium'] transition-all duration-300 no-underline ${location.pathname === link.path
                                        ? 'text-[#9146C1] bg-purple-50'
                                        : 'text-slate-700 hover:bg-purple-50 hover:text-[#9146C1]'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Drawer Actions */}
                <div className="p-5 flex flex-col gap-2 border-t border-slate-200">
                    <div className="font-['AeonikMedium'] text-slate-500 mb-2 px-1 text-sm uppercase">Account</div>
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-purple-50 hover:text-[#9146C1] rounded-lg transition-colors no-underline font-['AeonikMedium']">
                        Profile
                    </Link>
                    <Link to="/settings" className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-purple-50 hover:text-[#9146C1] rounded-lg transition-colors no-underline font-['AeonikMedium']">
                        Settings
                    </Link>
                    <button
                        onClick={() => {
                            toggleDrawer();
                            setShowLogoutModal(true);
                        }}
                        className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-500 hover:bg-red-50 rounded-lg transition-colors no-underline font-['AeonikMedium'] bg-transparent border-none cursor-pointer"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Logout Modal */}
            <ConfirmationModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogout}
                title="Are you sure want to log out"
                icon={
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                }
                confirmText="Yes"
                cancelText="No"
                confirmButtonClass="btn btn-primary"
                cancelButtonClass="btn btn-black"
            />

            {/* Delete Account Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteAccount}
                title={<>Are you sure you want to <br />delete account?</>}
                icon={
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                }
                confirmText="Yes"
                cancelText="No"
                confirmButtonClass="btn btn-primary"
                cancelButtonClass="btn btn-black"
            />
        </>
    );
};

export default DashboardHeader;