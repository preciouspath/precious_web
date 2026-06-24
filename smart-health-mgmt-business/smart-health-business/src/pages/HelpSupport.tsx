import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { getMyTickets, raiseTicket, getTicketDetails, respondToTicket, getFAQs } from '../api/supportApi';
import { toast } from 'react-toastify';
import {
    MessageSquare,
    Plus,
    Clock,
    CheckCircle2,
    AlertCircle,
    Send,
    ChevronRight,
    Search,
    X
} from 'lucide-react';
import Loader from '../components/common/Loader';

type RaiseTicketForm = {
    subject: string;
    description: string;
    priority: string;
};

const HelpSupport: React.FC = () => {
    const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [responseMessage, setResponseMessage] = useState('');
    const [activeTab, setActiveTab] = useState<'tickets' | 'faq'>('tickets');

    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<RaiseTicketForm>({
        defaultValues: { priority: 'medium' }
    });

    const selectedPriority = watch('priority');

    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const queryClient = useQueryClient();

    const { data: faqsData, isLoading: isFaqsLoading } = useQuery({
        queryKey: ['faqs'],
        queryFn: getFAQs,
        select: (res) => res.data.data
    });

    const { data: ticketsData, isLoading: isTicketsLoading } = useQuery({
        queryKey: ['my-tickets'],
        queryFn: getMyTickets,
        select: (res) => res.data.data
    });

    const { data: ticketDetails, isLoading: isDetailsLoading } = useQuery({
        queryKey: ['ticket-details', selectedTicketId],
        queryFn: () => getTicketDetails(selectedTicketId!),
        enabled: !!selectedTicketId,
        select: (res) => res.data.data
    });

    const raiseMutation = useMutation({
        mutationFn: (data: any) => {
            const formData = new FormData();
            formData.append('subject', data.subject);
            formData.append('description', data.description);
            formData.append('priority', data.priority);
            // If we add attachments later, they goes here
            return raiseTicket(formData);
        },
        onSuccess: () => {
            toast.success('Ticket raised successfully');
            setIsRaiseModalOpen(false);
            reset();
            queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
        },
        onError: () => toast.error('Failed to raise ticket')
    });

    const respondMutation = useMutation({
        mutationFn: (data: { id: string, message: string }) => respondToTicket(data.id, data.message),
        onSuccess: () => {
            toast.success('Response sent');
            setResponseMessage('');
            queryClient.invalidateQueries({ queryKey: ['ticket-details', selectedTicketId] });
        },
        onError: () => toast.error('Failed to send response')
    });

    const handleRaiseSubmit = (data: RaiseTicketForm) => {
        raiseMutation.mutate(data);
    };

    const handleRespondSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!responseMessage.trim() || !selectedTicketId) return;

        if (responseMessage.length > 500) {
            toast.error('Response must be less than 500 characters');
            return;
        }

        if (responseMessage.split(/\s+/).some(word => word.length > 50)) {
            toast.error('Response contains a word longer than 50 characters');
            return;
        }

        respondMutation.mutate({ id: selectedTicketId, message: responseMessage });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'open': return <AlertCircle className="text-blue-500" size={18} />;
            case 'in-progress': return <Clock className="text-amber-500" size={18} />;
            case 'resolved': return <CheckCircle2 className="text-emerald-500" size={18} />;
            case 'closed': return <CheckCircle2 className="text-slate-400" size={18} />;
            default: return <AlertCircle size={18} />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'medium': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'low': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto font-['AeonikRegular'] relative pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="headings-web-h4-headline text-slate-900">Help & Support</h1>
                    <p className="body-text-body-2 text-slate-500 mt-1">Raise tickets and get assistance from our team</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('tickets')}
                            className={`px-6 py-2 rounded-lg text-xs font-['AeonikBold'] uppercase tracking-widest transition-all ${activeTab === 'tickets' ? 'bg-white text-[#9146C1] shadow-sm' : 'text-slate-500'}`}
                        >
                            Tickets
                        </button>
                        <button
                            onClick={() => setActiveTab('faq')}
                            className={`px-6 py-2 rounded-lg text-xs font-['AeonikBold'] uppercase tracking-widest transition-all ${activeTab === 'faq' ? 'bg-white text-[#9146C1] shadow-sm' : 'text-slate-500'}`}
                        >
                            FAQ
                        </button>
                    </div>
                    <button
                        onClick={() => setIsRaiseModalOpen(true)}
                        className="btn-medical flex items-center gap-2 px-6 !w-auto"
                    >
                        <Plus size={20} /> Raise Ticket
                    </button>
                </div>
            </div>

            {activeTab === 'faq' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {isFaqsLoading ? <Loader text="Loading FAQs..." /> : faqsData?.map((faq: any, idx: number) => (
                            <div key={idx} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                                <button
                                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                                    className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
                                >
                                    <span className="font-['AeonikBold'] text-slate-800">{faq.question}</span>
                                    <ChevronRight className={`text-slate-400 transition-transform ${expandedFaq === idx ? 'rotate-90' : ''}`} size={20} />
                                </button>
                                {expandedFaq === idx && (
                                    <div className="p-6 pt-0 text-sm text-slate-500 leading-relaxed font-['AeonikMedium'] border-t border-slate-50">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="lg:col-span-1">
                        <div className="bg-[#C69BE5] rounded-2xl p-8 text-white">
                            <h3 className="headings-web-h6-headline mb-4 text-white">Need more help?</h3>
                            <p className="text-white text-sm mb-8 leading-relaxed font-['AeonikMedium']">Our dedicated support team is available 24/7 to assist you with any questions or issues.</p>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                                        <MessageSquare size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-[#F5E6FF] font-['AeonikBold']">Email us at</p>
                                        <p className="text-sm font-['AeonikBold'] text-white">support@smarthealth.com</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-[#F5E6FF] font-['AeonikBold']">Response Time</p>
                                        <p className="text-sm font-['AeonikBold'] text-white">Under 2 hours</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-250px)]">
                    {/* Tickets List */}
                    <div className="lg:col-span-1 bg-white rounded-lg border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
                        <div className="p-4 border-b border-slate-50 bg-slate-50/30">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search tickets..."
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-100"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {isTicketsLoading ? (
                                <div className="flex justify-center p-10"><Loader text="Loading..." /></div>
                            ) : ticketsData?.length === 0 ? (
                                <div className="text-center p-10">
                                    <MessageSquare className="mx-auto text-slate-200 mb-4" size={48} />
                                    <p className="text-slate-400 text-sm">No tickets found</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {ticketsData?.map((ticket: any) => (
                                        <button
                                            key={ticket._id}
                                            onClick={() => setSelectedTicketId(ticket._id)}
                                            className={`w-full text-left p-4 hover:bg-slate-50 transition-colors group flex items-start gap-4 ${selectedTicketId === ticket._id ? 'bg-purple-50/50 border-r-4 border-purple-500' : ''}`}
                                        >
                                            <div className="mt-1">{getStatusIcon(ticket.status)}</div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="font-['AeonikBold'] text-slate-900 text-[14px] truncate">{ticket.subject}</h4>
                                                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-slate-500 text-[12px] truncate mt-1">{ticket.description}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`text-[9px] uppercase tracking-widest font-['AeonikBold'] px-2 py-0.5 rounded border ${getPriorityColor(ticket.priority)}`}>
                                                        {ticket.priority}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">{ticket.ticketId}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className={`text-slate-300 group-hover:text-purple-500 transition-colors mt-2 ${selectedTicketId === ticket._id ? 'text-purple-500' : ''}`} size={16} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ticket Details / Chat */}
                    <div className="lg:col-span-2 bg-white rounded-lg border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden relative">
                        {!selectedTicketId ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                                <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-6">
                                    <MessageSquare className="text-purple-500" size={32} />
                                </div>
                                <h3 className="headings-web-h6-headline text-slate-900">Select a ticket to view conversation</h3>
                                <p className="body-text-body-2 text-slate-500 mt-2 max-w-sm">Our support team is here to help you. Choose a ticket from the left or raise a new one.</p>
                            </div>
                        ) : isDetailsLoading ? (
                            <div className="flex-1 flex items-center justify-center"><Loader text="Fetching conversion..." /></div>
                        ) : (
                            <>
                                <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            {getStatusIcon(ticketDetails.status)}
                                            <h3 className="headings-web-h6-headline text-slate-900">{ticketDetails.subject}</h3>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-['AeonikBold']">Ticket ID: {ticketDetails.ticketId}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[10px] uppercase tracking-widest font-['AeonikBold'] px-3 py-1 rounded-full border ${getPriorityColor(ticketDetails.priority)}`}>
                                            {ticketDetails.priority} Priority
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {/* Initial Description */}
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                            <Search size={20} className="text-slate-400" />
                                        </div>
                                        <div className="bg-slate-50 rounded-2xl rounded-tl-none p-4 max-w-[80%]">
                                            <p className="text-slate-900 text-sm leading-relaxed">{ticketDetails.description}</p>
                                            <p className="text-[10px] text-slate-400 mt-2">{new Date(ticketDetails.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    {ticketDetails.messages?.map((msg: any, idx: number) => {
                                        const isAdmin = msg.senderRole === 'admin';
                                        return (
                                            <div key={idx} className={`flex gap-4 ${isAdmin ? '' : 'flex-row-reverse'}`}>
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isAdmin ? 'bg-purple-100' : 'bg-slate-100'}`}>
                                                    {isAdmin ? <img src="/images/logo-icon.svg" className="w-6" alt="admin" /> : <Plus size={20} className="text-slate-400" />}
                                                </div>
                                                <div className={`${isAdmin ? 'bg-purple-50 text-slate-50 rounded-tl-none' : 'bg-slate-50 text-white rounded-tr-none'} rounded-2xl p-4 max-w-[80%]`}>
                                                    <p className="text-sm leading-relaxed">{msg.message}</p>
                                                    <p className={`text-[10px] mt-2 ${isAdmin ? 'text-purple-400' : 'text-slate-400'}`}>{new Date(msg.createdAt).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Response Input */}
                                <div className="p-6 border-t border-slate-100 bg-white">
                                    {ticketDetails.status === 'closed' ? (
                                        <div className="text-center py-2 bg-slate-50 rounded-lg text-slate-400 text-sm font-['AeonikBold'] uppercase tracking-widest">
                                            This ticket is closed
                                        </div>
                                    ) : (
                                        <form onSubmit={handleRespondSubmit} className="relative">
                                            <textarea
                                                value={responseMessage}
                                                onChange={(e) => setResponseMessage(e.target.value)}
                                                placeholder="Write your response..."
                                                className="w-full pr-14 pl-4 py-4 bg-slate-50 border-none outline-none rounded-2xl text-sm focus:ring-2 focus:ring-purple-100 min-h-[80px] resize-none"
                                                maxLength={500}
                                            />
                                            <button
                                                type="submit"
                                                disabled={respondMutation.isPending || !responseMessage.trim()}
                                                className="absolute right-3 bottom-3 p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                            >
                                                {respondMutation.isPending ? <Loader text="" minHeight="auto" /> : <Send size={20} />}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Raise Ticket Modal */}
            {
                isRaiseModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsRaiseModalOpen(false)}></div>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
                            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                                <h3 className="headings-web-h6-headline">Raise a New Ticket</h3>
                                <button onClick={() => setIsRaiseModalOpen(false)} className="text-white/70 hover:text-white bg-transparent border-none cursor-pointer"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSubmit(handleRaiseSubmit)} className="p-6 space-y-5" noValidate>
                                <div className="form-group">
                                    <label className="text-sm font-['AeonikBold'] text-slate-800 mb-1 block">Subject</label>
                                    <input
                                        type="text"
                                        {...register('subject', {
                                            required: 'Subject is required',
                                            validate: {
                                                notEmpty: (val) => val.trim().length > 0 || 'Subject cannot be empty or only spaces',
                                                noLongWords: (val) => !val.split(/\s+/).some(word => word.length > 50) || 'Subject contains a word longer than 50 characters'
                                            },
                                            maxLength: { value: 50, message: 'Subject must be less than 50 characters' }
                                        })}
                                        placeholder="Brief summary of the issue"
                                        className={`form-control ${errors.subject ? 'border-red-500' : ''}`}
                                    />
                                    {errors.subject && <p className="!text-red-500 text-[10px] mt-1">{errors.subject.message}</p>}
                                </div>
                                <div className="form-group">
                                    <label className="text-sm font-['AeonikBold'] text-slate-800 mb-1 block">Priority Level</label>
                                    <div className="grid grid-cols-3 gap-3 mt-2">
                                        {['low', 'medium', 'high'].map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setValue('priority', p)}
                                                className={`py-2 rounded-xl text-[12px] font-['AeonikBold'] uppercase tracking-widest border transition-all ${selectedPriority === p ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'}`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="text-sm font-['AeonikBold'] text-slate-800 mb-1 block">Description</label>
                                    <textarea
                                        {...register('description', {
                                            required: 'Description is required',
                                            validate: {
                                                notEmpty: (val) => val.trim().length > 0 || 'Description cannot be empty or only spaces',
                                                noLongWords: (val) => !val.split(/\s+/).some(word => word.length > 50) || 'Description contains a word longer than 50 characters'
                                            },
                                            maxLength: { value: 500, message: 'Description must be less than 500 characters' }
                                        })}
                                        placeholder="Detail your problem or question..."
                                        className={`form-control h-32 py-4 resize-none ${errors.description ? 'border-red-500' : ''}`}
                                    />
                                    {errors.description && <p className="!text-red-500 text-[10px] mt-1">{errors.description.message}</p>}
                                </div>
                                <button
                                    type="submit"
                                    disabled={raiseMutation.isPending}
                                    className="w-full btn-medical flex items-center justify-center gap-2 py-4"
                                >
                                    {raiseMutation.isPending ? <Loader text="Submitting..." minHeight="auto" /> : <><Plus size={20} /> Raise Ticket</>}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default HelpSupport;
