import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import PhoneInput, { parsePhoneNumber, isValidPhoneNumber } from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en';
import 'react-phone-number-input/style.css';
import { getDoctorsApi, addDoctorApi, deleteDoctorApi, toggleDoctorFavoriteApi, updateDoctorApi } from '../api/authApi';
import { toast } from 'react-toastify';
import Loader from '../components/common/Loader';

interface DoctorData {
    _id: string;
    name: string;
    specialty: string;
    email: string;
    phone: string;
    countryCode?: string;
    countryName?: string;
    isFavorite: boolean;
}

interface DoctorFormInputs {
    name: string;
    specialty: string;
    email: string;
    phone: string;
}

const Doctor: React.FC = () => {
    const queryClient = useQueryClient();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
    const [editingDoctor, setEditingDoctor] = useState<DoctorData | null>(null);

    const defaultFormValues = {
        name: '',
        specialty: '',
        email: '',
        phone: ''
    };

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<DoctorFormInputs>({
        defaultValues: defaultFormValues
    });

    const { data: doctorsRes, isLoading } = useQuery({
        queryKey: ['doctors'],
        queryFn: getDoctorsApi
    });

    const doctors: DoctorData[] = doctorsRes?.data?.data || [];

    const addMutation = useMutation({
        mutationFn: (data: any) => addDoctorApi(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
            setShowAddModal(false);
            reset();
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 2000);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to add doctor");
        }
    });
    const updateMutation = useMutation({
        mutationFn: (data: any) => updateDoctorApi(editingDoctor?._id as string, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
            setShowAddModal(false);
            setEditingDoctor(null);
            reset();
            toast.success("Doctor updated successfully");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to update doctor");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteDoctorApi(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
            setShowDeleteModal(null);
            toast.success("Doctor removed successfully");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to remove doctor");
        }
    });

    const toggleMutation = useMutation({
        mutationFn: (id: string) => toggleDoctorFavoriteApi(id),
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
            toast.success(res.message);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to update favorite status");
        }
    });

    const handleAddDoctor = (data: DoctorFormInputs) => {
        let countryCode = "+1";
        let countryName = "United States";
        let phone = data.phone;

        if (data.phone) {
            const parsed = parsePhoneNumber(data.phone);
            if (parsed) {
                countryCode = `+${parsed.countryCallingCode}`;
                phone = parsed.nationalNumber;
                countryName = en[parsed.country as keyof typeof en] || "United States";
            }
        }

        const trimmedData = {
            ...data,
            name: data.name.trim(),
            specialty: data.specialty.trim(),
            email: data.email.trim(),
            phone: phone,
            countryCode,
            countryName
        };
        if (editingDoctor) {
            updateMutation.mutate(trimmedData);
        } else {
            addMutation.mutate(trimmedData);
        }
    };
    const handleEditClick = (doc: DoctorData) => {
        setEditingDoctor(doc);
        reset({
            name: doc.name,
            specialty: doc.specialty,
            email: doc.email,
            phone: doc.countryCode ? `${doc.countryCode}${doc.phone}` : doc.phone
        });
        setShowAddModal(true);
    };

    const handleDeleteDoctor = () => {
        if (showDeleteModal !== null) {
            deleteMutation.mutate(showDeleteModal);
        }
    };

    return (
        <section className="py-10 lg:py-18">
            <div className="container">
                <div className="bg-white rounded-[15px]">
                    <div className="flex justify-between items-center mb-[15px] p-[15px] border-b border-[#F1F5F9]">
                        <h1 className="headings-web-h4-headline bold text-[#374151]">
                            Doctor
                        </h1>
                        <button onClick={() => { setEditingDoctor(null); setShowAddModal(true); reset(defaultFormValues); }} className="btn">
                            Add New Doctor
                        </button>
                    </div>

                    <div className="p-[15px] md:p-[20px]">
                        {isLoading ? (
                            <div className="py-20 flex justify-center">
                                <Loader text="Loading doctors..." />
                            </div>
                        ) : doctors.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 text-center">
                                <div className="w-20 h-20 bg-[#F3E8FF] rounded-full flex items-center justify-center mb-6">
                                    <svg
                                        width="32"
                                        height="32"
                                        viewBox="0 0 24 24"
                                        fill="#9146C1"
                                        className="opacity-80"
                                    >
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M18 7a4 4 0 0 0-3-3.87"></path>
                                    </svg>
                                </div>
                                <h3 className="headings-h4-headline text-slate-800 mb-6">
                                    No trusted doctors added yet.
                                </h3>
                                <button
                                    onClick={() => { setEditingDoctor(null); setShowAddModal(true); reset(defaultFormValues); }}
                                    className="bg-[#9146C1] text-white px-10 py-3 rounded-xl font-['AeonikBold'] text-[15px] hover:opacity-90 transition-all shadow-lg uppercase"
                                >
                                    Add Your First Doctor
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                                {doctors.map((doc) => (
                                    <div
                                        key={doc._id}
                                        className="relative bg-white p-[15px] rounded-[10px] border border-[#F1F5F9] flex flex-col group transition-all hover:border-purple-100"
                                    >
                                        <div className="absolute top-6 right-6">
                                            <button
                                                onClick={() => toggleMutation.mutate(doc._id)}
                                                disabled={toggleMutation.isPending}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${doc.isFavorite ? 'bg-red-50' : 'bg-[#F1F5F9]'} hover:scale-110 active:scale-95`}
                                            >
                                                {doc.isFavorite ? (
                                                    <svg
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 24 24"
                                                        fill="#C00000"
                                                    >
                                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                                    </svg>
                                                ) : (
                                                    <svg
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="#CBD5E1"
                                                        strokeWidth="2"
                                                    >
                                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>

                                        <div className="mb-2 space-y-1">
                                            <h4 className="headings-web-h6-headline text-[#374151]">
                                                {doc.name}
                                            </h4>
                                            <p className="text-[14px] !text-[#62748E]">
                                                {doc.specialty}
                                            </p>
                                        </div>

                                        <div className="mt-auto flex justify-between items-end">
                                            <div className="space-y-2">
                                                <p className="text-[14px] !text-[#64748B] leading-tight">
                                                    {doc.email}
                                                </p>
                                                <p className="text-[14px] !text-[#64748B] leading-tight">
                                                    {doc.countryCode ? `${doc.countryCode} ` : ''}{doc.phone}
                                                </p>
                                            </div>
                                            <div className="flex gap-2.5">
                                                <button onClick={() => handleEditClick(doc)} className="w-[30px] h-[30px] bg-[#0A0A0A] text-white rounded-full flex items-center justify-center hover:opacity-90 transition-all">
                                                    <img src="/images/edit.svg" alt="edit" />
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteModal(doc._id)}
                                                    className="w-[30px] h-[30px] bg-[#9146C1] text-white rounded-full flex items-center justify-center hover:opacity-90 transition-all"
                                                >
                                                    <img src="/images/trash.svg" alt="trash" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Doctor Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[2000] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-[510px] rounded-[15px] overflow-hidden animate-in fade-in zoom-in duration-300 relative">
                        <button
                            onClick={() => { setShowAddModal(false); setEditingDoctor(null); }}
                            className="absolute top-6 right-6 text-slate-400 hover:text-slate-950 transition-colors"
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                        </button>

                        <div className="p-[20px]">
                            <h3 className="headings-web-h5-headline text-slate-800 mb-6 tracking-tight">
                                {editingDoctor ? "Edit Doctor" : "Add New Doctor"}
                            </h3>
                            <form onSubmit={handleSubmit(handleAddDoctor)}>
                                <div className="form-group">
                                    <label>Doctor Name</label>
                                    <input
                                        type="text"
                                        {...register("name", {
                                            required: "Doctor name is required",
                                            maxLength: { value: 50, message: "Name must be less than 50 characters" },
                                            pattern: { value: /^[a-zA-Z\s.]+$/, message: "Only alphabets, spaces and dots are allowed" },
                                            validate: (value) => value.trim().length > 0 || "Doctor name cannot be only spaces"
                                        })}
                                        className={`form-control ${errors.name ? 'border-red-500' : ''}`}
                                        placeholder="Enter doctor name"
                                    />
                                    {errors.name && <p className="!text-red-500 text-xs mt-1">{errors.name.message}</p>}
                                </div>
                                <div className="form-group">
                                    <label>Speciality</label>
                                    <input
                                        type="text"
                                        {...register("specialty", {
                                            required: "Speciality is required",
                                            maxLength: { value: 50, message: "Speciality must be less than 50 characters" },
                                            pattern: { value: /^[a-zA-Z\s.]+$/, message: "Only alphabets, spaces and dots are allowed" },
                                            validate: (value) => value.trim().length > 0 || "Speciality cannot be only spaces"
                                        })}
                                        className={`form-control ${errors.specialty ? 'border-red-500' : ''}`}
                                        placeholder="Enter speciality"
                                    />
                                    {errors.specialty && <p className="!text-red-500 text-xs mt-1">{errors.specialty.message}</p>}
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        {...register("email", {
                                            required: "Email is required",
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: "Invalid email address"
                                            }
                                        })}
                                        className={`form-control ${errors.email ? 'border-red-500' : ''}`}
                                        placeholder="Enter email address"
                                    />
                                    {errors.email && <p className="!text-red-500 text-xs mt-1">{errors.email.message}</p>}
                                </div>
                                <div className="form-group">
                                    <label>WhatsApp Number</label>
                                    <Controller
                                        name="phone"
                                        control={control}
                                        rules={{
                                            required: "WhatsApp number is required",
                                            validate: (value) => {
                                                if (!value || !isValidPhoneNumber(value)) {
                                                    return "Invalid WhatsApp number";
                                                }
                                                return true;
                                            }
                                        }}
                                        render={({ field: { onChange, value } }) => (
                                            <PhoneInput
                                                international
                                                defaultCountry="US"
                                                value={value}
                                                onChange={onChange}
                                                className={`form-control flex items-center gap-2 !pl-3 ${errors.phone ? 'border-red-500' : ''}`}
                                                numberInputProps={{
                                                    className: "bg-transparent border-none outline-none w-full !text-slate-900 placeholder:text-slate-400 focus:ring-0 h-full p-0 text-[14px]",
                                                    placeholder: "Enter WhatsApp number",
                                                    maxLength: 20
                                                }}
                                            />
                                        )}
                                    />
                                    {errors.phone && <p className="!text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                                </div>
                                <button type="submit" disabled={addMutation.isPending || updateMutation.isPending} className="btn min-w-[165px]">
                                    {addMutation.isPending || updateMutation.isPending ? "Saving..." : (editingDoctor ? "Update" : "Save")}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[2010] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-[452px] rounded-[15px] overflow-hidden animate-in fade-in zoom-in duration-300 relative">
                        <div className="p-[20px]">
                            <div className="w-[77px] h-[77px] bg-[#F5E7FF] text-[#9146C1] rounded-full flex items-center justify-center mx-auto mb-6">
                                <img src="/images/success.svg" alt="success" />
                            </div>
                            <h3 className="headings-web-h3-headline text-center text-slate-800 mb-8 tracking-tight">
                                Doctor added successfully.
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal !== null && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[2000] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-[452px] rounded-[15px] overflow-hidden animate-in fade-in zoom-in duration-300 relative">
                        <div className="p-[20px]">
                            <div className="w-[77px] h-[77px] bg-[#F5E7FF] text-[#9146C1] rounded-full flex items-center justify-center mx-auto mb-6">
                                <img src="/images/delete.svg" alt="delete" />
                            </div>
                            <h3 className="headings-web-h4-headline text-center text-slate-800 mb-8 tracking-tight">
                                Are you sure you want to <br />
                                remove this doctor?
                            </h3>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowDeleteModal(null)}
                                    className="flex-1 btn"
                                >
                                    No
                                </button>
                                <button
                                    onClick={handleDeleteDoctor}
                                    className="btn btn-black flex-1"
                                >
                                    Yes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Doctor;