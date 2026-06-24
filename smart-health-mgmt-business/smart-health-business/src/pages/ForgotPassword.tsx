"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ChevronLeft } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { forgotPassword } from '../api/authApi';
import { toast } from 'react-toastify';
import Loader from '../components/common/Loader';

type ForgotForm = {
    email: string;
};

const ForgotPassword: React.FC = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>();
    const navigate = useNavigate();

    const forgotMutation = useMutation({
        mutationFn: (data: { email: string }) => forgotPassword(data),
        onSuccess: (response: any) => {
            toast.success(response.data?.message || 'OTP sent to your email');
            navigate('/reset-password', { state: { email: forgotMutation.variables?.email } });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        }
    });

    const onSubmit = (data: ForgotForm) => {
        forgotMutation.mutate(data);
    };

    return (
        <section className="min-h-screen flex items-center justify-center relative bg-white overflow-hidden">
            {/* Background Decoration matching Web Panel */}
            <div className="absolute top-0 left-0 w-full h-[227px] bg-[linear-gradient(90deg,#FBF7FD_0%,#EBDDF7_100%)]"></div>

            <div className="w-full max-w-[500px] relative z-10 px-4">
                <div className="bg-white rounded-[8px] shadow-[0px_1px_3px_rgba(0,0,0,0.25)] border border-slate-100 overflow-hidden relative">
                    {forgotMutation.isPending && (
                        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                            <Loader text="Sending OTP..." />
                        </div>
                    )}
                    {/* Header matching Web branding */}
                    <div className="text-center p-8 pb-10 bg-[var(--theme-color-primary-shade-900)] relative">
                        <button
                            onClick={() => navigate('/login')}
                            className="absolute left-8 top-8 text-[11px] font-['AeonikMedium'] text-white/70 hover:text-white flex items-center gap-1 uppercase tracking-widest no-underline bg-transparent border-none cursor-pointer transition-colors"
                        >
                            <ChevronLeft size={16} /> Back
                        </button>
                        <div className="flex justify-center mb-4">
                            <img src="/images/logo-icon.svg" alt="logo" className="w-[82px]" />
                        </div>
                        <div className='flex flex-col gap-[5px]'>
                            <h2 className="headings-web-h4-headline text-white mb-2">Forgot Password</h2>
                            <p className="body-text-body-2 !text-white opacity-90">Enter your email to reset password</p>
                        </div>
                    </div>

                    <div className="p-8 md:p-10">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                            <div className="form-group">
                                <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#9146C1] transition-colors">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        {...register("email", {
                                            required: "Email is required",
                                            maxLength: { value: 50, message: "Email cannot exceed 50 characters" },
                                            pattern: {
                                                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                                                message: "Invalid email address"
                                            }
                                        })}
                                        type="email"
                                        className={`form-control !pl-14 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                                        placeholder="name@business.com"
                                        maxLength={50}
                                        onInput={(e) => {
                                            e.currentTarget.value = e.currentTarget.value.trim();
                                        }}
                                    />
                                </div>
                                {errors.email && <p className="form-error">{errors.email.message}</p>}
                            </div>

                            <button
                                type="submit"
                                className="w-full btn-medical"
                            >
                                Send Reset Link
                                <ArrowRight size={18} className="ml-2" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ForgotPassword;
