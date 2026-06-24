"use client";

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { login as loginApi, sendOtp as sendOtpApi } from '../api/authApi';
import { toast } from 'react-toastify';
import Loader from '../components/common/Loader';
import useAuthStore from '../store/authStore';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

type LoginForm = {
    email?: string;
    mobile?: string;
    password?: string;
};

const Login: React.FC = () => {
    const [loginMethod, setLoginMethod] = useState<'email' | 'mobile'>('email');
    const [showPassword, setShowPassword] = useState(false);
    const [countryDialCode, setCountryDialCode] = useState('+91'); // Added state for dial code

    const { register, handleSubmit, control, formState: { errors } } = useForm<LoginForm>({
        mode: 'onBlur'
    });

    const navigate = useNavigate();
    const { login: setUser } = useAuthStore();

    const loginMutation = useMutation({
        mutationFn: (data: { email: string; password: string }) => loginApi(data),
        onSuccess: (response: any) => {
            const { accessToken, user } = response.data.data;
            setUser(user, accessToken);
            toast.success('Login successful');
            navigate('/dashboard');
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || 'Invalid credentials';
            toast.error(msg);
        }
    });

    const sendOtpMutation = useMutation({
        mutationFn: (data: { mobile: string }) => sendOtpApi(data),
        onSuccess: (response: any, variables: { mobile: string }) => {
            toast.success(response.data?.message || 'OTP sent successfully');
            navigate('/otp', { state: { mobile: response.data?.mobile || variables.mobile, from: 'login' } });
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || 'Failed to send OTP';
            toast.error(msg);
        }
    });

    const onSubmit = async (data: LoginForm) => {
        if (loginMethod === 'mobile') {
            if (!data.mobile) return;

            // Updated national number extraction logic matching Register component
            const dialCode = countryDialCode;
            const fullPhone = data.mobile.replace(/\s/g, '');
            const nationalNumber = fullPhone.startsWith(dialCode)
                ? fullPhone.slice(dialCode.length)
                : fullPhone.replace(/^\+\d{1,4}/, '');

            sendOtpMutation.mutate({ mobile: nationalNumber });
        } else {
            if (!data.email || !data.password) return;
            loginMutation.mutate({ email: data.email, password: data.password });
        }
    };

    const isLoading = loginMutation.isPending || sendOtpMutation.isPending;

    return (
        <section className="min-h-screen flex items-center justify-center relative bg-white overflow-hidden">
            {/* Background Decoration matching Web Panel */}
            <div className="absolute top-0 left-0 w-full h-[227px] bg-[linear-gradient(90deg,#FBF7FD_0%,#EBDDF7_100%)]"></div>

            <div className="w-full max-w-[500px] relative z-10 px-4">
                <div className="bg-white rounded-[8px] shadow-[0px_1px_3px_rgba(0,0,0,0.25)] border border-slate-100 overflow-hidden relative">
                    {isLoading && (
                        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                            <Loader text={loginMethod === 'mobile' ? "Sending OTP..." : "Logging in..."} />
                        </div>
                    )}

                    {/* Card Header matching Web Panel */}
                    <div className="text-center p-8 pb-10 bg-[var(--theme-color-primary-shade-900)]">
                        <div className="flex justify-center mb-4">
                            <img src="/images/logo-icon.svg" alt="logo" className="w-[82px]" />
                        </div>
                        <div className='flex flex-col gap-[5px]'>
                            <h2 className="headings-web-h4-headline text-white mb-2">Business Login</h2>
                            <p className="body-text-body-2 !text-white opacity-90">Manage your clinics and campaigns</p>
                        </div>
                    </div>

                    <div className="p-6 md:p-8 pt-6">
                        {/* Tabs matching Web Panel style */}
                        <div className="flex bg-[var(--theme-color-primary-shade-100)] p-[4px] rounded-full mb-8">
                            <button
                                type="button"
                                onClick={() => setLoginMethod('email')}
                                className={`flex-1 py-2.5 text-center text-[14px] font-['AeonikMedium'] rounded-full transition-all duration-300 ${loginMethod === 'email' ? 'bg-[#9146C1] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Email Login
                            </button>
                            <button
                                type="button"
                                onClick={() => setLoginMethod('mobile')}
                                className={`flex-1 py-2.5 text-center text-[14px] font-['AeonikMedium'] rounded-full transition-all duration-300 ${loginMethod === 'mobile' ? 'bg-[#9146C1] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Mobile Login
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                            {loginMethod === 'email' ? (
                                <>
                                    <div className="form-group" key="email-group">
                                        <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Email Address</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#9146C1] transition-colors">
                                                <Mail size={18} />
                                            </div>
                                            <input
                                                key="email-input"
                                                {...register("email", {
                                                    required: "Email is required",
                                                    maxLength: { value: 50, message: "Email cannot exceed 50 characters" },
                                                    pattern: {
                                                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                                                        message: "Invalid email address"
                                                    }
                                                })}
                                                type="email"
                                                placeholder="name@business.com"
                                                className={`form-control !pl-14 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                                            />
                                        </div>
                                        {errors.email && <p className="form-error">{errors.email.message as string}</p>}
                                    </div>

                                    <div className="form-group" key="password-group">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Password</label>
                                            <Link to="/forgot-password" className="text-xs text-[#9146C1] font-['AeonikMedium'] hover:underline">Forgot password?</Link>
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#9146C1] transition-colors">
                                                <Lock size={18} />
                                            </div>
                                            <input
                                                {...register('password', {
                                                    required: 'Password is required'
                                                })}
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter password"
                                                className={`form-control !pl-14 pr-12 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 inset-y-0 flex items-center text-slate-300 hover:text-[#9146C1] transition-colors bg-transparent border-none cursor-pointer"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="form-error">{errors.password.message as string}</p>}
                                    </div>
                                </>
                            ) : (
                                <div className="form-group" key="mobile-group">
                                    <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Mobile Number</label>

                                    {/* Phone input styles perfectly matching Register */}
                                    <style>{`
                                        .phone-input-wrapper .react-international-phone-input-container {
                                            border: none !important;
                                            box-shadow: none !important;
                                            background: transparent !important;
                                            height: 100% !important;
                                            width: 100% !important;
                                            display: flex !important;
                                            align-items: center !important;
                                        }
                                        .phone-input-wrapper .react-international-phone-input {
                                            border: none !important;
                                            outline: none !important;
                                            box-shadow: none !important;
                                            background: transparent !important;
                                            height: 100% !important;
                                            flex: 1 !important;
                                            width: 100% !important;
                                            font-size: 14px !important;
                                            color: rgb(15 23 42) !important;
                                            padding-left: 8px !important;
                                            font-family: 'AeonikRegular', sans-serif !important;
                                        }
                                        .phone-input-wrapper .react-international-phone-input::placeholder {
                                            color: rgb(148 163 184) !important;
                                        }
                                        .phone-input-wrapper .react-international-phone-country-selector-button {
                                            border: none !important;
                                            background: transparent !important;
                                            padding: 0 8px !important;
                                            height: 100% !important;
                                        }
                                        .phone-input-wrapper .react-international-phone-country-selector-button:focus {
                                            outline: none !important;
                                            box-shadow: none !important;
                                        }
                                    `}</style>

                                    <div className={`phone-input-wrapper flex items-center h-[48px] w-full rounded-[8px] border bg-white transition-colors
                                        ${errors.mobile
                                            ? 'border-red-500'
                                            : 'border-slate-200 focus-within:border-[#9146C1]'
                                        }`}
                                    >
                                        <Controller
                                            name="mobile"
                                            control={control}
                                            rules={{
                                                required: "Mobile number is required",
                                                validate: (value: string | undefined) => {
                                                    const cleaned = value?.replace(/\s/g, '') ?? '';
                                                    const national = cleaned.startsWith(countryDialCode)
                                                        ? cleaned.slice(countryDialCode.length)
                                                        : cleaned.replace(/^\+\d{1,4}/, '');
                                                    return (national.length >= 7 && national.length <= 15)
                                                        || "Enter a valid mobile number";
                                                }
                                            }}
                                            render={({ field: { onChange, value } }) => (
                                                <PhoneInput
                                                    defaultCountry="in"
                                                    value={value}
                                                    onChange={(phone, meta) => {
                                                        onChange(phone);
                                                        if (meta?.country?.dialCode) {
                                                            setCountryDialCode('+' + meta.country.dialCode);
                                                        }
                                                    }}
                                                    inputClassName="placeholder:text-slate-400 font-['AeonikRegular']"
                                                    inputProps={{
                                                        placeholder: "Enter mobile number",
                                                        maxLength: 20
                                                    }}
                                                />
                                            )}
                                        />
                                    </div>
                                    {errors.mobile && <p className="form-error">{errors.mobile.message as string}</p>}
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="w-full btn-medical flex items-center justify-center gap-2"
                                >
                                    {loginMethod === 'email' ? 'Login to Dashboard' : 'Send OTP'}
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="body-text-body-2 text-slate-500">
                                Don't have an account? <Link to="/register" className="text-[#9146C1] font-['AeonikMedium'] hover:underline underline-offset-4">Register here</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Login;