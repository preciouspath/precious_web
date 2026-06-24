import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { changePassword } from '../api/authApi';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';

const ChangePassword: React.FC = () => {
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: {
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
        }
    });

    const mutation = useMutation({
        mutationFn: changePassword,
        onSuccess: () => {
            toast.success("Password updated successfully!");
            reset();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update password");
        }
    });

    const onSubmit = (data: any) => {
        mutation.mutate({
            oldPassword: data.oldPassword,
            newPassword: data.newPassword,
        });
    };

    const newPassword = watch('newPassword');

    return (
        <section className="py-10 lg:py-18">
            <div className="container">
                <div className="bg-white rounded-[15px] shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-center p-[15px] border-b border-[#F1F5F9]">
                        <h1 className="headings-web-h4-headline bold text-[#374151]">
                            Change Password
                        </h1>
                    </div>

                    {/* Form */}
                    <div className="p-[15px] md:p-[20px]">
                        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[20px]">
                                <div className="form-group relative">
                                    <label className="body-text-body-2 medium mb-1">Old Password</label>
                                    <div className="relative">
                                        <input
                                            type={showOld ? "text" : "password"}
                                            className={`form-control ${errors.oldPassword ? 'border-red-500' : ''}`}
                                            placeholder="Enter old password"
                                            {...register('oldPassword', { required: 'Old password is required' })}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            onClick={() => setShowOld(!showOld)}
                                        >
                                            {showOld ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>
                                    {errors.oldPassword && <p className="!text-red-500 text-xs mt-1">{errors.oldPassword.message}</p>}
                                </div>

                                <div className="form-group relative">
                                    <label className="body-text-body-2 medium mb-1">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showNew ? "text" : "password"}
                                            className={`form-control ${errors.newPassword ? 'border-red-500' : ''}`}
                                            placeholder="Enter new password"
                                            {...register('newPassword', {
                                                required: 'New password is required',
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
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            onClick={() => setShowNew(!showNew)}
                                        >
                                            {showNew ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>
                                    {errors.newPassword && <p className="!text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
                                </div>

                                <div className="form-group relative md:col-span-1">
                                    <label className="body-text-body-2 medium mb-1">Confirm New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            className={`form-control ${errors.confirmPassword ? 'border-red-500' : ''}`}
                                            placeholder="Re-enter new password"
                                            {...register('confirmPassword', {
                                                required: 'Please confirm your password',
                                                validate: val => val === newPassword || "Passwords do not match"
                                            })}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                        >
                                            {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && <p className="!text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                                </div>
                            </div>

                            {/* Action */}
                            <div className="mt-4">
                                <button
                                    type="submit"
                                    className="btn min-w-[180px]"
                                    disabled={mutation.isPending}
                                >
                                    {mutation.isPending ? "Updating..." : "Submit"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ChangePassword;
