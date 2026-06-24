import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import { Eye, EyeOff } from 'lucide-react';

type ResetPasswordForm = {
  newPassword: string;
  confirmPassword: string;
};

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  // UserId should be stored in localStorage after OTP verification
  const userId = localStorage.getItem('userId');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    mode: 'onSubmit',
  });

  const resetMutation = useMutation({
    mutationFn: (data: { userId: string; newPassword: string }) =>
      axiosClient.post('/reset-password', data).then(res => res.data),
    onSuccess: () => {
      toast.success("Password reset successfully!");
      localStorage.removeItem('userId'); // Clear after reset
      navigate('/login');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Reset failed";
      toast.error(msg);
    }
  });

  const onSubmit = (data: ResetPasswordForm) => {
    if (!userId) {
      toast.error("Session expired. Please try forgot password again.");
      navigate('/forgot-password');
      return;
    }
    resetMutation.mutate({ userId, newPassword: data.newPassword });
  };

  const newPassword = watch('newPassword');

  return (
    <section className="section-padding flex items-center justify-center relative">
      <div className="absolute top-0 left-0 w-full h-[227px] bg-[linear-gradient(90deg,#FBF7FD_0%,#EBDDF7_100%)]"></div>
      <div className="container">
        <div className="!max-w-[500px] w-full p-0 relative z-10 mx-auto">
          <div className="bg-white rounded-[8px] shadow-[0px_1px_3px_rgba(0,0,0,0.25)] overflow-hidden">
            {/* Header */}
            <div className="text-center p-8 pb-10 bg-[var(--theme-color-primary-shade-900)]">
              <div className="flex justify-center mb-4">
                <img src="/images/password.svg" alt="Logo" className="w-[82px]" />
              </div>
              <div className="flex flex-col gap-[5px]">
                <h2 className="headings-web-h4-headline text-white mb-2">
                  Reset your password
                </h2>
                <p className="body-text-body-2 !text-white">
                  Enter your new password
                </p>
              </div>
            </div>

            <div className="p-6 md:p-8 pt-6">
              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>

                <div className="form-group">
                  <label htmlFor="newPassword" title='New Password' className="body-text-body-2 medium">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNew ? "text" : "password"}
                      placeholder="Enter new password"
                      className={`form-control ${errors.newPassword ? 'border-red-500' : ''}`}
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
                      maxLength={32}
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(/\s/g, '');
                      }}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      onClick={() => setShowNew(!showNew)}
                    >
                      {showNew ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="!text-red-500 text-sm mt-1">
                      {errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" title='Confirm new password' className="body-text-body-2 medium">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Enter confirm new password"
                      className={`form-control ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        maxLength: { value: 32, message: 'Password cannot exceed 32 characters' },
                        validate: (value) =>
                          value === newPassword || 'Passwords do not match',
                      })}
                      maxLength={32}
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(/\s/g, '');
                      }}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="!text-red-500 text-sm mt-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button type="submit" className="w-full btn" disabled={resetMutation.isPending}>
                    {resetMutation.isPending ? "Resetting..." : "Reset Password"}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResetPassword;
