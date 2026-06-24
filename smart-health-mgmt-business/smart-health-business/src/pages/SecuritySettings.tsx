"use client";

import React, { useState } from 'react';
import { Shield, Lock, LogOut, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { changePassword, logoutAllSessions } from '../api/authApi';
import useAuthStore from '../store/authStore';
import ConfirmationModal from '../components/ConfirmationModal';

interface PasswordFormData {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}

const SecuritySettings: React.FC = () => {
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [changing, setChanging] = useState(false);
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PasswordFormData>();
    const navigate = useNavigate();
    const { logout } = useAuthStore();

    const newPassword = watch('newPassword');

    const onSubmitPassword = async (data: PasswordFormData) => {
        if (data.newPassword !== data.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            setChanging(true);
            await changePassword({
                oldPassword: data.oldPassword,
                newPassword: data.newPassword
            });
            toast.success('Password changed successfully');
            reset();
            setShowCurrent(false);
            setShowNew(false);
            setShowConfirm(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setChanging(false);
        }
    };

    const handleLogoutAll = async () => {
        try {
            setLoggingOut(true);
            await logoutAllSessions();
            await logout();
            toast.success('Logged out from all devices successfully');
            navigate('/login');
        } catch (error) {
            toast.error('Failed to logout from all sessions');
        } finally {
            setLoggingOut(false);
            setLogoutModalOpen(false);
        }
    };

    return (
        <>
            <div className="max-w-[1200px] mx-auto font-['AeonikRegular']">
                <div className="mb-8">
                    <h1 className="headings-web-h4-headline text-slate-900">Security Settings</h1>
                    <p className="body-text-body-2 text-slate-500 mt-1">Manage your password and session security</p>
                </div>

                <div className="space-y-6">
                    {/* Change Password */}
                    <div className="bg-white rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-[#9146C1]">
                                <Lock size={24} />
                            </div>
                            <div>
                                <h3 className="headings-web-h6-headline text-slate-900">Change Password</h3>
                                <p className="text-xs text-slate-400 font-['AeonikMedium']">Update your account password</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest mb-2 block">
                                    Current Password *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showCurrent ? 'text' : 'password'}
                                        {...register('oldPassword', { required: 'Current password is required' })}
                                        className="form-control pr-12"
                                        placeholder="Enter current password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrent(!showCurrent)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                                    >
                                        {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.oldPassword && (
                                    <p className="text-xs text-rose-500 mt-1">{errors.oldPassword.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest mb-2 block">
                                    New Password *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showNew ? 'text' : 'password'}
                                        {...register('newPassword', {
                                            required: 'New password is required',
                                            minLength: { value: 8, message: 'Password must be at least 8 characters' },
                                            validate: (value) => value !== watch('oldPassword') || 'New password cannot be the same as current password'
                                        })}
                                        className="form-control pr-12"
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNew(!showNew)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                                    >
                                        {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.newPassword && (
                                    <p className="text-xs text-rose-500 mt-1">{errors.newPassword.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest mb-2 block">
                                    Confirm New Password *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        {...register('confirmPassword', {
                                            required: 'Please confirm your password',
                                            validate: value => value === newPassword || 'Passwords do not match'
                                        })}
                                        className="form-control pr-12"
                                        placeholder="Confirm new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                                    >
                                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-xs text-rose-500 mt-1">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={changing}
                                    className="btn-medical min-w-[180px] disabled:opacity-50"
                                >
                                    {changing ? 'Changing...' : 'Change Password'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Logout All Sessions */}
                    <div className="bg-white rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] p-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h3 className="headings-web-h6-headline text-slate-900">Logout from All Sessions</h3>
                                    <p className="text-xs text-slate-500 font-['AeonikMedium'] mt-1">
                                        Sign out from all devices where you're logged in
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setLogoutModalOpen(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-sm font-['AeonikBold'] hover:bg-rose-100 transition-all border-none cursor-pointer"
                            >
                                <LogOut size={16} /> Logout All Devices
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={logoutModalOpen}
                onClose={() => setLogoutModalOpen(false)}
                onConfirm={handleLogoutAll}
                title="Logout from All Devices?"
                description="You will be signed out from all devices. You'll need to log in again on this device."
                icon={<LogOut size={32} />}
                confirmText={loggingOut ? 'Logging out...' : 'Yes, Logout'}
                cancelText="Cancel"
            />
        </>
    );
};

export default SecuritySettings;
