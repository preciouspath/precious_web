import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { verifyOtp as verifyOtpApi, sendOtp } from '../api/authApi';
import { toast } from 'react-toastify';
import Loader from '../components/common/Loader';
import useAuthStore from '../store/authStore';

type OTPForm = {
  otp1: string;
  otp2: string;
  otp3: string;
  otp4: string;
};

const OTP: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const fromFlow = location.state?.from || 'mobile-login';

  // Get email, mobile, and countryCode from state
  const email = location.state?.email;
  const mobileNumber = location.state?.mobile;
  const countryCode = location.state?.countryCode;

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<OTPForm>({
    mode: 'onSubmit',
  });

  const verifyMutation = useMutation({
    mutationFn: (data: any) => verifyOtpApi(data),
    onSuccess: (response: any) => {
      toast.success(response.message || 'OTP Verified successfully', { toastId: 'otp-success' });

      // 1. Set user in store ONLY if NOT in forgot-password flow
      if (response?.data?.user && fromFlow !== 'forgot-password') {
        login(response.data.user);
      }

      // 2. Handle Redirection
      if (fromFlow === 'forgot-password') {
        if (response?.data?.user?._id) {
          localStorage.setItem('userId', response.data.user._id);
        }
        navigate('/reset-password', { state: { email }, replace: true });
      } else {
        const isCompleted = response?.data?.user?.isCompleted;
        if (isCompleted) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/profile-setup', { replace: true });
        }
      }
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'OTP Verification Failed';
      toast.error(msg, { toastId: 'otp-error' });
    }
  });

  const onSubmit = (data: OTPForm) => {
    const otp = `${data.otp1}${data.otp2}${data.otp3}${data.otp4}`;

    if (!email && !mobileNumber) {
      toast.error("Session missing. Please try again.");
      return;
    }

    const payload: any = { otp, purpose: fromFlow };
    if (email) payload.email = email;
    if (mobileNumber) {
      payload.mobileNumber = mobileNumber;
      if (countryCode) payload.countryCode = countryCode;
    }

    verifyMutation.mutate(payload);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    e.target.value = value;
    if (value.length > 1) {
      const lastChar = value.slice(-1);
      setValue(`otp${index + 1}` as keyof OTPForm, lastChar);
      if (index < 3) setFocus(`otp${index + 2}` as keyof OTPForm);
    } else if (value.length === 1) {
      if (index < 3) setFocus(`otp${index + 2}` as keyof OTPForm);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
      setFocus(`otp${index}` as keyof OTPForm);
    }
  };

  const isLoading = verifyMutation.isPending;

  return (
    <section className="section-padding flex items-center justify-center relative min-h-screen">
      <div className="absolute top-0 left-0 w-full h-[227px] bg-[linear-gradient(90deg,#FBF7FD_0%,#EBDDF7_100%)]"></div>
      <div className="container relative z-10">
        <div className="!max-w-[500px] w-full p-0 relative mx-auto">
          <div className="bg-white rounded-[8px] shadow-[0px_1px_3px_rgba(0,0,0,0.25)] overflow-hidden relative">

            {/* Loader Overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                <Loader text="Verifying OTP..." />
              </div>
            )}

            {/* Header */}
            <div className="text-center p-8 pb-10 bg-[var(--theme-color-primary-shade-900)]">
              <div className="flex justify-center mb-4">
                <img src="/images/otp.svg" alt="Logo" className="w-[82px]" />
              </div>
              <div className="flex flex-col gap-[5px]">
                <h2 className="headings-web-h4-headline text-white mb-2">OTP Verification</h2>
                <p className="body-text-body-2 !text-white">
                  Enter OTP sent on your registered {email ? 'email address' : 'Phone number'}
                </p>
              </div>
            </div>
            <div className="p-6 md:p-8 pt-6">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex items-center gap-[10px] mb-2">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="form-group flex-1">
                      <input
                        {...register(`otp${index + 1}` as keyof OTPForm, {
                          required: true,
                          maxLength: 1,
                          pattern: /[0-9]/,
                        })}
                        type="text"
                        maxLength={1}
                        className={`form-control text-center ${errors[`otp${index + 1}` as keyof OTPForm] ? 'border-red-500' : ''}`}
                        placeholder="0"
                        onInput={(e) => handleInputChange(e as React.ChangeEvent<HTMLInputElement>, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        autoFocus={index === 0}
                      />
                    </div>
                  ))}
                </div>

                {(errors.otp1 || errors.otp2 || errors.otp3 || errors.otp4) && (
                  <p className="!text-red-500 text-sm mb-4 text-center">
                    Please enter a valid 4-digit OTP
                  </p>
                )}

                <div>
                  <button type="submit" className="w-full btn" disabled={isLoading}>
                    {isLoading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>

                <div className="text-center mt-6">
                  <p className="body-text-body-2 text-[var(--color-gray-600)]">
                    Didn’t receive OTP?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        if (email) sendOtp({ email });
                        else if (mobileNumber) sendOtp({ mobileNumber, countryCode });
                        toast.success("OTP Resent!");
                      }}
                      className="link-text-text-link-1 medium text-[var(--theme-color-primary-shade-600)] cursor-pointer hover:underline"
                    >
                      Resend
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OTP;
