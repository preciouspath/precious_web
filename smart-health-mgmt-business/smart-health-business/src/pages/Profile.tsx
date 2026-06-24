"use client";

import React, { useRef } from 'react';
import {
    User,
    Mail,
    MapPin,
    Briefcase,
    Camera,
    Shield,
    Key,
    Save,
    Lock,
    Eye,
    EyeOff
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { updateProfile, changePassword, getMe } from '../api/authApi';
import { toast } from 'react-toastify';
import useAuthStore from '../store/authStore';
import Loader from '../components/common/Loader';
import PhoneInput, { parsePhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const Profile: React.FC = () => {
    const [showOldPassword, setShowOldPassword] = React.useState(false);
    const [showNewPassword, setShowNewPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

    const { user, setUser } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const baseUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

    type ProfileForm = {
        businessName: string;
        ownerName: string;
        email: string;
        mobile: string;
        businessAddress: string;
    };

    const { data: profileData, isLoading: isProfileLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: getMe,
        select: (res) => res.data?.data?.user || res.data?.data
    });

    // Determine initial mobile value (construct E.164 if possible)
    const getInitialMobile = (userData: any) => {
        if (!userData) return '';
        if (userData.mobile && userData.countryCode) {
            // If stored separately, combine them for the input
            // Check if countryCode already starts with +
            const code = userData.countryCode.startsWith('+') ? userData.countryCode : `+${userData.countryCode}`;
            return `${code}${userData.mobile}`;
        }
        return userData.mobile || '';
    };

    const { register: registerProfile, handleSubmit: handleSubmitProfile, reset: resetProfile, control, formState: { errors: profileErrors } } = useForm<ProfileForm>({
        defaultValues: {
            businessName: user?.businessName || '',
            ownerName: user?.ownerName || '',
            email: user?.email || '',
            mobile: getInitialMobile(user),
            businessAddress: user?.businessAddress || '',
        }
    });

    // Update form and store when fresh data arrives
    React.useEffect(() => {
        if (profileData) {
            setUser(profileData);
            resetProfile({
                businessName: profileData.businessName || '',
                ownerName: profileData.ownerName || '',
                email: profileData.email || '',
                mobile: getInitialMobile(profileData),
                businessAddress: profileData.businessAddress || '',
            });
        }
    }, [profileData, resetProfile, setUser,]);

    const { register: registerSecurity, handleSubmit: handleSubmitSecurity, reset: resetSecurity, watch: watchSecurity, formState: { errors: securityErrors } } = useForm();

    const profileMutation = useMutation({
        mutationFn: (data: any) => updateProfile(data),
        onSuccess: (response: any) => {
            const updatedUser = response.data.data.user;
            setUser(updatedUser);
            toast.success('Profile updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
    });

    const securityMutation = useMutation({
        mutationFn: (data: any) => changePassword(data),
        onSuccess: () => {
            toast.success('Password updated successfully');
            resetSecurity();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to change password');
        }
    });

    const onProfileSubmit = (data: ProfileForm) => {
        if (!data.mobile) {
            toast.error('Mobile number is required');
            return;
        }

        const formData = new FormData();
        formData.append("businessName", data.businessName);
        formData.append("ownerName", data.ownerName);
        formData.append("businessAddress", data.businessAddress);

        let mobile = data.mobile;
        let countryCode = '+1'; // Default

        const parsed = parsePhoneNumber(data.mobile);
        if (parsed) {
            countryCode = `+${parsed.countryCallingCode}`;
            mobile = parsed.nationalNumber;
        }

        formData.append("mobile", mobile);
        formData.append("countryCode", countryCode);

        profileMutation.mutate(formData);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append("profileImage", file);
            profileMutation.mutate(formData);
        }
    };

    const onSecuritySubmit = (data: any) => {
        securityMutation.mutate(data);
    };

    return (
        <div className="max-w-[1200px] mx-auto font-['AeonikRegular'] relative pb-20">
            {(profileMutation.isPending || securityMutation.isPending || isProfileLoading) && (
                <div className="fixed inset-0 z-[100] bg-white/50 backdrop-blur-sm flex items-center justify-center">
                    <Loader text={isProfileLoading ? "Fetching profile..." : "Processing..."} />
                </div>
            )}
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="headings-web-h4-headline text-slate-900">Business Profile</h1>
                    <p className="body-text-body-2 text-slate-500 mt-1">Manage your account and clinic details</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] p-8 text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-[#9146C1] to-indigo-600 opacity-5 group-hover:opacity-10 transition-opacity"></div>

                        <div className="relative mb-6 inline-block">
                            <div className="w-32 h-32 rounded-lg border-4 border-white shadow-md bg-slate-100 flex items-center justify-center overflow-hidden mx-auto">
                                {user?.profileImage ? (
                                    <img
                                        src={`${baseUrl}${user.profileImage}`}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User size={48} className="text-slate-300" />
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-1 right-1 p-2.5 bg-[#9146C1] text-white rounded-lg shadow-lg hover:scale-110 transition-all border-none cursor-pointer"
                            >
                                <Camera size={18} />
                            </button>
                        </div>

                        <h3 className="headings-web-h5-headline text-slate-900">{user?.businessName || 'Business Name'}</h3>
                        <p className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest mt-2">{user?.kycStatus === 'Approved' ? 'Verified Business' : 'KYC Pending'}</p>

                        <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
                            <div>
                                <h4 className="text-xs font-['AeonikBold'] text-slate-700 mb-3">Business Documents</h4>
                                {user?.businessLicense ? (
                                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Shield size={16} className="text-slate-400" />
                                                <span className="text-xs font-['AeonikMedium'] text-slate-600">Business License</span>
                                            </div>
                                            <span className={`text-[9px] font-['AeonikBold'] uppercase px-2.5 py-1 rounded-full ${user?.kycStatus === 'Approved'
                                                ? 'bg-green-100 text-green-700'
                                                : user?.kycStatus === 'Rejected'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {user?.kycStatus || 'Under Review'}
                                            </span>
                                        </div>
                                        <a
                                            href={`${baseUrl}${user.businessLicense}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-[#9146C1] hover:underline font-['AeonikMedium'] no-underline"
                                        >
                                            View Document →
                                        </a>
                                        {user?.kycStatus === 'Rejected' && (
                                            <div className="pt-2">
                                                <p className="text-xs text-red-600 mb-2 font-['AeonikMedium']">
                                                    {user?.kycRejectionReason || 'Document was rejected. Please upload a valid business license.'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                                        <p className="text-xs text-slate-500 font-['AeonikMedium']">No document uploaded yet</p>
                                    </div>
                                )}

                                <input
                                    type="file"
                                    accept="application/pdf,image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const formData = new FormData();
                                            formData.append("businessLicense", file);
                                            profileMutation.mutate(formData);
                                        }
                                    }}
                                    className="hidden"
                                    id="license-upload"
                                />
                                <label
                                    htmlFor="license-upload"
                                    className="mt-3 w-full btn-medical flex items-center justify-center gap-2 text-center cursor-pointer"
                                >
                                    <Shield size={16} /> {user?.businessLicense ? 'Update License' : 'Upload License'}
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Basic Info */}
                    <div className="bg-white rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] p-8 md:p-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-purple-50 text-[#9146C1] rounded-lg">
                                <User size={20} />
                            </div>
                            <h3 className="headings-web-h6-headline text-slate-900">Personal Information</h3>
                        </div>

                        <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6" noValidate>
                            <div className="form-group">
                                <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Business Name</label>
                                <div className="relative group">
                                    <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#9146C1] transition-colors">
                                        <Briefcase size={18} />
                                    </div>
                                    <input
                                        {...registerProfile("businessName", {
                                            required: "Business name is required",
                                            minLength: { value: 3, message: 'Must be at least 3 characters' },
                                            maxLength: { value: 50, message: 'Must be less than 50 characters' },
                                            validate: (value) => !!value.trim() || "Business name cannot be empty"
                                        })}
                                        className={`form-control !pl-14 ${profileErrors.businessName ? 'border-red-500 focus:border-red-500' : ''}`}
                                        placeholder="Enter your business name"
                                        maxLength={50}
                                    />
                                </div>
                                {profileErrors.businessName && <p className="form-error">{profileErrors.businessName.message as string}</p>}
                            </div>
                            <div className="form-group">
                                <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Owner Name</label>
                                <div className="relative group">
                                    <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#9146C1] transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        {...registerProfile("ownerName", {
                                            required: "Owner name is required",
                                            minLength: { value: 3, message: 'Must be at least 3 characters' },
                                            maxLength: { value: 50, message: 'Must be less than 50 characters' },
                                            pattern: { value: /^[a-zA-Z\s.]+$/, message: 'Only alphabets, spaces and dots allowed' },
                                            validate: (value) => !!value.trim() || "Owner name cannot be empty"
                                        })}
                                        className={`form-control !pl-14 ${profileErrors.ownerName ? 'border-red-500 focus:border-red-500' : ''}`}
                                        placeholder="Enter your full name"
                                        maxLength={50}
                                    />
                                </div>
                                {profileErrors.ownerName && <p className="form-error">{profileErrors.ownerName.message as string}</p>}
                            </div>
                            <div className="form-group">
                                <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#9146C1] transition-colors">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        {...registerProfile("email")}
                                        disabled
                                        placeholder="yourname@business.com"
                                        className="form-control !pl-14 bg-slate-50 opacity-100 text-slate-400 cursor-not-allowed border-slate-200"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Mobile Number</label>
                                <div className="relative group">
                                    <Controller
                                        name="mobile"
                                        control={control}
                                        rules={{
                                            required: "Mobile number is required",
                                            validate: (value) => (value && value.length >= 10) || "Invalid mobile number"
                                        }}
                                        render={({ field: { onChange, value } }) => (
                                            <PhoneInput
                                                international
                                                defaultCountry="US"
                                                value={value}
                                                onChange={onChange}
                                                className={`form-control phone-field-wrapper !h-[48px] ${profileErrors.mobile ? 'border-red-500' : ''}`}
                                                placeholder="Enter mobile number"
                                            />
                                        )}
                                    />
                                </div>
                                {profileErrors.mobile && <p className="form-error">{profileErrors.mobile.message as string}</p>}
                            </div>
                            <div className="form-group md:col-span-2">
                                <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Business Address</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-4 text-slate-300 group-focus-within:text-[#9146C1] transition-colors">
                                        <MapPin size={18} />
                                    </div>
                                    <textarea
                                        {...registerProfile("businessAddress", {
                                            required: "Address is required",
                                            maxLength: { value: 200, message: 'Address must be less than 200 characters' },
                                            validate: (value) => !!value.trim() || "Address cannot be empty"
                                        })}
                                        maxLength={200}
                                        className={`form-control !pl-14 h-32 py-4 ${profileErrors.businessAddress ? 'border-red-500 focus:border-red-500' : ''}`}
                                        placeholder="Enter full physical address"
                                    />
                                </div>
                                {profileErrors.businessAddress && <p className="form-error">{profileErrors.businessAddress.message as string}</p>}
                            </div>
                            <div className="mt-4 flex justify-end md:col-span-2">
                                <button type="submit" className="btn-medical px-10">
                                    <Save size={16} className="mr-2" /> Save Changes
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Security */}
                    <div className="bg-white rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] p-8 md:p-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-rose-50 text-rose-500 rounded-lg">
                                <Shield size={20} />
                            </div>
                            <h3 className="headings-web-h6-headline text-slate-900">Change Password</h3>
                        </div>

                        <form onSubmit={handleSubmitSecurity(onSecuritySubmit)} className="space-y-6" noValidate>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="form-group">
                                    <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Current Password</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#9146C1] transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            {...registerSecurity("oldPassword", { required: "Current password is required" })}
                                            type={showOldPassword ? "text" : "password"}
                                            className={`form-control !pl-14 pr-12 ${securityErrors.oldPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                                            placeholder="Current password"
                                            maxLength={32}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowOldPassword(!showOldPassword)}
                                            className="absolute right-4 inset-y-0 flex items-center text-slate-300 hover:text-[#9146C1] transition-colors bg-transparent border-none cursor-pointer"
                                        >
                                            {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {securityErrors.oldPassword && <p className="form-error">{securityErrors.oldPassword.message as string}</p>}
                                </div>
                                <div className="form-group">
                                    <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">New Password</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#9146C1] transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            {...registerSecurity("newPassword", {
                                                required: "New password is required",
                                                minLength: { value: 8, message: "At least 8 characters" },
                                                maxLength: { value: 32, message: "Max 32 characters" },
                                                pattern: {
                                                    value: /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+$/,
                                                    message: "Use letters, numbers & special chars"
                                                }
                                            })}
                                            type={showNewPassword ? "text" : "password"}
                                            className={`form-control !pl-14 pr-12 ${securityErrors.newPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                                            placeholder="At least 8 characters"
                                            maxLength={32}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-4 inset-y-0 flex items-center text-slate-300 hover:text-[#9146C1] transition-colors bg-transparent border-none cursor-pointer"
                                        >
                                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {securityErrors.newPassword && <p className="form-error">{securityErrors.newPassword.message as string}</p>}
                                </div>
                                <div className="form-group">
                                    <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Confirm Password</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#9146C1] transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            {...registerSecurity("confirmPassword", {
                                                required: "Please confirm your password",
                                                validate: (value) => value === watchSecurity('newPassword') || "Passwords do not match"
                                            })}
                                            type={showConfirmPassword ? "text" : "password"}
                                            className={`form-control !pl-14 pr-12 ${securityErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                                            placeholder="Confirm new password"
                                            maxLength={32}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 inset-y-0 flex items-center text-slate-300 hover:text-[#9146C1] transition-colors bg-transparent border-none cursor-pointer"
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {securityErrors.confirmPassword && <p className="form-error">{securityErrors.confirmPassword.message as string}</p>}
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="submit" className="px-8 py-3 bg-slate-900 text-white rounded-lg text-[12px] font-['AeonikBold'] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 border-none cursor-pointer">
                                    <Key size={16} /> Update Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
