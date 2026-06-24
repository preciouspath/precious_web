import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { register as registerApi } from '../api/authApi';
import { toast } from 'react-toastify';
import Loader from '../components/common/Loader';
import { Eye, EyeOff } from 'lucide-react';
import PhoneInput, { parsePhoneNumber, isValidPhoneNumber } from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en'; // Needed to get full country names
import 'react-phone-number-input/style.css';

type RegisterForm = {
    fullName: string;
    email?: string;
    mobileNumber?: string;
    password?: string;
    confirmPassword?: string;
    terms: boolean;
};

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'email' | 'mobile'>('email');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        control,
        formState: { errors },
    } = useForm<RegisterForm>({
        mode: 'onSubmit',
        defaultValues: {
            terms: false,
            mobileNumber: ''
        }
    });

    const registerMutation = useMutation({
        mutationFn: (data: any) => registerApi(data),
        onSuccess: (data: any, variables) => {
            toast.success(data.message || 'Registration successful', { toastId: 'reg-success' });
            navigate('/otp', {
                state: {
                    from: 'register',
                    email: variables.email,
                    mobile: variables.mobileNumber // Passing the cleaned mobile number
                }
            });
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || 'Registration failed';
            toast.error(msg, { toastId: 'reg-error' });
        }
    });

    const onSubmit = (data: RegisterForm) => {
        let countryCode = "+1"; // Default
        let countryName = "United States"; // Default
        let mobileNumber = "";

        // If mobile is provided (either in mobile tab or optional email tab)
        if (data.mobileNumber) {
            const parsed = parsePhoneNumber(data.mobileNumber);
            if (parsed) {
                countryCode = `+${parsed.countryCallingCode}`;
                mobileNumber = parsed.nationalNumber;
                // Get full country name from locale file (e.g., "US" -> "United States")
                countryName = en[parsed.country as keyof typeof en] || "United States";
            }
        }

        const payload = {
            fullName: data.fullName,
            email: activeTab === 'email' ? data.email : undefined,
            mobileNumber: mobileNumber || undefined,
            countryCode,
            countryName,
            password: data.password,
            role: "patient"
        };

        registerMutation.mutate(payload);
    };

    const isLoading = registerMutation.isPending;

    return (
        <section className="section-padding flex items-center justify-center relative min-h-screen">
            <div className="absolute top-0 left-0 w-full h-[227px] bg-[linear-gradient(90deg,#FBF7FD_0%,#EBDDF7_100%)]"></div>
            <div className="container relative z-10">
                <div className='!max-w-[500px] w-full p-0 relative mx-auto'>
                    <div className="bg-white rounded-[8px] shadow-[0px_1px_3px_rgba(0,0,0,0.25)] overflow-hidden relative">

                        {isLoading && (
                            <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                <Loader text="Creating Account..." />
                            </div>
                        )}

                        <div className="text-center p-8 pb-10 bg-[var(--theme-color-primary-shade-900)]">
                            <div className="flex justify-center mb-4">
                                <img src="/images/logo-icon.svg" alt="Logo" className="w-[82px]" />
                            </div>
                            <div className='flex flex-col gap-[5px]'>
                                <h2 className="headings-web-h4-headline text-white mb-2">Signup</h2>
                                <p className="body-text-body-2 !text-white">Create a new account</p>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 pt-6">
                            {/* Registration Tabs */}
                            <div className="flex bg-[var(--theme-color-primary-shade-100)] p-[4px] rounded-full mb-6">
                                <button
                                    type="button"
                                    className={`flex-1 py-2.5 text-center text-[14px] medium rounded-full transition-all duration-300 ${activeTab === 'email'
                                        ? 'bg-[#9146C1] text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    onClick={() => setActiveTab('email')}
                                >
                                    Email
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 py-2.5 text-center text-[14px] medium rounded-full transition-all duration-300 ${activeTab === 'mobile'
                                        ? 'bg-[#9146C1] text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    onClick={() => setActiveTab('mobile')}
                                >
                                    Mobile
                                </button>
                            </div>

                            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                                {/* Full Name */}
                                <div className="form-group">
                                    <label htmlFor="fullName" className="body-text-body-2 medium">Full Name</label>
                                    <input
                                        id="fullName"
                                        type="text"
                                        className={`form-control ${errors.fullName ? 'border-red-500' : ''}`}
                                        placeholder="Enter full name"
                                        {...register('fullName', {
                                            required: 'Full name is required',
                                            validate: (value) => !!value.trim() || "Full name cannot be empty",
                                            minLength: { value: 3, message: 'Must be at least 3 characters' },
                                            maxLength: { value: 50, message: 'Full name cannot exceed 50 characters' }
                                        })}
                                        maxLength={50}
                                    />
                                    {errors.fullName && <p className="!text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
                                </div>

                                {activeTab === 'email' ? (
                                    <>
                                        {/* Email Field */}
                                        <div className="form-group">
                                            <label htmlFor="email" className="body-text-body-2 medium">Email Address</label>
                                            <input
                                                id="email"
                                                type="email"
                                                className={`form-control ${errors.email ? 'border-red-500' : ''}`}
                                                placeholder="Enter email address"
                                                {...register('email', {
                                                    required: 'Email is required',
                                                    maxLength: { value: 50, message: 'Email cannot exceed 50 characters' },
                                                    pattern: {
                                                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                                                        message: 'Please enter a valid email address'
                                                    }
                                                })}
                                                maxLength={50}
                                                onInput={(e) => {
                                                    e.currentTarget.value = e.currentTarget.value.trim();
                                                }}
                                            />
                                            {errors.email && <p className="!text-red-500 text-sm mt-1">{errors.email.message}</p>}
                                        </div>

                                        {/* Optional Mobile for Email Tab */}
                                        <div className="form-group">
                                            <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Mobile Number (Optional)</label>
                                            <Controller
                                                name="mobileNumber"
                                                control={control}
                                                rules={{
                                                    validate: (value) => {
                                                        if (!value) return true;
                                                        if (!isValidPhoneNumber(value)) return "Invalid mobile number";
                                                        // const parsed = parsePhoneNumber(value);
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
                                            {errors.mobileNumber && <p className="!text-red-500 text-sm mt-1">{errors.mobileNumber.message}</p>}
                                        </div>
                                    </>
                                ) : (
                                    /* Mobile Tab Field */
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
                                        {errors.mobileNumber && <p className="!text-red-500 text-sm mt-1">{errors.mobileNumber.message}</p>}
                                    </div>
                                )}

                                {/* Password */}
                                <div className="form-group relative">
                                    <label htmlFor="password" className="body-text-body-2 medium">Password</label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
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
                                            maxLength={32}
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

                                {/* Confirm Password */}
                                <div className="form-group relative">
                                    <label htmlFor="confirmPassword" className="body-text-body-2 medium">Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            className={`form-control ${errors.confirmPassword ? 'border-red-500' : ''}`}
                                            placeholder="Confirm password"
                                            {...register('confirmPassword', {
                                                required: 'Please confirm your password',
                                                maxLength: { value: 32, message: 'Maximum length 32 characters' },
                                                validate: (val) => watch('password') === val || "Passwords do not match"
                                            })}
                                            maxLength={32}
                                            onInput={(e) => {
                                                e.currentTarget.value = e.currentTarget.value.replace(/\s/g, '');
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 border-none bg-transparent cursor-pointer"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && <p className="!text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
                                </div>

                                {/* Terms and Conditions */}
                                <div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            id="terms"
                                            type="checkbox"
                                            className="checkbox w-5 h-5 border-gray-300 rounded checked:bg-[#9146C1] checked:border-[#9146C1] [--chkfg:white]"
                                            {...register('terms', { required: 'Terms acceptance is required' })}
                                        />
                                        <label htmlFor="terms" className="body-text-body-2 text-slate-950 cursor-pointer">
                                            I accept the <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-[#9146C1]">Terms & Conditions</a>
                                        </label>
                                    </div>
                                    {errors.terms && <p className="!text-red-500 text-sm mt-1">Acceptance is required</p>}
                                </div>

                                <div className="pt-2">
                                    <button type="submit" className="w-full btn" disabled={isLoading}>
                                        {isLoading ? 'Processing...' : 'Signup'}
                                    </button>
                                </div>
                            </form>

                            <div className="text-center mt-6">
                                <p className="body-text-body-2 text-slate-600">
                                    Already have an account? <Link to="/login" className="font-medium text-[#9146C1]">Login</Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Register;