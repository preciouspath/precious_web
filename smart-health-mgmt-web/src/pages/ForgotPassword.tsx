import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { forgotPassword as forgotPasswordApi } from '../api/authApi';
import { toast } from 'react-toastify';

type ForgotPasswordForm = {
  email: string;
};

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    mode: 'onSubmit',
  });

  const sendOtpMutation = useMutation({
    mutationFn: (data: ForgotPasswordForm) => forgotPasswordApi({ email: data.email }),
    onSuccess: (_response: any, variables: ForgotPasswordForm) => {
      toast.success("OTP Sent to your email!");
      navigate('/otp', {
        state: {
          from: 'forgot-password',
          email: variables.email
        }
      });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to send OTP";
      toast.error(msg);
    }
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    sendOtpMutation.mutate(data);
  };

  return (
    <section className="section-padding flex items-center justify-center relative">
      <div className="absolute top-0 left-0 w-full h-[227px] bg-[linear-gradient(90deg,#FBF7FD_0%,#EBDDF7_100%)]"></div>
      <div className="container">
        <div className='!max-w-[500px] w-full p-0 relative z-10 mx-auto'>
          <div className="bg-white rounded-[8px] shadow-[0px_1px_3px_rgba(0,0,0,0.25)] overflow-hidden">

            {/* Header */}
            <div className="text-center p-8 pb-10 bg-[var(--theme-color-primary-shade-900)]">
              <div className="flex justify-center mb-4">
                <img src="/images/password.svg" alt="Logo" className="w-[82px]" />
              </div>
              <div className='flex flex-col gap-[5px]'>
                <h2 className="headings-web-h4-headline text-white mb-2">
                  Forgot Password
                </h2>
                <p className="body-text-body-2 !text-white">
                  Enter your email to reset your password
                </p>
              </div>
            </div>

            <div className="p-6 md:p-8 pt-6">
              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>

                <div className="form-group">
                  <label htmlFor="email" className="body-text-body-2 medium">
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    maxLength={50}
                    placeholder="Enter email address"
                    className={`form-control ${errors.email ? 'border-red-500' : ''}`}
                    {...register('email', {
                      required: 'Email is required',
                      maxLength: { value: 50, message: 'Email cannot exceed 50 characters' },
                      pattern: {
                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                        message: 'Please enter a valid email address',
                      },
                    })}
                    onInput={(e) => {
                      e.currentTarget.value = e.currentTarget.value.replace(/\s/g, '');
                    }}
                  />

                  {errors.email && (
                    <p className="!text-red-500 text-sm mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button type="submit" className="w-full btn ">
                    Submit
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

export default ForgotPassword;
