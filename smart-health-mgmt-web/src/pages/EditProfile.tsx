import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfileApi, uploadImage, removeImage, getMe } from "../api/authApi";
import { toast } from "react-toastify";
import useAuthStore from "../store/authStore";
import Loader from "../components/common/Loader";
import { formatUploadUrl } from "../utils/urlHelper";
import { useQuery } from "@tanstack/react-query";

// Phone library imports
import PhoneInput, { parsePhoneNumber, isValidPhoneNumber } from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en';
import 'react-phone-number-input/style.css';

type EditProfileForm = {
  fullName: string;
  email: string;
  mobileNumber: string;
  gender: string;
  dateOfBirth?: string;
  height: string;
  weight: string;
  systolic: string;
  diastolic: string;
  diabetes: string;
  bloodGroup: string;
  healthConditions?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
};

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: storeUser, setUser, isAuthenticated } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const user = data?.data || storeUser;

  // Re-construct the full E.164 number for the library's initial value
  const initialPhone = user?.countryCode && user?.mobileNumber
    ? `${user.countryCode}${user.mobileNumber}`
    : user?.mobileNumber ? `+1${user.mobileNumber}` : "";

  const initialEmergencyPhone = user?.healthProfile?.emergencyContact?.countryCode && user?.healthProfile?.emergencyContact?.phone
    ? `${user.healthProfile.emergencyContact.countryCode}${user.healthProfile.emergencyContact.phone}`
    : user?.healthProfile?.emergencyContact?.phone || "";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EditProfileForm>({
    values: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      mobileNumber: initialPhone,
      gender: user?.gender || "other",
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
      height: user?.healthProfile?.height?.toString() || "",
      weight: user?.healthProfile?.weight?.toString() || "",
      systolic: user?.healthProfile?.bloodPressure?.split("/")[0] || "",
      diastolic: user?.healthProfile?.bloodPressure?.split("/")[1] || "",
      diabetes: user?.healthProfile?.diabetes || "",
      bloodGroup: user?.healthProfile?.bloodGroup || "",
      healthConditions: user?.healthProfile?.healthConditions || "",
      emergencyContact: {
        name: user?.healthProfile?.emergencyContact?.name || "",
        phone: initialEmergencyPhone,
        relation: user?.healthProfile?.emergencyContact?.relation || "other",
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateProfileApi(data),
    onSuccess: (response: any) => {
      toast.success("Profile updated successfully!");
      setUser(response.data);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate("/profile");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => uploadImage(formData),
    onSuccess: (response: any) => {
      toast.success("Photo uploaded successfully!");
      setUser(response.data);
      setIsUploading(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Upload failed");
      setIsUploading(false);
    }
  });

  const removeMutation = useMutation({
    mutationFn: removeImage,
    onSuccess: (response: any) => {
      toast.success("Photo removed!");
      setUser(response.data);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("image", file);
      uploadMutation.mutate(formData);
    }
  };

  const onSubmit = (data: EditProfileForm) => {
    let countryCode = user?.countryCode || "+1";
    let mobileOnly = data.mobileNumber;
    let countryName = (user as any)?.countryName || "United States";

    // Extracting parts from the library input
    if (data.mobileNumber) {
      const parsed = parsePhoneNumber(data.mobileNumber);
      if (parsed) {
        countryCode = `+${parsed.countryCallingCode}`;
        mobileOnly = parsed.nationalNumber;
        countryName = en[parsed.country as keyof typeof en] || "United States";
      }
    }

    // Process Emergency Contact
    let ecCountryCode = user?.healthProfile?.emergencyContact?.countryCode || "+1";
    let ecPhoneOnly = data.emergencyContact.phone;
    let ecCountryName = user?.healthProfile?.emergencyContact?.countryName || "United States";

    if (data.emergencyContact.phone) {
      const ecParsed = parsePhoneNumber(data.emergencyContact.phone);
      if (ecParsed) {
        ecCountryCode = `+${ecParsed.countryCallingCode}`;
        ecPhoneOnly = ecParsed.nationalNumber;
        ecCountryName = en[ecParsed.country as keyof typeof en] || "United States";
      }
    }

    const payload = {
      fullName: data.fullName,
      email: data.email,
      mobileNumber: mobileOnly,
      countryCode: countryCode,
      countryName: countryName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      height: data.height,
      weight: data.weight,
      bloodPressure: `${data.systolic}/${data.diastolic}`,
      diabetes: data.diabetes,
      bloodGroup: data.bloodGroup,
      healthConditions: data.healthConditions?.trim() || "",
      emergencyContact: {
        name: data.emergencyContact.name,
        phone: ecPhoneOnly,
        countryCode: ecCountryCode,
        countryName: ecCountryName,
        relation: data.emergencyContact.relation,
      }
    };
    updateMutation.mutate(payload);
  };

  if (isLoading || !user) return <Loader text="Loading..." />;

  return (
    <section className="py-10 lg:py-18 bg-[var(--color-slate-50)]">
      <div className="container">
        <div className="bg-white rounded-[15px] shadow-sm overflow-hidden">
          <div className="p-[15px] border-b border-[var(--color-slate-100)]">
            <h1 className="headings-web-h4-headline text-[var(--color-gray-700)]">
              Edit Profile
            </h1>
          </div>

          <div className="p-[15px] md:p-[20px]">
            <div className="grid grid-cols-1 lg:grid-cols-[285px_1fr] gap-6">
              {/* LEFT COLUMN: Profile Image */}
              <div className="space-y-6">
                <div className="bg-[var(--theme-color-primary-shade-50)] rounded-[10px] p-[15px] text-center border border-[var(--theme-color-primary-shade-100)]">
                  <div className="relative w-[90px] h-[90px] mx-auto mb-4">
                    <img
                      src={
                        user.profileImage
                          ? formatUploadUrl(user.profileImage)
                          : "/images/Ellipses.png"
                      }
                      className="w-full h-full rounded-full object-cover border-2 border-white shadow-sm"
                      alt="Profile"
                      onError={(e) => {
                        console.error("Failed to load profile image:", user.profileImage);
                        (e.target as HTMLImageElement).src = "/images/Ellipses.png";
                      }}
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <h3 className="headings-web-h4-headline text-[var(--black-white-black)] mb-[5px]">
                    {user.fullName || "User"}
                  </h3>
                  <p className="text-body-1 !text-[var(--color-slate-500)] mb-6">{user.email}</p>
                  <div className="flex gap-3 justify-center">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    <button className="btn btn-white" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                      Upload photo
                    </button>
                    {user.profileImage && user.profileImage !== '/uploads/profile/default-avatar.png' && (
                      <button className="btn btn-black" onClick={() => removeMutation.mutate()} disabled={removeMutation.isPending}>
                        {removeMutation.isPending ? "Removing..." : "Remove"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Form */}
              <div className="space-y-6">
                <form className="bg-white" onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div className="form-group">
                    <label className="body-text-body-2 medium mb-1">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter full name"
                      {...register("fullName", {
                        required: "Full name is required",
                        minLength: { value: 3, message: 'Must be at least 3 characters' },
                        maxLength: { value: 50, message: 'Full name cannot exceed 50 characters' },
                        pattern: { value: /^[a-zA-Z\s.]+$/, message: 'Only alphabets, spaces and dots allowed' }
                      })}
                      maxLength={50}
                    />
                    {errors.fullName && <p className="!text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                  </div>

                  <div className="form-group">
                    <label className="body-text-body-2 medium mb-1">Email ID</label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="Enter email ID"
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                          message: "Invalid email address"
                        }
                      })}
                    />
                    {errors.email && <p className="!text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Integrated PhoneInput */}
                    <div className="form-group mb-0">
                      <label className="body-text-body-2 medium mb-1">Mobile Number</label>
                      <Controller
                        name="mobileNumber"
                        control={control}
                        rules={{
                          required: "Mobile number is required",
                          validate: (val) => {
                            if (!val || !isValidPhoneNumber(val)) {
                              return "Invalid mobile number";
                            }
                            const parsed = parsePhoneNumber(val);
                            if (!parsed) return "Invalid mobile number";
                            // if (parsed && parsed.nationalNumber.length !== 10) {
                            //   return "Mobile number must be 10 digits";
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
                            className={`form-control flex items-center gap-2 !pl-3 ${errors.mobileNumber ? 'border-red-500' : ''}`}
                            numberInputProps={{
                              className: "bg-transparent border-none outline-none w-full !text-slate-900 placeholder:text-slate-400 focus:ring-0 h-full p-0 text-[14px]",
                              placeholder: "Enter mobile number",
                              maxLength: 20
                            }}
                          />
                        )}
                      />
                      {errors.mobileNumber && <p className="!text-red-500 text-xs mt-1">{errors.mobileNumber.message}</p>}
                    </div>

                    <div className="form-group mb-0">
                      <label className="body-text-body-2 medium mb-1">Gender</label>
                      <select className="form-control text-[var(--color-slate-500)]" {...register("gender")}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Date of Birth Field */}
                  <div className="form-group">
                    <label className="body-text-body-2 medium mb-1">Date of Birth</label>
                    <input
                      type="date"
                      className="form-control"
                      max={new Date().toISOString().split('T')[0]}
                      onKeyDown={(e) => e.preventDefault()}
                      onClick={(e) => (e.target as any).showPicker?.()}
                      onFocus={(e) => (e.target as any).showPicker?.()}
                      {...register("dateOfBirth")}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group mb-0">
                      <label className="body-text-body-2 medium mb-1">Height</label>
                      <select
                        className={`form-control ${errors.height ? 'border-red-500' : 'text-[var(--color-slate-500)]'}`}
                        {...register("height")}
                      >
                        <option value="">Select Height</option>
                        {Array.from({ length: 60 }).map((_, i) => {
                          const feet = Math.floor(i / 12) + 3;
                          const inches = i % 12;
                          const val = `${feet} feet ${inches} inches`;
                          return <option key={val} value={val}>{val}</option>;
                        })}
                      </select>
                      {errors.height && <p className="!text-red-500 text-xs mt-1">{errors.height.message}</p>}
                    </div>
                    <div className="form-group mb-0">
                      <label className="body-text-body-2 medium mb-1">Weight</label>
                      <select
                        className={`form-control ${errors.weight ? 'border-red-500' : 'text-[var(--color-slate-500)]'}`}
                        {...register("weight")}
                      >
                        <option value="">Select Weight</option>
                        {Array.from({ length: 335 }).map((_, i) => (
                          <option key={i} value={`${66 + i} lbs`}>{`${66 + i} lbs`}</option>
                        ))}
                      </select>
                      {errors.weight && <p className="!text-red-500 text-xs mt-1">{errors.weight.message}</p>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="body-text-body-2 medium mb-1">Blood Pressure</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Systolic"
                          {...register("systolic", {
                            maxLength: { value: 3, message: "Invalid value" },
                            pattern: {
                              value: /^[0-9]+$/,
                              message: "Only numbers allowed"
                            }
                          })}
                          maxLength={3}
                        />
                        {errors.systolic && <p className="!text-red-500 text-xs mt-1">{errors.systolic.message}</p>}
                      </div>
                      <div>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Diastolic"
                          {...register("diastolic", {
                            maxLength: { value: 3, message: "Invalid value" },
                            pattern: {
                              value: /^[0-9]+$/,
                              message: "Only numbers allowed"
                            }
                          })}
                          maxLength={3}
                        />
                        {errors.diastolic && <p className="!text-red-500 text-xs mt-1">{errors.diastolic.message}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="body-text-body-2 medium mb-1">Diabetes</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter status (e.g. Type 1, Negative)"
                      {...register("diabetes", {
                        maxLength: { value: 20, message: "Too long" }
                      })}
                      maxLength={20}
                    />
                  </div>

                  <div className="form-group">
                    <label className="body-text-body-2 medium mb-1">Blood Type</label>
                    <select className="form-control text-[var(--color-slate-500)]" {...register("bloodGroup")}>
                      <option value="">Select blood type</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="body-text-body-2 medium mb-1">Health Conditions</label>
                    <textarea
                      className="form-control h-[100px]"
                      placeholder="Enter conditions separated by comma"
                      {...register("healthConditions", {
                        maxLength: { value: 200, message: "Too long" }
                      })}
                      maxLength={200}
                    ></textarea>
                  </div>

                  <div className="mt-8 border-t border-[var(--color-slate-100)] pt-6">
                    <h3 className="headings-web-h4-headline text-[var(--color-gray-700)] mb-6">Emergency Contact</h3>

                    <div className="form-group">
                      <label className="body-text-body-2 medium mb-1">Contact Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter contact name"
                        {...register("emergencyContact.name", {
                          maxLength: { value: 50, message: "Too long" }
                        })}
                        maxLength={50}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label className="body-text-body-2 medium mb-1">Contact Phone</label>
                        <Controller
                          name="emergencyContact.phone"
                          control={control}
                          rules={{
                            validate: (val) => {
                              if (!val) return true;
                              if (!isValidPhoneNumber(val)) {
                                return "Invalid mobile number";
                              }
                              const parsed = parsePhoneNumber(val);
                              if (!parsed) return "Invalid mobile number";
                              // if (parsed && parsed.nationalNumber.length !== 10) {
                              //   return "Mobile number must be 10 digits";
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
                              className={`form-control flex items-center gap-2 !pl-3 ${errors.emergencyContact?.phone ? 'border-red-500' : ''}`}
                              numberInputProps={{
                                className: "bg-transparent border-none outline-none w-full !text-slate-900 placeholder:text-slate-400 focus:ring-0 h-full p-0 text-[14px]",
                                placeholder: "Enter mobile number",
                                maxLength: 20
                              }}
                            />
                          )}
                        />
                        {errors.emergencyContact?.phone && <p className="!text-red-500 text-xs mt-1">{errors.emergencyContact.phone.message as string}</p>}
                      </div>

                      <div className="form-group">
                        <label className="body-text-body-2 medium mb-1">Relation</label>
                        <select className="form-control text-[var(--color-slate-500)]" {...register("emergencyContact.relation")}>
                          <option value="parent">Parent</option>
                          <option value="spouse">Spouse</option>
                          <option value="sibling">Sibling</option>
                          <option value="friend">Friend</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-4">
                    <button type="submit" className="btn min-w-[150px]" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? "Saving..." : "Save"}
                    </button>
                    <button type="button" className="btn btn-white min-w-[150px]" onClick={() => navigate("/profile")}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditProfile;