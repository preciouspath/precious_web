import React, { useState } from 'react';

const RaiseTicket: React.FC = () => {
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        file: null as File | null,
    });

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFormData(prev => ({ ...prev, file }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Ticket raised:', formData);
        alert('Ticket submitted successfully! We will get back to you soon.');
    };

    return (
        <section className="py-10 lg:py-18">
            <div className="container">
                <div className="bg-white rounded-[15px]">

                    {/* Header */}
                    <div className="flex justify-between items-center p-[15px] border-b border-[#F1F5F9]">
                        <h1 className="headings-web-h4-headline bold text-[var(--color-gray-700)]">
                            Raise a Ticket
                        </h1>
                    </div>

                    {/* Form */}
                    <div className="p-[15px] md:p-[20px]">
                        <form
                            onSubmit={handleSubmit}
                            className="w-full"
                        >
                            <div className="space-y-6">

                                {/* Subject */}
                                <div className="form-group">
                                    <label className="block text-[14px] font-['AeonikMedium'] text-slate-700 mb-2 font-bold">
                                        Subject
                                    </label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="Enter subject"
                                        required
                                    />
                                </div>

                                {/* Upload */}
                                <div className="form-group">
                                    <label className="block text-[14px] font-['AeonikMedium'] text-slate-700 mb-2 font-bold">
                                        Upload (Image or PDF)
                                    </label>

                                    <label className="form-control flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                                        <span className="text-slate-400 text-[14px]">
                                            {formData.file
                                                ? formData.file.name
                                                : 'Upload file'}
                                        </span>

                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#94A3B8"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="17 8 12 3 7 8"></polyline>
                                            <line x1="12" y1="3" x2="12" y2="15"></line>
                                        </svg>

                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>

                                {/* Description */}
                                <div className="form-group">
                                    <label className="block text-[14px] font-['AeonikMedium'] text-slate-700 mb-2 font-bold">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="form-control min-h-[150px] resize-none"
                                        placeholder="Please describe your issue..."
                                        required
                                    />
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="mt-8">
                                <button
                                    type="submit"
                                    className="btn min-w-[170px]"
                                >
                                    Submit Ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default RaiseTicket;
