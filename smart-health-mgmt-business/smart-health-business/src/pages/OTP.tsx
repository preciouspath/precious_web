"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { verifyOtp as verifyOtpApi, resendOtp as resendOtpApi } from '../api/authApi';
import { toast } from 'react-toastify';
import Loader from '../components/common/Loader.tsx';
import { ArrowRight, RefreshCw, ChevronLeft } from 'lucide-react';
import useAuthStore from '../store/authStore';

const OTP: React.FC = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(30);

    const email = state?.email;
    const mobile = state?.mobile;
    const from = state?.from;

    useEffect(() => {
        if (!email && !mobile) {
            navigate('/login');
            return;
        }
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [email, mobile, navigate]);

    const verifyMutation = useMutation({
        mutationFn: (data: { email?: string; mobile?: string; otp: string }) => verifyOtpApi(data),
        onSuccess: (response: any) => {
            const { accessToken, user } = response.data.data;
            toast.success(response.data?.message || 'Verification successful');

            if (accessToken && user) {
                useAuthStore.getState().login(user, accessToken);
            }

            if (from === 'register') {
                navigate('/login');
            } else {
                navigate('/dashboard');
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Invalid OTP');
        }
    });

    const resendMutation = useMutation({
        mutationFn: (data: { email?: string; mobile?: string }) => resendOtpApi(data),
        onSuccess: () => {
            toast.success('OTP resent successfully');
            setTimer(30);
            setOtp(['', '', '', '', '', '']);

        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to resend OTP');
        }
    });

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // Only allow digits
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const otpValue = otp.join('');
        if (otpValue.length !== 6) {
            toast.error('Please enter complete OTP');
            return;
        }
        verifyMutation.mutate({
            email,
            mobile: !email ? mobile : undefined,
            otp: otpValue
        });
    };

    return (
        <section className="min-h-screen flex items-center justify-center relative bg-white overflow-hidden">
            {/* Background Decoration matching Web Panel */}
            <div className="absolute top-0 left-0 w-full h-[227px] bg-[linear-gradient(90deg,#FBF7FD_0%,#EBDDF7_100%)]"></div>

            <div className="w-full max-w-[500px] relative z-10 px-4">
                <div className="bg-white rounded-[8px] shadow-[0px_1px_3px_rgba(0,0,0,0.25)] border border-slate-100 overflow-hidden relative">
                    {verifyMutation.isPending && (
                        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                            <Loader text="Verifying OTP..." />
                        </div>
                    )}

                    {/* Header matching Web branding */}
                    <div className="text-center p-8 pb-10 bg-[var(--theme-color-primary-shade-900)] relative">
                        <button
                            onClick={() => navigate(-1)}
                            className="absolute left-8 top-8 text-[11px] font-['AeonikMedium'] text-white/70 hover:text-white flex items-center gap-1 uppercase tracking-widest no-underline bg-transparent border-none cursor-pointer transition-colors"
                        >
                            <ChevronLeft size={16} /> Back
                        </button>
                        <div className="flex justify-center mb-4">
                            <img src="/images/logo-icon.svg" alt="logo" className="w-[82px]" />
                        </div>
                        <div className='flex flex-col gap-[5px]'>
                            <h2 className="headings-web-h4-headline text-white mb-2">OTP Verification</h2>
                            <p className="body-text-body-2 !text-white opacity-90">Enter the code sent to your email</p>
                            <p className="text-sm font-['AeonikBold'] !text-white mt-1">{email || mobile}</p>
                        </div>
                    </div>

                    <div className="p-8 md:p-10">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="flex justify-between gap-2">
                                {otp.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        id={`otp-${idx}`}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(idx, e)}
                                        className="w-full h-14 text-center text-xl font-['AeonikBold'] text-[#9146C1] bg-slate-50 border border-slate-100 rounded-lg focus:ring-4 focus:ring-purple-50/50 outline-none transition-all"
                                    />
                                ))}
                            </div>

                            <button
                                type="submit"
                                className="w-full btn-medical"
                            >
                                Verify Now
                                <ArrowRight size={18} className="ml-2" />
                            </button>
                        </form>

                        <div className="mt-10 text-center">
                            {timer > 0 ? (
                                <p className="body-text-body-2 text-slate-400">
                                    Resend in <span className="text-[#9146C1] font-['AeonikMedium']">{timer}s</span>
                                </p>
                            ) : (
                                <button
                                    onClick={() => resendMutation.mutate({ email, mobile: !email ? mobile : undefined })}
                                    disabled={resendMutation.isPending}
                                    className="text-[11px] font-['AeonikBold'] text-[#9146C1] uppercase tracking-widest hover:underline flex items-center gap-2 mx-auto bg-transparent border-none cursor-pointer"
                                >
                                    <RefreshCw size={14} className={resendMutation.isPending ? 'animate-spin' : ''} />
                                    Resend Code
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default OTP;
