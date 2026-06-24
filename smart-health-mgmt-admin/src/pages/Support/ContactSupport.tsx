"use client";

import { useState } from "react";
import {
    ChevronLeft,
    Plus,
    Mail,
    Phone,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    AlertCircle,
    Paperclip
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getFAQs } from "../../api/faqApi";
import type { FAQ } from "../../api/faqApi";
import { createTicket } from "../../api/supportApi";
import { toast } from "react-toastify";
import Modal from "../../components/common/Modal";

export default function ContactSupport() {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState<string | null>(null);
    const [showTicketForm, setShowTicketForm] = useState(false);
    const [successModal, setSuccessModal] = useState(false);
    const [formData, setFormData] = useState({ subject: "", description: "", priority: "medium" });

    const { data: faqs, isLoading } = useQuery({
        queryKey: ["faqs", false],
        queryFn: () => getFAQs(false),
    });

    const ticketMutation = useMutation({
        mutationFn: createTicket,
        onSuccess: () => {
            setSuccessModal(true);
            setShowTicketForm(false);
            setFormData({ subject: "", description: "", priority: "medium" });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to submit ticket");
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        ticketMutation.mutate(formData);
    };

    return (
        <div className="p-8 bg-white min-h-screen font-aeonik">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} className="text-gray-800" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Help & Support</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* FAQ Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-800">Frequently Asked Questions</h2>
                        <button
                            onClick={() => setShowTicketForm(true)}
                            className="text-sm font-bold text-[#734A97] hover:underline flex items-center gap-1"
                        >
                            <Plus size={16} /> Raise a Ticket
                        </button>
                    </div>

                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="py-12 text-center text-gray-400">Loading FAQs...</div>
                        ) : faqs?.length === 0 ? (
                            <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-100">
                                No FAQs available at the moment.
                            </div>
                        ) : faqs?.map((faq: FAQ) => (
                            <div
                                key={faq._id}
                                className="bg-white border border-gray-100 rounded-2xl overflow-hidden transition-all hover:border-purple-100"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === faq._id ? null : faq._id)}
                                    className="w-full p-5 text-left flex items-center justify-between gap-4"
                                >
                                    <span className="font-bold text-sm text-gray-800">{faq.question}</span>
                                    {openFaq === faq._id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                                </button>
                                {openFaq === faq._id && (
                                    <div className="px-5 pb-5 pt-0">
                                        <div className="h-px bg-gray-50 mb-4" />
                                        <p className="text-sm text-gray-500 leading-relaxed">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-[#734A97] to-[#8E65B1] rounded-3xl p-6 text-white shadow-xl shadow-purple-100">
                        <h3 className="font-bold text-lg mb-6">Contact Us</h3>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Support Email</p>
                                    <p className="text-sm font-bold mt-0.5">support@preciouspath.com</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                    <Phone size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Phone Number</p>
                                    <p className="text-sm font-bold mt-0.5">+1 (555) 123-4567</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                        <AlertCircle className="text-gray-400 mb-3" />
                        <h4 className="font-bold text-sm text-gray-800 mb-2">Notice</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Support requests are usually handled within 24-48 business hours. For urgent matters, please use the provided phone number.
                        </p>
                    </div>
                </div>
            </div>

            {/* Raise Ticket Modal */}
            <Modal
                open={showTicketForm}
                onClose={() => setShowTicketForm(false)}
                title="Raise a Support Ticket"
            >
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subject</label>
                        <input
                            required
                            name="subject"
                            value={formData.subject}
                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                            className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-100 outline-none"
                            placeholder="Brief summary of the issue"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</label>
                        <textarea
                            required
                            rows={4}
                            name="description"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-100 outline-none resize-none"
                            placeholder="Detailed explanation..."
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority</label>
                        <div className="flex gap-2">
                            {['low', 'medium', 'high'].map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, priority: p })}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${formData.priority === p
                                        ? 'bg-purple-100 border-purple-200 text-[#734A97]'
                                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50 text-center">
                        <Paperclip className="mx-auto w-5 h-5 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500 font-medium">Attach files (Image or PDF)</p>
                        <p className="text-[10px] text-gray-400 mt-1">Maximum size: 5MB</p>
                    </div>

                    <button
                        type="submit"
                        disabled={ticketMutation.isPending}
                        className="w-full bg-[#734A97] text-white py-4 rounded-xl font-bold shadow-lg shadow-purple-100 transition-all mt-4 disabled:opacity-50"
                    >
                        {ticketMutation.isPending ? "Submitting..." : "Submit Ticket"}
                    </button>
                </form>
            </Modal>

            {/* Success Modal */}
            <Modal open={successModal} onClose={() => setSuccessModal(false)}>
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Ticket Submitted!</h3>
                    <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                        Your support ticket has been submitted successfully. Our team will get back to you shortly.
                    </p>
                    <button
                        onClick={() => setSuccessModal(false)}
                        className="w-full py-3 bg-[#734A97] text-white rounded-xl font-bold shadow-lg shadow-purple-100 active:scale-95 transition-all"
                    >
                        Great, Thanks!
                    </button>
                </div>
            </Modal>
        </div>
    );
}
