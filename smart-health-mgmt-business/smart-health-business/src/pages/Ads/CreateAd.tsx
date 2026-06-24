"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createAd } from '../../api/authApi';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import { Upload, FileText, Megaphone, MapPin, Calendar, DollarSign, Image as ImageIcon } from 'lucide-react';

type CreateAdForm = {
    title: string;
    description: string;
    image: FileList;
    targetLocation: string;
    startDate: string;
    endDate: string;
    budget: number;
};

const CreateAd: React.FC = () => {
    const { register, handleSubmit, watch, formState: { errors } } = useForm<CreateAdForm>();
    const navigate = useNavigate();
    const [fileName, setFileName] = useState<string | null>(null);

    const imageFile = watch('image');

    React.useEffect(() => {
        if (imageFile && imageFile.length > 0) {
            setFileName(imageFile[0].name);
        }
    }, [imageFile]);

    const mutation = useMutation({
        mutationFn: (formData: FormData) => createAd(formData),
        onSuccess: (_response: any) => {
            toast.success('Your ad has been submitted for admin approval.');
            navigate('/ads/pending');
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || 'Ad submission failed';
            toast.error(msg);
        }
    });

    const onSubmit = (data: CreateAdForm) => {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('targetLocation', data.targetLocation);
        formData.append('startDate', data.startDate);
        formData.append('endDate', data.endDate);
        formData.append('budget', data.budget.toString());

        if (data.image && data.image[0]) {
            formData.append('image', data.image[0]);
        }

        mutation.mutate(formData);
    };

    const isLoading = mutation.isPending;

    return (
        <div className="max-w-[1200px] mx-auto font-['AeonikRegular']">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="headings-web-h4-headline text-slate-900">Create Advertisement</h1>
                    <p className="body-text-body-2 text-slate-500 mt-1">Design and launch your new campaign</p>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] overflow-hidden relative">
                {isLoading && (
                    <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        <Loader text="Submitting ad..." />
                    </div>
                )}

                <div className="p-8 md:p-10">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="form-group">
                                    <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Ad Title*</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#9146C1] transition-colors">
                                            <Megaphone size={18} />
                                        </div>
                                        <input
                                            {...register('title', {
                                                required: 'Ad title is required',
                                                validate: {
                                                    notEmpty: (val) => val.trim().length > 0 || 'Title cannot be empty or only spaces',
                                                    noLongWords: (val) => !val.split(/\s+/).some(word => word.length > 50) || 'Title contains a word longer than 50 characters'
                                                },
                                                minLength: { value: 3, message: 'Must be at least 3 characters' },
                                                maxLength: { value: 100, message: 'Must be less than 100 characters' }
                                            })}
                                            placeholder="e.g. Summer Health Checkup"
                                            className={`form-control !pl-14 ${errors.title ? 'border-red-500 focus:border-red-500' : ''}`}
                                        />
                                    </div>
                                    {errors.title && <p className="form-error">{errors.title.message as string}</p>}
                                </div>

                                <div className="form-group">
                                    <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Description*</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-4 pt-0.5 text-slate-300 group-focus-within:text-[#9146C1] transition-colors">
                                            <FileText size={16} />
                                        </div>
                                        <textarea
                                            {...register('description', {
                                                required: 'Description is required',
                                                validate: {
                                                    notEmpty: (val) => val.trim().length > 0 || 'Description cannot be empty or only spaces',
                                                    noLongWords: (val) => !val.split(/\s+/).some(word => word.length > 50) || 'Description contains a word longer than 50 characters'
                                                },
                                                maxLength: { value: 500, message: 'Description must be less than 500 characters' }
                                            })}
                                            placeholder="Describe your campaign offer..."
                                            className={`form-control !pl-14 h-auto min-h-[120px] py-4 ${errors.description ? 'border-red-500 focus:border-red-500' : ''}`}
                                        />
                                    </div>
                                    {errors.description && <p className="form-error">{errors.description.message as string}</p>}
                                </div>

                                {/* Targeting */}
                                <div className="form-group">
                                    <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Target Location*</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#9146C1] transition-colors">
                                            <MapPin size={18} />
                                        </div>
                                        <input
                                            {...register('targetLocation', {
                                                required: 'Target location is required',
                                                validate: {
                                                    notEmpty: (val) => val.trim().length > 0 || 'Location cannot be empty or only spaces',
                                                    noLongWords: (val) => !val.split(/\s+/).some(word => word.length > 50) || 'Location contains a word longer than 50 characters'
                                                }
                                            })}
                                            placeholder="City or Region"
                                            className={`form-control !pl-14 ${errors.targetLocation ? 'border-red-500 focus:border-red-500' : ''}`}
                                        />
                                    </div>
                                    {errors.targetLocation && <p className="form-error">{errors.targetLocation.message as string}</p>}
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Image Upload */}
                                <div className="space-y-2">
                                    <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Ad Creative Image*</label>
                                    <div className="relative border-2 border-dashed border-slate-100 rounded-lg p-8 text-center bg-slate-50/50 group transition-all hover:bg-purple-50/30 hover:border-[#9146C1] cursor-pointer min-h-[180px] flex flex-col items-center justify-center">
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            accept="image/*"
                                            {...register('image', { required: 'Ad image is required' })}
                                        />
                                        <div className="flex flex-col items-center">
                                            {fileName ? (
                                                <>
                                                    <ImageIcon size={36} className="text-[#9146C1] mb-3" />
                                                    <p className="text-sm font-['AeonikMedium'] text-slate-800">{fileName}</p>
                                                    <span className="text-xs font-['AeonikMedium'] text-slate-400 mt-2 uppercase tracking-widest italic">Click to change</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={36} className="text-slate-200 group-hover:text-[#9146C1] mb-3 transition-colors" />
                                                    <p className="text-sm font-['AeonikMedium'] text-slate-400 group-hover:text-[#9146C1]">Upload Ad Banner</p>
                                                    <span className="text-[10px] font-['AeonikMedium'] text-slate-300 uppercase tracking-widest mt-2">Recommended: 1200x628px</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {errors.image && <p className="form-error">{errors.image.message}</p>}
                                </div>

                                {/* Duration & Budget */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Start Date*</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#9146C1] transition-colors">
                                                <Calendar size={18} />
                                            </div>
                                            <input
                                                type="date"
                                                min={new Date().toISOString().split('T')[0]}
                                                {...register('startDate', { required: 'Start date is required' })}
                                                className={`form-control !pl-14 ${errors.startDate ? 'border-red-500 focus:border-red-500' : ''}`}
                                            />
                                        </div>
                                        {errors.startDate && <p className="form-error">{errors.startDate.message as string}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">End Date*</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#9146C1] transition-colors">
                                                <Calendar size={18} />
                                            </div>
                                            <input
                                                type="date"
                                                {...register('endDate', { required: 'End date is required' })}
                                                className={`form-control !pl-14 ${errors.endDate ? 'border-red-500 focus:border-red-500' : ''}`}
                                            />
                                        </div>
                                        {errors.endDate && <p className="form-error">{errors.endDate.message as string}</p>}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="body-text-body-2 font-['AeonikMedium'] text-slate-800">Total Budget ($)*</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#9146C1] transition-colors">
                                            <DollarSign size={18} />
                                        </div>
                                        <input
                                            type="number"
                                            {...register('budget', {
                                                required: 'Budget is required',
                                                min: { value: 1, message: 'Budget must be greater than 0' },
                                                max: { value: 10000000, message: 'Budget cannot exceed $10,000,000' }
                                            })}
                                            placeholder="Enter amount"
                                            className={`form-control !pl-14 ${errors.budget ? 'border-red-500 focus:border-red-500' : ''}`}
                                        />
                                    </div>
                                    {errors.budget && <p className="form-error">{errors.budget.message as string}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-slate-50">
                            <button
                                type="button"
                                onClick={() => navigate('/ads/active')}
                                className="px-6 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-['AeonikMedium'] text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-medical !w-auto px-8"
                            >
                                Submit for Review
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateAd;
