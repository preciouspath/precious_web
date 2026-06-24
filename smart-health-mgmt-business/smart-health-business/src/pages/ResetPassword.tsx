"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { resetPassword } from '../api/authApi';
import { toast } from 'react-toastify';
import Loader from '../components/common/Loader';

type ResetForm = {
    otp: string;
    password: string;
};

const ResetPassword: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>();
    const navigate = useNavigate();

    const location = useLocation();
    const email = location.state?.email;

    const resetMutation = useMutation({
        mutationFn: (data: any) => resetPassword(data),
        onSuccess: (response: any) => {
            toast.success(response.data?.message || 'Password reset successful');
            navigate('/login');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        }
    });

    const onSubmit = (data: ResetForm) => {
        if (!email) {
            toast.error('Email not found. Please start the forgot password process again.');
            return;
        }
        resetMutation.mutate({ ...data, email });
    };

    return (
        <section className="min-h-screen flex items-center justify-center relative bg-white overflow-hidden">
            {/* Background Decoration matching Web Panel */}
            <div className="absolute top-0 left-0 w-full h-[227px] bg-[linear-gradient(90deg,#FBF7FD_0%,#EBDDF7_100%)]"></div>

            <div className="w-full max-w-[500px] relative z-10 px-4">
                <div className="bg-white rounded-[8px] shadow-[0px_1px_3px_rgba(0,0,0,0.25)] border border-slate-100 overflow-hidden relative">
                    {resetMutation.isPending && (
                        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                            <Loader text="Resetting password..." />
                        </div>
                    )}
                    {/* Header matching Web branding */}
                    <div className="text-center p-8 pb-10 bg-[var(--theme-color-primary-shade-900)] relative">
                        <div className="flex justify-center mb-4">
                            <img src="/images/logo-icon.svg" alt="logo" className="w-[82px]" />
                        </div>
                        <div className='flex flex-col gap-[5px]'>
                            <h2 className="headings-web-h4-headline text-white mb-2">Reset Password</h2>
                            <p className="body-text-body-2 !text-white opacity-90">Create your new secure password</p>
                        </div>
                    </div>

                    <div className="p-8 md:p-10">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                            <div className="form-group">
                                <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Verification Code</label>
                                <input
                                    {...register("otp", {
                                        required: "OTP is required",
                                        pattern: { value: /^[0-9]+$/, message: "OTP must contain only digits" },
                                        minLength: { value: 6, message: "OTP must be 6 digits" },
                                        maxLength: { value: 6, message: "OTP must be 6 digits" }
                                    })}
                                    maxLength={6}
                                    className={`form-control text-center tracking-[10px] text-xl font-['AeonikBold'] ${errors.otp ? 'border-red-500 focus:border-red-500' : ''}`}
                                    placeholder="000000"
                                    onInput={(e) => {
                                        e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 6);
                                    }}
                                />
                                {errors.otp && <p className="form-error">{errors.otp.message}</p>}
                            </div>

                            <div className="form-group">
                                <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">New Password</label>
                                <div className="relative group">
                                    <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#9146C1] transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        {...register("password", {
                                            required: "Password is required",
                                            minLength: { value: 8, message: "Password must be at least 8 characters" },
                                            maxLength: { value: 32, message: "Password cannot exceed 32 characters" },
                                            pattern: {
                                                value: /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+$/,
                                                message: "The password must contain a combination of characters along with digit and special character"
                                            },
                                            validate: (value) => !value || !value.includes(" ") || "Password cannot contain spaces"
                                        })}
                                        type={showPassword ? "text" : "password"}
                                        className={`form-control !pl-14 pr-12 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                                        placeholder="Enter new password"
                                        maxLength={32}
                                        onInput={(e) => {
                                            e.currentTarget.value = e.currentTarget.value.replace(/\s/g, '');
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 inset-y-0 flex items-center text-slate-300 hover:text-[#9146C1] bg-transparent border-none cursor-pointer transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <p className="form-error">{errors.password.message}</p>}
                            </div>

                            <button
                                type="submit"
                                className="w-full btn-medical"
                            >
                                Update Password
                                <ArrowRight size={18} className="ml-2" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ResetPassword;
