import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login as loginApi, sendOtp as sendOtpApi } from '../api/authApi';
import { toast } from 'react-toastify';
import Loader from '../components/common/Loader';
import useAuthStore from '../store/authStore';
import { Eye, EyeOff } from 'lucide-react';

// Phone library imports
import PhoneInput, { parsePhoneNumber, isValidPhoneNumber } from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en';
import 'react-phone-number-input/style.css';

type LoginForm = {
    email?: string;
    mobileNumber?: string;
    password?: string;
};

const Login: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'email' | 'mobile'>('email');
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, control, formState: { errors } } = useForm<LoginForm>({
        mode: 'onBlur'
    });
    const navigate = useNavigate();
    const { login: setUser } = useAuthStore();
    const queryClient = useQueryClient();

    // Login Mutation (Email)
    const loginMutation = useMutation({
        mutationFn: (data: { email: string; password: string }) => loginApi(data),
        onSuccess: (response: any) => {
            toast.success(response.message || 'Login successful', { toastId: 'login-success' });
            if (response?.data) {
                // Ensure store gets the correct user object and token
                setUser(response.data);

                // Clear query cache to prevent stale data from previous user
                queryClient.clear();
            }
            navigate('/dashboard', { replace: true });
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || 'Login failed';
            toast.error(msg, { toastId: 'login-error' });
        }
    });

    // Send OTP Mutation (Mobile)
    const sendOtpMutation = useMutation({
        mutationFn: (data: { mobileNumber: string; countryCode: string; countryName: string }) => sendOtpApi(data),
        onSuccess: (response: any, variables) => {
            toast.success(response.data?.message || 'OTP sent successfully', { toastId: 'otp-sent' });
            // Pass ALL variables to OTP screen so verifyOtp can also enforce the country code
            navigate('/otp', {
                state: {
                    mobile: variables.mobileNumber,
                    countryCode: variables.countryCode,
                    from: 'login'
                }
            });
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || 'Failed to send OTP';
            toast.error(msg, { toastId: 'otp-error' });
        }
    });

    const onSubmit = async (data: LoginForm) => {
        if (activeTab === 'mobile') {
            if (!data.mobileNumber || !isValidPhoneNumber(data.mobileNumber)) {
                toast.error("Please enter a valid mobile number");
                return;
            }

            const phoneNumber = parsePhoneNumber(data.mobileNumber);
            if (phoneNumber) {
                sendOtpMutation.mutate({
                    mobileNumber: phoneNumber.nationalNumber as string,
                    countryCode: `+${phoneNumber.countryCallingCode}`,
                    countryName: en[phoneNumber.country as keyof typeof en] || "United States"
                });
            }
        } else {
            if (!data.email || !data.password) {
                toast.error("Email and Password are required");
                return;
            }
            loginMutation.mutate({ email: data.email, password: data.password });
        }
    };

    const isLoading = loginMutation.isPending || sendOtpMutation.isPending;

    return (
        <section className="section-padding flex items-center justify-center relative min-h-screen">
            <div className="absolute top-0 left-0 w-full h-[227px] bg-[linear-gradient(90deg,#FBF7FD_0%,#EBDDF7_100%)]"></div>
            <div className="container relative z-10">
                <div className='!max-w-[500px] w-full p-0 relative mx-auto'>
                    <div className="bg-white rounded-[8px] shadow-[0px_1px_3px_rgba(0,0,0,0.25)] overflow-hidden relative border border-slate-100">

                        {isLoading && (
                            <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                <Loader text={activeTab === 'mobile' ? "Sending OTP..." : "Logging in..."} />
                            </div>
                        )}

                        <div className="text-center p-8 pb-10 bg-[var(--theme-color-primary-shade-900)]">
                            <div className="flex justify-center mb-4">
                                <img src="/images/logo-icon.svg" alt="Logo" className="w-[82px]" />
                            </div>
                            <div className='flex flex-col gap-[5px]'>
                                <h2 className="headings-web-h4-headline text-white mb-2">Login</h2>
                                <p className="body-text-body-2 !text-white opacity-90">Welcome back! Continue your care journey.</p>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 pt-6">
                            <div className="mb-6">
                                <Link to="/login" className="text-[13px] font-['AeonikMedium'] text-slate-500 hover:text-[#9146C1] transition-colors">
                                    Back to portal selection
                                </Link>
                            </div>
                            {/* Method Switcher */}
                            <div className="flex bg-[var(--theme-color-primary-shade-100)] p-[4px] rounded-full mb-8">
                                <button
                                    type="button"
                                    className={`flex-1 py-2.5 text-center text-[14px] font-['AeonikMedium'] rounded-full transition-all duration-300 ${activeTab === 'email' ? 'bg-[#9146C1] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    onClick={() => setActiveTab('email')}
                                >
                                    Email
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 py-2.5 text-center text-[14px] font-['AeonikMedium'] rounded-full transition-all duration-300 ${activeTab === 'mobile' ? 'bg-[#9146C1] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    onClick={() => setActiveTab('mobile')}
                                >
                                    Mobile
                                </button>
                            </div>

                            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
                                {activeTab === 'email' ? (
                                    <div className="form-group">
                                        <label htmlFor="email" className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Email ID</label>
                                        <input
                                            id="email"
                                            type="email"
                                            maxLength={50}
                                            className={`form-control ${errors.email ? 'border-red-500' : ''}`}
                                            placeholder="Enter email ID"
                                            {...register('email', {
                                                required: 'Email is required',
                                                maxLength: { value: 50, message: 'Email cannot exceed 50 characters' },
                                                pattern: {
                                                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                                                    message: 'Invalid email address'
                                                }
                                            })}
                                            onInput={(e) => {
                                                e.currentTarget.value = e.currentTarget.value.trim();
                                            }}
                                        />
                                        {errors.email && <p className="!text-red-500 text-sm mt-1">{errors.email.message}</p>}
                                    </div>
                                ) : (
                                    <div className="form-group">
                                        <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Mobile Number</label>
                                        <Controller
                                            name="mobileNumber"
                                            control={control}
                                            rules={{
                                                required: "Mobile number is required",
                                                validate: (value) => {
                                                    if (!value || !isValidPhoneNumber(value)) {
                                                        return "Invalid mobile number";
                                                    }
                                                    const parsed = parsePhoneNumber(value);
                                                    if (!parsed) return "Invalid mobile number";
                                                    // if (parsed && parsed.nationalNumber.length !== 10) {
                                                    //     return "Mobile number must be 10 digits";
                                                    // }
                                                    return true;
                                                }
                                            }}
                                            render={({ field: { onChange, value } }) => (
                                                <PhoneInput
                                                    international
                                                    defaultCountry="US"
                                                    value={value}
                                                    onChange={onChange}
                                                    className="form-control flex items-center gap-2 !pl-3"
                                                    numberInputProps={{
                                                        className: "bg-transparent border-none outline-none w-full !text-slate-900 placeholder:text-slate-400 focus:ring-0 h-full p-0 text-[14px]",
                                                        placeholder: "Enter mobile number",
                                                        maxLength: 20
                                                    }}
                                                />
                                            )}
                                        />
                                        {errors.mobileNumber && <p className="!text-red-500 text-sm mt-1">{errors.mobileNumber.message as string}</p>}
                                    </div>
                                )}

                                {activeTab === 'email' && (
                                    <div className="form-group">
                                        <div className="flex justify-between items-center mb-1">
                                            <label htmlFor="password" className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Password</label>
                                            <Link to={"/forgot-password"} className="text-[13px] font-['AeonikMedium'] text-[#9146C1] hover:underline">
                                                Forgot Password?
                                            </Link>
                                        </div>
                                        <div className="relative">
                                            <input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                maxLength={32}
                                                className={`form-control ${errors.password ? 'border-red-500' : ''}`}
                                                placeholder="Enter password"
                                                {...register('password', {
                                                    required: 'Password is required',
                                                    maxLength: { value: 32, message: 'Password cannot exceed 32 characters' },
                                                    validate: {
                                                        noSpaces: (v) => !/\s/.test(v || '') || 'Password must not contain spaces',
                                                        minLen: (v) => (v || '').length >= 8 || 'Password must be at least 8 characters long',
                                                        hasUpper: (v) => /[A-Z]/.test(v || '') || 'Password must contain at least one uppercase letter',
                                                        hasLower: (v) => /[a-z]/.test(v || '') || 'Password must contain at least one lowercase letter',
                                                        hasNumber: (v) => /[0-9]/.test(v || '') || 'Password must contain at least one number',
                                                        hasSpecial: (v) => /[@$!%*?&#^()_\-+=]/.test(v || '') || 'Password must contain at least one special character'
                                                    }
                                                })}
                                                onInput={(e) => {
                                                    e.currentTarget.value = e.currentTarget.value.replace(/\s/g, '');
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 border-none bg-transparent cursor-pointer"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="!text-red-500 text-sm mt-1">{errors.password.message}</p>}
                                    </div>
                                )}

                                <div className="pt-2">
                                    <button type="submit" className="w-full btn" disabled={isLoading}>
                                        {isLoading ? 'Processing...' : (activeTab === 'mobile' ? 'Send OTP' : 'Login')}
                                    </button>
                                </div>
                            </form>

                            <div className="text-center mt-6">
                                <p className="body-text-body-2 text-slate-600">
                                    Don't have an account? <Link to="/register" className="font-['AeonikMedium'] text-[#9146C1] hover:underline">Signup</Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Login;
