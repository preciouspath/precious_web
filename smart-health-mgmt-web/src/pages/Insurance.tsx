import React, { useState, useEffect, useRef } from 'react';
import { getInsurances, addInsurance, updateInsurance, deleteInsurance } from '../api/insuranceApi';
import { toast } from 'react-toastify';
import Loader from '../components/common/Loader';
import { formatUploadUrl } from '../utils/urlHelper';

interface InsuranceData {
    _id: string;
    patientName: string;
    contactInfo: string;
    insuranceCompany: string;
    insuranceType: string;
    documentUrl: string;
    fileName: string;
    fileType: string;
    dateAdded: string;
}

const Insurance: React.FC = () => {
    const [insurances, setInsurances] = useState<InsuranceData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [errors, setErrors] = useState<any>({});

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form states
    const [formData, setFormData] = useState({
        patientName: '',
        company: '',
        type: '',
        contact: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        fetchInsurances();
    }, []);

    const fetchInsurances = async () => {
        try {
            setIsLoading(true);
            const res = await getInsurances();
            if (res.data?.success) {
                setInsurances(res.data.data);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to fetch insurances");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Character limits and space prevention
        if (name === 'patientName' && value.length > 50) return;
        if (name === 'company' && value.length > 100) return;
        if (name === 'contact' && value.length > 100) return;

        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user types
        if (errors[name]) {
            setErrors((prev: any) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            if (errors.document) {
                setErrors((prev: any) => {
                    const newErrors = { ...prev };
                    delete newErrors.document;
                    return newErrors;
                });
            }
        }
    };

    const validateForm = () => {
        const newErrors: any = {};

        if (!formData.patientName.trim()) {
            newErrors.patientName = "Patient name is required";
        } else if (formData.patientName.length < 3) {
            newErrors.patientName = "Name is too short";
        }

        if (!formData.contact.trim()) {
            newErrors.contact = "Contact information is required";
        } else {
            // Basic email or phone validation
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact);
            const isPhone = /^\+?[1-9]\d{1,14}$/.test(formData.contact.replace(/\s/g, ''));
            if (!isEmail && !isPhone) {
                newErrors.contact = "Please enter a valid email or phone number";
            }
        }

        if (!formData.company.trim()) {
            newErrors.company = "Insurance company is required";
        }

        if (!formData.type) {
            newErrors.type = "Please select insurance type";
        }

        if (!editingId && !selectedFile) {
            newErrors.document = "Insurance document is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const openEditModal = (insurance: InsuranceData) => {
        setEditingId(insurance._id);
        setFormData({
            patientName: insurance.patientName,
            company: insurance.insuranceCompany,
            type: insurance.insuranceType,
            contact: insurance.contactInfo
        });
        setErrors({});
        setShowAddModal(true);
    };

    const resetForm = () => {
        setFormData({ patientName: '', company: '', type: '', contact: '' });
        setSelectedFile(null);
        setEditingId(null);
        setErrors({});
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setIsProcessing(true);
            const data = new FormData();
            data.append('patientName', formData.patientName);
            data.append('contactInfo', formData.contact);
            data.append('insuranceCompany', formData.company);
            data.append('insuranceType', formData.type);
            if (selectedFile) {
                data.append('document', selectedFile);
            }

            let res;
            if (editingId) {
                res = await updateInsurance(editingId, data);
            } else {
                res = await addInsurance(data);
            }

            if (res.data?.success) {
                toast.success(res.data?.message);
                setShowAddModal(false);
                resetForm();
                fetchInsurances();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Operation failed");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!showDeleteModal) return;

        try {
            setIsProcessing(true);
            const res = await deleteInsurance(showDeleteModal);
            if (res.data?.success) {
                toast.success("Insurance record removed");
                setShowDeleteModal(null);
                fetchInsurances();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete insurance");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleViewDocument = (url: string) => {
        const fullUrl = formatUploadUrl(url);
        window.open(fullUrl, '_blank');
    };

    if (isLoading && !insurances.length) {
        return <Loader text="Loading insurances..." />;
    }

    return (
        <section className="py-10 lg:py-18">
            <div className="container">
                <div className='bg-white rounded-[15px]'>
                    <div className="flex justify-between items-center mb-[20px] p-[15px] border-b border-[#F1F5F9]">
                        <h1 className="headings-web-h4-headline bold text-[#374151]">Insurance Management</h1>
                        {insurances.length > 0 && (
                            <button
                                onClick={() => { resetForm(); setShowAddModal(true); }}
                                className="btn"
                            >
                                Add Insurance
                            </button>
                        )}
                    </div>

                    <div className='p-[15px] md:p-[20px] !pt-0'>
                        {insurances.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 text-center">
                                <div className="w-20 h-20 bg-[#F3E8FF] rounded-full flex items-center justify-center mb-6">
                                    <img src={"/images/Group.png"} alt="" />
                                </div>
                                <h3 className="headings-web-h4-headline !text-[#374151] mb-6">No insurance added yet.</h3>
                                <button
                                    onClick={() => { resetForm(); setShowAddModal(true); }}
                                    className="btn min-w-[207px]"
                                >
                                    Add Insurance
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                                {insurances.map(item => (
                                    <div key={item._id} className="relative bg-white p-[15px] rounded-[10px] border border-[#F1F5F9] flex flex-col group transition-all hover:border-purple-200 hover:shadow-sm">
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            <button
                                                onClick={() => openEditModal(item)}
                                                className="w-[30px] h-[30px] bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-all"
                                                title="Edit"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteModal(item._id)}
                                                className="w-[30px] h-[30px] bg-red-50 rounded-full flex items-center justify-center text-red-600 hover:bg-red-100 transition-all"
                                                title="Delete"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                        </div>

                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-[54px] h-[54px] bg-[#F5E7FF] rounded-lg flex items-center justify-center shrink-0">
                                                <img src={"/images/Group.png"} alt="" className="w-8 h-8 opacity-60" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[14px] text-[#62748E] medium">{item.patientName}</p>
                                                <h4 className="headings-h5-headline text-[#374151] bold">{item.insuranceCompany}</h4>
                                                <p className="text-[12px] text-slate-400">Added on: {new Date(item.dateAdded).toLocaleDateString('en-GB')}</p>
                                            </div>
                                        </div>

                                        <div className="mt-auto space-y-3 pt-[15px] border-t border-[#F1F5F9]">
                                            <div className="flex justify-between items-center text-[14px]">
                                                <span className="text-[#62748E]">Type: <span className="text-slate-900 medium">{item.insuranceType}</span></span>
                                                <button
                                                    onClick={() => handleViewDocument(item.documentUrl)}
                                                    className="text-[#9146C1] hover:underline font-medium flex items-center gap-1"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                    View Document
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

            {/* Form Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[2000] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-[510px] rounded-[15px] overflow-hidden animate-in fade-in zoom-in duration-300 relative shadow-2xl">
                        <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-950 transition-colors">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                        </button>

                        <div className="p-8">
                            <h3 className="headings-web-h5-headline text-slate-800 mb-6 font-bold">{editingId ? 'Edit Insurance' : 'Add Insurance'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="form-group">
                                    <label className="text-sm text-slate-600 mb-1 block">Patient Name</label>
                                    <input
                                        type="text"
                                        name="patientName"
                                        value={formData.patientName}
                                        onChange={handleInputChange}
                                        className={`form-control ${errors.patientName ? 'border-red-500' : ''}`}
                                        placeholder="Enter patient name"
                                    />
                                    {errors.patientName && <p className="!text-red-500 text-xs mt-1">{errors.patientName}</p>}
                                </div>
                                <div className="form-group">
                                    <label className="text-sm text-slate-600 mb-1 block">Email / Contact Number</label>
                                    <input
                                        type="text"
                                        name="contact"
                                        value={formData.contact}
                                        onChange={handleInputChange}
                                        className={`form-control ${errors.contact ? 'border-red-500' : ''}`}
                                        placeholder="Enter email / contact number"
                                    />
                                    {errors.contact && <p className="!text-red-500 text-xs mt-1">{errors.contact}</p>}
                                </div>
                                <div className="form-group">
                                    <label className="text-sm text-slate-600 mb-1 block">Insurance Company</label>
                                    <input
                                        type="text"
                                        name="company"
                                        value={formData.company}
                                        onChange={handleInputChange}
                                        className={`form-control ${errors.company ? 'border-red-500' : ''}`}
                                        placeholder="Enter insurance company"
                                    />
                                    {errors.company && <p className="!text-red-500 text-xs mt-1">{errors.company}</p>}
                                </div>
                                <div className="form-group">
                                    <label className="text-sm text-slate-600 mb-1 block">Insurance Type</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        className={`form-control bg-white ${errors.type ? 'border-red-500' : ''}`}
                                    >
                                        <option value="">Select Type</option>
                                        <option value="Individual">Individual</option>
                                        <option value="Family">Family</option>
                                        <option value="Group">Group</option>
                                        <option value="Health">Health</option>
                                        <option value="Life">Life</option>
                                    </select>
                                    {errors.type && <p className="!text-red-500 text-xs mt-1">{errors.type}</p>}
                                </div>
                                <div className="form-group">
                                    <label className="text-sm text-slate-600 mb-1 block">Insurance Document</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`w-full px-4 py-3 rounded-xl border flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors bg-slate-50/50 ${errors.document ? 'border-red-500' : 'border-slate-200'}`}
                                    >
                                        <span className="text-slate-500 truncate max-w-[300px]">
                                            {selectedFile ? selectedFile.name : 'Upload document (PDF, Images)'}
                                        </span>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9146C1" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="17 8 12 3 7 8"></polyline>
                                            <line x1="12" y1="3" x2="12" y2="15"></line>
                                        </svg>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                            accept="image/*,.pdf"
                                        />
                                    </div>
                                    {errors.document && <p className="!text-red-500 text-xs mt-1">{errors.document}</p>}
                                    {editingId && !selectedFile && !errors.document && (
                                        <p className="text-[11px] text-slate-400 mt-1">Leave blank to keep existing document</p>
                                    )}
                                </div>
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isProcessing}
                                        className="btn w-full py-4 shadow-lg shadow-purple-200"
                                    >
                                        {isProcessing ? 'Saving...' : editingId ? 'Update Insurance' : 'Save Insurance'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal !== null && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[2100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-[420px] rounded-[15px] overflow-hidden animate-in fade-in zoom-in duration-300 relative text-center shadow-2xl p-8">
                        <div className="w-[70px] h-[70px] bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </div>
                        <h3 className="headings-web-h4-headline text-slate-800 mb-2 font-bold">Delete Insurance?</h3>
                        <p className="text-slate-500 mb-8">Are you sure you want to remove this insurance record? This action cannot be undone.</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowDeleteModal(null)}
                                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isProcessing}
                                className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all disabled:opacity-50"
                            >
                                {isProcessing ? '...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Insurance;
