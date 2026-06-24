"use client";

import {
  Lock,
  User,
  Camera,
  Eye,
  EyeOff,
  Mail,
  Shield,
  CreditCard
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";

import { changePassword, getProfile, updateProfile, getSettings, updateStripeMode } from "../../api/authApi";
import { useUserStore } from "../../store/userStore";

export default function AdminProfile() {
  const queryClient = useQueryClient();
  const setProfileImageStore = useUserStore((state) => state.setProfileImage);
  const setUserStore = useUserStore((state) => state.setUser);
  const token = useUserStore((state) => state.token);
  const IMAGE_URL = import.meta.env.VITE_IMAGE_URL;

  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["admin-profile"],
    queryFn: getProfile,
  });

  useEffect(() => {
    if (!profile) return;
    setUserStore(profile, token || "");
    if (profile.profileImage) {
      setProfileImageUrl(profile.profileImage);
      setProfileImageStore(profile.profileImage);
    }
  }, [profile]);

  const { data: settings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: getSettings,
  });

  const stripeModeSetting = settings?.find((s: any) => s.key === "stripe_mode");
  const currentStripeMode = stripeModeSetting?.value || "test";

  const toggleStripeModeMutation = useMutation({
    mutationFn: (newMode: string) => updateStripeMode(newMode),
    onSuccess: () => {
      toast.success("Stripe mode updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update Stripe mode");
    },
  });

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      toast.success("Profile updated successfully");
      setUserStore(updatedUser, token || "");
      setProfileImageUrl(updatedUser.profileImage);
      setProfileImageStore(updatedUser.profileImage);
      setSelectedImage(null);
      setPreviewImage(null);
      queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success("Password updated successfully");
      passwordFormik.resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update password");
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }
    setSelectedImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const infoFormik = useFormik({
    initialValues: { fullName: "", email: "" },
    enableReinitialize: true,
    validationSchema: Yup.object({
      fullName: Yup.string().required("Name is required").max(50, "Name cannot exceed 50 characters"),
      email: Yup.string().email("Invalid email").required("Email is required").max(50, "Email cannot exceed 50 characters"),
    }),
    onSubmit: (values) => {
      const formData = new FormData();
      formData.append("fullName", values.fullName);
      formData.append("email", values.email);
      if (selectedImage) formData.append("profileImage", selectedImage);
      profileMutation.mutate(formData);
    },
  });

  useEffect(() => {
    if (profile) {
      infoFormik.setValues({
        fullName: profile.fullName || "",
        email: profile.email || "",
      });
    }
  }, [profile]);

  const passwordFormik = useFormik({
    initialValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required("Current password is required").max(32),
      newPassword: Yup.string()
        .min(8, "Minimum 8 characters")
        .max(32, "Maximum 32 characters")
        .required("New password is required")
        .test(
          "not-same-as-current",
          "New password cannot be the same as current password",
          function (value) {
            const { currentPassword } = this.parent;
            return value !== currentPassword;
          }
        ),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword")], "Passwords do not match")
        .max(32, "Maximum 32 characters")
        .required("Confirm password is required"),
    }),
    onSubmit: (values) => {
      passwordMutation.mutate({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
    },
  });


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const avatarSrc = previewImage ? previewImage : profileImageUrl ? `${IMAGE_URL}${profileImageUrl}` : null;

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=aeonik@400,500,700&display=swap');
        .font-aeonik { font-family: 'Aeonik', sans-serif; }
      `}</style>

      <div className="max-w-5xl mx-auto font-aeonik">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Account Settings</h1>
          <p className="text-gray-500 text-sm">Update your personal details and security settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col items-center">
              <div className="relative mb-6 group">
                <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-purple-50">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-purple-100 flex items-center justify-center text-[#7C3AED]">
                      <User size={48} />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-1 right-1 bg-[#7C3AED] p-2.5 rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform border-4 border-white">
                  <Camera size={16} className="text-white" />
                  <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                </label>
              </div>

              <h2 className="text-xl font-bold text-gray-800">{profile?.fullName}</h2>
              <p className="text-gray-400 text-sm mb-4">{profile?.email}</p>

              <div className="flex items-center gap-2 bg-purple-50 text-[#7C3AED] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                <Shield size={14} />
                <span>Administrator</span>
              </div>
            </div>
          </div>

          {/* Main Forms */}
          <div className="lg:col-span-8 space-y-6">
            {/* Personal Info */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-50 rounded-lg text-[#7C3AED]">
                  <User size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Personal Information</h3>
              </div>

              <form onSubmit={infoFormik.handleSubmit} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Full Name</label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-[#7C3AED] transition-colors">
                        <User size={18} />
                      </div>
                      <input
                        name="fullName"
                        value={infoFormik.values.fullName}
                        onChange={infoFormik.handleChange}
                        onBlur={infoFormik.handleBlur}
                        maxLength={50}
                        placeholder="Enter Owner Name"
                        className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl transition-all ${infoFormik.touched.fullName && infoFormik.errors.fullName ? 'border-red-500' : 'border-gray-100'}`}
                      />
                    </div>
                    {infoFormik.touched.fullName && infoFormik.errors.fullName && (
                      <p className="text-red-500 text-sm mt-1">{infoFormik.errors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Email Address</label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <Mail size={18} />
                      </div>
                      <input
                        name="email"
                        value={infoFormik.values.email}
                        disabled
                        maxLength={50}
                        placeholder="Enter Email Address"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-100 rounded-xl text-slate-400 cursor-not-allowed opacity-100"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={profileMutation.isPending}
                  className="bg-[#7C3AED] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#6D28D9] shadow-lg transition-all disabled:opacity-50"
                >
                  {profileMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-50 rounded-lg text-red-500">
                  <Lock size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Security</h3>
              </div>

              <form onSubmit={passwordFormik.handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Current Password</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-[#7C3AED] transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword.current ? "text" : "password"}
                      name="currentPassword"
                      onChange={(e) => passwordFormik.setFieldValue('currentPassword', e.target.value.replace(/\s/g, ''))}
                      onBlur={passwordFormik.handleBlur}
                      value={passwordFormik.values.currentPassword}
                      maxLength={32}
                      placeholder="Current password"
                      className={`w-full pl-10 pr-12 py-3 bg-gray-50 border rounded-xl transition-all ${passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword ? 'border-red-500' : 'border-gray-100'}`}
                    />
                    <button type="button" onClick={() => setShowPassword(p => ({ ...p, current: !p.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 bg-transparent border-none cursor-pointer">
                      {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword && (
                    <p className="text-red-500 text-sm mt-1">{passwordFormik.errors.currentPassword}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">New Password</label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-[#7C3AED] transition-colors">
                        <Lock size={18} />
                      </div>
                      <input
                        type={showPassword.new ? "text" : "password"}
                        name="newPassword"
                        onChange={(e) => passwordFormik.setFieldValue('newPassword', e.target.value.replace(/\s/g, ''))}
                        onBlur={passwordFormik.handleBlur}
                        value={passwordFormik.values.newPassword}
                        maxLength={32}
                        placeholder="At least 8 characters"
                        className={`w-full pl-10 pr-12 py-3 bg-gray-50 border rounded-xl transition-all ${passwordFormik.touched.newPassword && passwordFormik.errors.newPassword ? 'border-red-500' : 'border-gray-100'}`}
                      />
                      <button type="button" onClick={() => setShowPassword(p => ({ ...p, new: !p.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 bg-transparent border-none cursor-pointer">
                        {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {passwordFormik.touched.newPassword && passwordFormik.errors.newPassword && (
                      <p className="text-red-500 text-sm mt-1">{passwordFormik.errors.newPassword}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Confirm Password</label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-[#7C3AED] transition-colors">
                        <Lock size={18} />
                      </div>
                      <input
                        type={showPassword.confirm ? "text" : "password"}
                        name="confirmPassword"
                        onChange={(e) => passwordFormik.setFieldValue('confirmPassword', e.target.value.replace(/\s/g, ''))}
                        onBlur={passwordFormik.handleBlur}
                        value={passwordFormik.values.confirmPassword}
                        maxLength={32}
                        placeholder="Confirm new password"
                        className={`w-full pl-10 pr-12 py-3 bg-gray-50 border rounded-xl transition-all ${passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword ? 'border-red-500' : 'border-gray-100'}`}
                      />
                      <button type="button" onClick={() => setShowPassword(p => ({ ...p, confirm: !p.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 bg-transparent border-none cursor-pointer">
                        {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">{passwordFormik.errors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={passwordMutation.isPending}
                  className="bg-gray-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50"
                >
                  {passwordMutation.isPending ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>

            {/* Payment Settings */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
                  <CreditCard size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Payment Settings</h3>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Stripe Environment</h4>
                  <p className="text-xs text-gray-500 mt-1">Switch between test and live payment gateways.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold ${currentStripeMode === 'test' ? 'text-gray-800' : 'text-gray-400'}`}>TEST</span>
                  <button
                    onClick={() => toggleStripeModeMutation.mutate(currentStripeMode === "test" ? "live" : "test")}
                    disabled={toggleStripeModeMutation.isPending}
                    className={`relative w-12 h-6 rounded-full transition-colors ${currentStripeMode === 'live' ? 'bg-[#7C3AED]' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${currentStripeMode === 'live' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                  <span className={`text-xs font-bold ${currentStripeMode === 'live' ? 'text-[#7C3AED]' : 'text-gray-400'}`}>LIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
