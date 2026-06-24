"use client";

import { useState } from "react";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFAQs, createFAQ, updateFAQ, deleteFAQ } from "../../api/faqApi";
import type { FAQ } from "../../api/faqApi";
import Modal from "../../components/common/Modal";
import { toast } from "react-toastify";

const CATEGORIES = ["General", "Technical", "Billing", "Account"];

export default function FAQManagement() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [faqToDelete, setFaqToDelete] = useState<string | null>(null);
    const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
    const [formData, setFormData] = useState<{
        question: string;
        answer: string;
        category: "General" | "Technical" | "Billing" | "Account";
        status: "active" | "inactive";
    }>({
        question: "",
        answer: "",
        category: "General",
        status: "active"
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const { data: faqs, isLoading } = useQuery({
        queryKey: ["faqs", true],
        queryFn: () => getFAQs(true),
    });

    const createMutation = useMutation({
        mutationFn: createFAQ,
        onSuccess: () => {
            toast.success("FAQ created");
            setOpenModal(false);
            queryClient.invalidateQueries({ queryKey: ["faqs"] });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<FAQ> }) => updateFAQ(id, data),
        onSuccess: () => {
            toast.success("FAQ updated");
            setOpenModal(false);
            queryClient.invalidateQueries({ queryKey: ["faqs"] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteFAQ,
        onSuccess: () => {
            toast.success("FAQ deleted");
            setOpenDeleteModal(false);
            setFaqToDelete(null);
            queryClient.invalidateQueries({ queryKey: ["faqs"] });
        }
    });

    const handleDeleteClick = (id: string) => {
        setFaqToDelete(id);
        setOpenDeleteModal(true);
    };

    const confirmDelete = () => {
        if (faqToDelete) {
            deleteMutation.mutate(faqToDelete);
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.question.trim()) {
            newErrors.question = "Question is required";
        } else if (formData.question.length > 100) {
            newErrors.question = "Question cannot exceed 100 characters";
        }

        if (!formData.answer.trim()) {
            newErrors.answer = "Answer is required";
        } else if (formData.answer.length > 100) {
            newErrors.answer = "Answer cannot exceed 100 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        if (editingFaq) {
            updateMutation.mutate({ id: editingFaq._id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const filteredFaqs = faqs?.filter((f: FAQ) =>
        f.question.toLowerCase().includes(search.toLowerCase()) ||
        f.answer.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 bg-white min-h-screen font-aeonik">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">FAQ Management</h1>
                    <p className="text-sm text-gray-500">Manage frequently asked questions for all panels</p>
                </div>
                <button
                    onClick={() => {
                        setEditingFaq(null);
                        setFormData({ question: "", answer: "", category: "General", status: "active" });
                        setErrors({});
                        setOpenModal(true);
                    }}
                    className="flex items-center text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-100 hover:opacity-90 transition-all bg-[#734A97]"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add FAQ
                </button>
            </div>

            <div className="relative max-w-md mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search FAQs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-gray-50 border-none rounded-xl pl-11 pr-4 py-3 w-full text-sm focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                />
            </div>

            {!isLoading && (!filteredFaqs || filteredFaqs.length === 0) ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="text-gray-300 w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">No FAQs found</h3>
                    <p className="text-sm text-gray-400 max-w-xs mx-auto">
                        {search ? `We couldn't find any results matching "${search}".` : "Start by adding your first frequently asked question."}
                    </p>
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="mt-4 text-sm font-bold text-[#734A97] hover:underline"
                        >
                            Clear search
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-aeonik">
                    <div className="overflow-x-auto text-aeonik">
                        <table className="w-full text-left text-aeonik">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-aeonik w-[45%]">Question & Category</th>
                                    <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-aeonik w-[35%]">Answer</th>
                                    <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-aeonik w-[10%]">Status</th>
                                    <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center text-aeonik w-[10%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="p-12">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className="w-8 h-8 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
                                                <p className="text-sm text-gray-400 font-medium tracking-tight">Loading FAQs...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredFaqs?.map((faq: FAQ) => (
                                    <tr key={faq._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-5 align-top">
                                            <p className="font-bold text-gray-800 text-sm break-all line-clamp-1">{faq.question}</p>
                                            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded mt-1 inline-block uppercase tracking-wider">
                                                {faq.category}
                                            </span>
                                        </td>
                                        <td className="p-5 align-top">
                                            <p className="text-sm text-gray-500 line-clamp-2 break-all">{faq.answer}</p>
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${faq.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {faq.status}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex justify-center gap-1">
                                                <button
                                                    onClick={() => {
                                                        setEditingFaq(faq);
                                                        setFormData({ question: faq.question, answer: faq.answer, category: faq.category, status: faq.status });
                                                        setErrors({});
                                                        setOpenModal(true);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-blue-500"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(faq._id)}
                                                    className="p-2 text-gray-400 hover:text-rose-500"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal open={openModal} onClose={() => setOpenModal(false)} title={editingFaq ? "Edit FAQ" : "Add FAQ"}>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Question</label>
                            <span className={`text-[10px] font-bold ${formData.question.length >= 100 ? 'text-rose-500' : 'text-gray-300'}`}>
                                {formData.question.length}/100
                            </span>
                        </div>
                        <input
                            maxLength={100}
                            value={formData.question}
                            onChange={e => {
                                const val = e.target.value;
                                if (val.length <= 100) {
                                    setFormData({ ...formData, question: val });
                                    if (errors.question) setErrors({ ...errors, question: "" });
                                }
                            }}
                            className={`w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-2 outline-none transition-all ${errors.question ? 'ring-2 ring-rose-100' : 'focus:ring-purple-100'}`}
                            placeholder="e.g., How do I reset my password?"
                        />
                        {errors.question && <p className="text-[10px] font-bold text-rose-500 mt-1 pl-1">{errors.question}</p>}
                        {formData.question.length >= 100 && !errors.question && <p className="text-[10px] font-bold text-rose-400 mt-1 pl-1 italic">Maximum length of 100 reached</p>}
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Answer</label>
                            <span className={`text-[10px] font-bold ${formData.answer.length >= 100 ? 'text-rose-500' : 'text-gray-300'}`}>
                                {formData.answer.length}/100
                            </span>
                        </div>
                        <textarea
                            rows={4}
                            maxLength={100}
                            value={formData.answer}
                            onChange={e => {
                                const val = e.target.value;
                                if (val.length <= 100) {
                                    setFormData({ ...formData, answer: val });
                                    if (errors.answer) setErrors({ ...errors, answer: "" });
                                }
                            }}
                            className={`w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-2 outline-none transition-all resize-none ${errors.answer ? 'ring-2 ring-rose-100' : 'focus:ring-purple-100'}`}
                            placeholder="Provide a clear answer..."
                        />
                        {errors.answer && <p className="text-[10px] font-bold text-rose-500 mt-1 pl-1">{errors.answer}</p>}
                        {formData.answer.length >= 100 && !errors.answer && <p className="text-[10px] font-bold text-rose-400 mt-1 pl-1 italic">Maximum length of 100 reached</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-100 outline-none"
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-100 outline-none"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending || !formData.question.trim() || !formData.answer.trim()}
                        className="w-full bg-[#734A97] text-white py-4 rounded-xl font-bold shadow-lg shadow-purple-100 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {createMutation.isPending || updateMutation.isPending ? "Saving..." : (editingFaq ? "Update FAQ" : "Create FAQ")}
                    </button>
                </form>
            </Modal>

            <Modal open={openDeleteModal} onClose={() => setOpenDeleteModal(false)} title="Delete FAQ">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="text-rose-500 w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Are you sure?</h3>
                    <p className="text-sm text-gray-500 mb-8">
                        This action cannot be undone. This FAQ will be permanently removed from all systems.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setOpenDeleteModal(false)}
                            className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            disabled={deleteMutation.isPending}
                            className="flex-1 px-6 py-3 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-100 hover:bg-rose-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {deleteMutation.isPending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Deleting...
                                </>
                            ) : "Yes, Delete"}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
