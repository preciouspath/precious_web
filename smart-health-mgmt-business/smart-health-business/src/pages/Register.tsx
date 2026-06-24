"use client";

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { register as registerApi } from '../api/authApi';
import { toast } from 'react-toastify';
import Loader from '../components/common/Loader';
import { Upload, FileText, ChevronLeft, User, Mail, MapPin, Briefcase, Lock, Eye, EyeOff } from 'lucide-react';
import PhoneInput, { parsePhoneNumber, isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

type RegisterForm = {
    businessName: string;
    ownerName: string;
    email: string;
    mobileNumber: string;
    countryCode: string;
    businessAddress: string;
    businessLicense: FileList;
    password?: string;
};

const Register: React.FC = () => {
    const { register, handleSubmit, watch, control, formState: { errors } } = useForm<RegisterForm>();
    const navigate = useNavigate();
    const [fileName, setFileName] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const licenseFile = watch('businessLicense');

    React.useEffect(() => {
        if (licenseFile && licenseFile.length > 0) {
            setFileName(licenseFile[0].name);
        }
    }, [licenseFile]);

    const mutation = useMutation({
        mutationFn: (formData: FormData) => registerApi(formData),
        onSuccess: (response: any) => {
            toast.success(response.data?.message || 'Registration successful! Please verify OTP.');
            navigate('/otp', {
                state: {
                    email: watch('email'),
                    mobile: watch('mobileNumber'),
                    from: 'register'
                }
            });
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || 'Registration failed';
            toast.error(msg);
        }
    });

    const onSubmit = (data: RegisterForm) => {
        const formData = new FormData();

        formData.append('businessName', data.businessName);
        formData.append('ownerName', data.ownerName);
        formData.append('email', data.email);

        let mobileNumber = data.mobileNumber;
        let countryCode = '+1'; // Default

        const parsed = parsePhoneNumber(data.mobileNumber);
        if (parsed) {
            countryCode = `+${parsed.countryCallingCode}`;
            mobileNumber = parsed.nationalNumber;
        }

        formData.append('mobileNumber', mobileNumber);
        formData.append('countryCode', countryCode);
        formData.append('businessAddress', data.businessAddress);

        if (data.businessLicense?.[0]) {
            formData.append('businessLicense', data.businessLicense[0]);
        }

        if (data.password) {
            formData.append('password', data.password);
        }

        mutation.mutate(formData);
    };

    const isLoading = mutation.isPending;

    return (
        <section className="min-h-screen flex items-center justify-center relative bg-white overflow-hidden py-20">
            <div className="absolute top-0 left-0 w-full h-[227px] bg-[linear-gradient(90deg,#FBF7FD_0%,#EBDDF7_100%)]"></div>

            <div className="w-full max-w-[700px] relative z-10 px-4">
                <div className="bg-white rounded-[8px] shadow-[0px_1px_3px_rgba(0,0,0,0.25)] border border-slate-100 overflow-hidden relative">
                    {isLoading && (
                        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                            <Loader text="Registering your business..." />
                        </div>
                    )}

                    <div className="text-center p-8 pb-10 bg-[var(--theme-color-primary-shade-900)] relative">
                        <Link to="/login" className="absolute left-8 top-8 text-[11px] font-['AeonikMedium'] text-white/70 hover:text-white flex items-center gap-1 uppercase tracking-widest no-underline transition-colors">
                            <ChevronLeft size={16} />
                            Back
                        </Link>
                        <div className="flex justify-center mb-4">
                            <img src="/images/logo-icon.svg" alt="logo" className="w-[82px]" />
                        </div>
                        <div className='flex flex-col gap-[5px]'>
                            <h2 className="headings-web-h4-headline text-white mb-2">Business Registration</h2>
                            <p className="body-text-body-2 !text-white opacity-90">Create your account to manage clinics and campaigns</p>
                        </div>
                    </div>

                    <div className="p-8 md:p-10 pt-8">
                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>

                            {/* Business Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                                <div className="form-group">
                                    <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Business Name*</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#9146C1] transition-colors">
                                            <Briefcase size={18} />
                                        </div>
                                        <input
                                            {...register('businessName', {
                                                required: 'Business name is required',
                                                minLength: { value: 3, message: 'Must be at least 3 characters' },
                                                maxLength: { value: 50, message: 'Must be less than 50 characters' },
                                                validate: (value) => !!value.trim() || "Business name cannot be empty"
                                            })}
                                            placeholder="e.g. Health Center"
                                            className={`form-control !pl-14 ${errors.businessName ? 'border-red-500 focus:border-red-500' : ''}`}
                                            maxLength={50}
                                        />
                                    </div>
                                    {errors.businessName && <p className="form-error">{errors.businessName.message as string}</p>}
                                </div>

                                <div className="form-group">
                                    <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Owner Name*</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#9146C1] transition-colors">
                                            <User size={18} />
                                        </div>
                                        <input
                                            {...register('ownerName', {
                                                required: 'Owner name is required',
                                                minLength: { value: 3, message: 'Must be at least 3 characters' },
                                                maxLength: { value: 50, message: 'Must be less than 50 characters' },
                                                pattern: { value: /^[a-zA-Z\s.]+$/, message: 'Only alphabets, spaces and dots allowed' },
                                                validate: (value) => !!value.trim() || "Owner name cannot be empty"
                                            })}
                                            placeholder="Full Legal Name"
                                            className={`form-control !pl-14 ${errors.ownerName ? 'border-red-500 focus:border-red-500' : ''}`}
                                            maxLength={50}
                                        />
                                    </div>
                                    {errors.ownerName && <p className="form-error">{errors.ownerName.message as string}</p>}
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                                <div className="form-group">
                                    <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Email Address*</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#9146C1] transition-colors">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            {...register('email', {
                                                required: 'Email is required',
                                                pattern: {
                                                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                                                    message: "Invalid email address"
                                                },
                                                maxLength: { value: 50, message: "Email cannot exceed 50 characters" }
                                            })}
                                            type="email"
                                            placeholder="name@business.com"
                                            className={`form-control !pl-14 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                                            maxLength={50}
                                            onInput={(e) => {
                                                e.currentTarget.value = e.currentTarget.value.trim();
                                            }}
                                        />
                                    </div>
                                    {errors.email && <p className="form-error">{errors.email.message as string}</p>}
                                </div>

                                <div className="form-group">
                                    <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Mobile Number*</label>
                                    <div className={`form-control phone-field-wrapper !h-[48px] ${errors.mobileNumber ? 'border-red-500' : ''}`}>
                                        <Controller
                                            name="mobileNumber"
                                            control={control}
                                            rules={{
                                                required: "Mobile number is required",
                                                validate: (value) => (value && isValidPhoneNumber(value)) || "Enter a valid mobile number"
                                            }}
                                            render={({ field: { onChange, value } }) => (
                                                <PhoneInput
                                                    international
                                                    defaultCountry="US"
                                                    value={value}
                                                    onChange={onChange}
                                                    placeholder="Enter mobile number"
                                                />
                                            )}
                                        />
                                    </div>
                                    {errors.mobileNumber && <p className="form-error">{errors.mobileNumber.message as string}</p>}
                                </div>
                            </div>

                            {/* Business Address */}
                            <div className="form-group">
                                <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Business Address*</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-4 pt-0.5 text-slate-300 group-focus-within:text-[#9146C1]" size={16} />
                                    <textarea
                                        {...register('businessAddress', {
                                            required: 'Business address is required',
                                            maxLength: { value: 200, message: 'Address must be less than 200 characters' },
                                            validate: (value) => !!value.trim() || "Address cannot be empty"
                                        })}
                                        placeholder="Full physical address"
                                        className={`form-control !pl-14 h-auto min-h-[100px] py-4 ${errors.businessAddress ? 'border-red-500 focus:border-red-500' : ''}`}
                                        maxLength={200}
                                    />
                                </div>
                                {errors.businessAddress && <p className="form-error">{errors.businessAddress.message as string}</p>}
                            </div>

                            {/* Password */}
                            <div className="form-group">
                                <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Password*</label>
                                <div className="relative group">
                                    <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#9146C1] transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        {...register('password', {
                                            required: 'Password is required',
                                            minLength: {
                                                value: 8,
                                                message: "Password must be at least 8 characters"
                                            },
                                            maxLength: {
                                                value: 32,
                                                message: "Password cannot exceed 32 characters"
                                            },
                                            pattern: {
                                                value: /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+$/,
                                                message: "The password must contain a combination of characters along with digit and special character"
                                            },
                                            validate: (value) => !value || !value.includes(" ") || "Password cannot contain spaces"
                                        })}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create password"
                                        className={`form-control !pl-14 pr-12 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                                        maxLength={32}
                                        onInput={(e) => {
                                            e.currentTarget.value = e.currentTarget.value.replace(/\s/g, '');
                                        }}
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

                            {/* License Upload */}
                            <div className="space-y-2">
                                <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Upload Business License* (PDF or Image)</label>
                                <div className="relative border-2 border-dashed border-slate-100 rounded-lg p-8 text-center bg-slate-50/50 group transition-all hover:bg-purple-50/30 hover:border-[#9146C1] cursor-pointer">
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept=".pdf,image/*"
                                        {...register('businessLicense', { required: 'Business license is required' })}
                                    />
                                    <div className="flex flex-col items-center">
                                        {fileName ? (
                                            <>
                                                <FileText size={36} className="text-[#9146C1] mb-3" />
                                                <p className="text-sm font-['AeonikMedium'] text-slate-800">{fileName}</p>
                                                <span className="text-xs font-['AeonikMedium'] text-slate-400 mt-2 uppercase tracking-widest italic">Click to change</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={36} className="text-slate-200 group-hover:text-[#9146C1] mb-3 transition-colors" />
                                                <p className="text-sm font-['AeonikMedium'] text-slate-400 group-hover:text-[#9146C1]">Click to upload document</p>
                                                <span className="text-[10px] font-['AeonikMedium'] text-slate-300 uppercase tracking-widest mt-2">Max 5MB</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {errors.businessLicense && <p className="form-error">{errors.businessLicense.message}</p>}
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="w-full btn-medical"
                                >
                                    Register Now
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="body-text-body-2 text-slate-500">
                                Already have an account? <Link to="/login" className="text-[#9146C1] font-['AeonikMedium'] hover:underline underline-offset-4">Login here</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Register;